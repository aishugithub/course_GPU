//@@META
{"unit": "3.C", "module": 3, "title": "Capstone: Map a Job onto a GPU", "icon": "🏆", "lab": "Lab3_Inside_a_GPU.ipynb", "labNo": "3", "gpu": true}
//@@WIDGETS

const T4 = { sms: 40, warpsPerSM: 32, peak: 8.1e12, bw: 320e9 };
function plan(job, B, N) {
  const outputs = job === "relu" ? B * N : B * N;          // one thread per output element
  const flops = job === "relu" ? B * N : 2 * B * N * N;
  const bytes = job === "relu" ? 2 * B * N * 4 : (B * N + N * N + B * N) * 4;
  const warps = Math.ceil(outputs / 32);
  const resident = T4.sms * T4.warpsPerSM;
  const waves = Math.ceil(warps / resident);
  const tCompute = flops / T4.peak, tMemory = bytes / T4.bw;
  return { outputs, flops, bytes, warps, resident, waves, tCompute, tMemory, bound: tCompute > tMemory ? "compute" : "memory" };
}
const tf = (s) => (s < 1e-3 ? `${(s * 1e6).toFixed(1)} µs` : `${(s * 1e3).toFixed(2)} ms`);

// ── Section 1: The Mission ──
const TOOLS = [
  ["One thread per output element (SIMT)", "Unit 2.3"],
  ["Threads are grouped into warps of 32", "Units 2.3, 3.2"],
  ["The T4 has 40 SMs, each holding up to 32 warps at once", "Units 3.1, 3.3"],
  ["Compute time ≥ FLOPs ÷ peak FLOPS", "Units 1.1, 3.1"],
  ["Memory time ≥ bytes ÷ bandwidth (if coalesced)", "Unit 3.4"],
  ["Keep warps from diverging", "Unit 3.2"],
];
function MissionWidget() {
  const [ticks, setTicks] = useState([]);
  return (
    <div>
      <Frame>
        The AI lab's T4 will run one layer of a model: a <b style={{ color: C.accent }}>matrix multiply</b> (B inputs × a 4096 × 4096 weight matrix) followed
        by a <b style={{ color: C.green }}>ReLU</b>. Before anyone writes code, your team lead wants a plan: how many threads and warps, how they fill the 40 SMs,
        how many bytes and FLOPs, the expected time, and what limits it.
      </Frame>
      {TOOLS.map(([t, u], i) => {
        const on = ticks.includes(i);
        return (
          <div key={i} onClick={() => setTicks((s) => (on ? s.filter((x) => x !== i) : [...s, i]))} style={{ display: "flex", gap: 10, alignItems: "center", background: C.card, border: `1.5px solid ${on ? C.green : C.border}`, borderRadius: 8, padding: "9px 12px", marginBottom: 7, cursor: "pointer" }}>
            <span style={{ fontSize: 16 }}>{on ? "✅" : "⬜"}</span>
            <span style={{ flex: 1, color: C.text, fontSize: 13 }}>{t}</span>
            <span style={{ color: C.accent, fontSize: 12, fontFamily: "monospace" }}>{u}</span>
          </div>
        );
      })}
      <Insight color={C.green} title="This is how GPU engineers think before writing a single line: threads, warps, bytes, FLOPs.">
        The plan tells you what speed is even possible, and which limit (compute or memory) you're fighting.
      </Insight>
    </div>
  );
}

// ── Section 2: Build in Steps ──
const VERSIONS = [
  { tag: "v1", title: "Threads and warps", color: C.teal, why: "Start with SIMT thinking: one thread per output number. The matmul with B = 64 and N = 4096 has 64 × 4096 outputs.", code: `B, N = 64, 4096
threads = B * N                 # one per output element
warps = -(-threads // 32)       # ceiling division
print(threads, "threads in", warps, "warps")    # 262,144 threads, 8,192 warps` },
  { tag: "v2", title: "+ fit onto the SMs", color: C.yellow, why: "The T4 holds 40 SMs × 32 warps = 1,280 warps at once. More warps than that run in 'waves', as earlier ones finish.", code: `SMS, WARPS_PER_SM = 40, 32
resident = SMS * WARPS_PER_SM               # 1,280 warps on the chip at once
waves = -(-warps // resident)
print(f"{warps} warps → {waves} waves of up to {resident}")` },
  { tag: "v3", title: "+ time and the limit", color: C.green, why: "Time is at least the compute time AND at least the memory time. The bigger one is the real limit.", code: `PEAK, BW = 8.1e12, 320e9                    # T4 FP32 FLOPS, bytes per second
flops = 2 * B * N * N                       # matmul: 2 FLOPs per MAC
nbytes = (B*N + N*N + B*N) * 4              # read X and W, write Y (float32)
t_compute, t_memory = flops / PEAK, nbytes / BW
limit = "compute" if t_compute > t_memory else "memory"
print(f"compute {t_compute*1e3:.2f} ms, memory {t_memory*1e3:.2f} ms → {limit}-bound")` },
];
function BuildWidget() {
  const [v, setV] = useState(0);
  const cur = VERSIONS[v];
  return (
    <div>
      <Frame>Grow the planner one idea at a time.</Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {VERSIONS.map((x, i) => <Btn key={x.tag} ghost={i !== v} onClick={() => setV(i)} color={x.color}>{x.tag}: {x.title}</Btn>)}
      </div>
      <div style={{ padding: "10px 14px", borderRadius: 8, background: cur.color + "14", border: `1px solid ${cur.color}55`, color: C.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
        <b style={{ color: cur.color }}>{cur.tag}: </b>{cur.why}
      </div>
      <Code color={cur.color}>{cur.code}</Code>
      <Insight title="Two lower bounds, compute and memory. The larger one wins.">
        You'll meet this "whichever is slower" idea again as the roofline model in Unit 5.3.
      </Insight>
    </div>
  );
}

// ── Section 3: Play It — the planner ──
function PlayWidget() {
  const [job, setJob] = useState("matmul");
  const [B, setB] = useState(64);
  const [N, setN] = useState(4096);
  const p = plan(job, B, N);
  const firstWave = Math.min(p.warps, p.resident);
  const smFill = Array.from({ length: 40 }, (_, s) => Math.min(32, Math.max(0, firstWave - s * 32)));
  return (
    <div>
      <Frame>Your planner, live. Pick the operation and its size; the 40 squares are the T4's SMs, shaded by how many of their 32 warp slots the first wave fills.</Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <Btn ghost={job !== "matmul"} onClick={() => setJob("matmul")}>Matrix multiply layer</Btn>
        <Btn ghost={job !== "relu"} onClick={() => setJob("relu")} color={C.green}>ReLU</Btn>
      </div>
      <Slider label={<>Batch size B = <b style={{ color: C.orange }}>{B}</b></>} value={B} min={1} max={2048} onChange={setB} color={C.orange} />
      <Slider label={<>Layer width N = <b style={{ color: C.accent }}>{N}</b></>} value={N} min={256} max={8192} step={256} onChange={setN} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4 }}>
        {smFill.map((w, s) => <div key={s} style={{ height: 26, borderRadius: 4, background: C.green, opacity: 0.12 + 0.88 * (w / 32), border: `1px solid ${C.border}`, fontSize: 9, color: w > 16 ? "#0D1117" : C.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>{w}</div>)}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="THREADS" value={p.outputs.toLocaleString("en-IN")} color={C.accent} />
        <Stat label="WARPS" value={p.warps.toLocaleString("en-IN")} color={C.purple} />
        <Stat label="WAVES" value={p.waves} color={C.purple} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <Stat label="COMPUTE TIME ≥" value={tf(p.tCompute)} color={p.bound === "compute" ? C.red : C.green} />
        <Stat label="MEMORY TIME ≥" value={tf(p.tMemory)} color={p.bound === "memory" ? C.red : C.green} />
        <Stat label="LIMITED BY" value={p.bound.toUpperCase()} color={C.yellow} />
      </div>
      <div style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>{p.warps < 1280 ? "⚠️ Fewer warps than slots: some SMs are idle or can't hide latency well (Unit 3.3). Bigger batches help." : "✓ Enough warps to fill every SM and hide memory latency."}</div>
      <Insight color={C.yellow} title="Try the matmul at B = 1, then B = 1024: the same layer switches from memory-bound to compute-bound.">
        With one input, the whole 64 MB weight matrix is read to do very little maths per byte. With a big batch, each weight is reused many
        times (Unit 3.4's reuse). ReLU is always memory-bound. Module 5 builds on exactly this.
      </Insight>
    </div>
  );
}

// ── Section 4: Full code + lab ──
function CodeWidget() {
  return (
    <div>
      <Frame>The complete planner. In Lab 3 Part E you'll time these exact jobs on the T4 and see how close the plan comes.</Frame>
      <Code color={C.green} title="🗺️ gpu_planner.py">{`SMS, WARPS_PER_SM = 40, 32
PEAK, BW = 8.1e12, 320e9          # T4: FP32 FLOPS, bytes/s

def plan(name, outputs, flops, nbytes):
    warps = -(-outputs // 32)
    waves = -(-warps // (SMS * WARPS_PER_SM))
    tc, tm = flops / PEAK, nbytes / BW
    print(f"{name:22s} {outputs:>10,d} threads {warps:>8,d} warps {waves:>3d} waves  "
          f"compute {tc*1e3:7.3f} ms  memory {tm*1e3:7.3f} ms  → {'compute' if tc > tm else 'memory'}-bound")

N = 4096
for B in [1, 64, 1024]:
    plan(f"matmul  B={B}", B*N, 2*B*N*N, (B*N + N*N + B*N) * 4)
    plan(f"ReLU    B={B}", B*N, B*N, 2*B*N*4)`}</Code>
      <div style={{ marginTop: 12, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        <b style={{ color: C.text }}>Challenge upgrades:</b> (1) switch the matmul to FP16 Tensor Cores (peak 65 TFLOPS, 2 bytes per number): which jobs change
        their limit? (2) Fuse the ReLU into the matmul so Y is written only once: how much memory time does that save?
      </div>
      <LabCard part="E" title="Plan vs reality on the T4"
        what="Time the matmul and the ReLU on the GPU for B = 1, 64 and 1024, compute the TFLOPS and GB/s you actually achieved, and compare with the planner."
        expect="ReLU reaching a good fraction of the bandwidth; the B = 1 matmul limited by memory; the B = 1024 matmul reaching several TFLOPS." />
      <Insight color={C.orange} title="Module 3 complete: you can see inside the GPU.">
        Next, the other half of the story: how the CPU actually hands this work to the GPU, step by step, across PCIe.
      </Insight>
    </div>
  );
}
//@@SECTIONS
[["The Mission", "🎯 The Mission — plan a layer on the T4", "MissionWidget"],
 ["Build in Steps", "🪜 Build in Steps — threads → waves → time", "BuildWidget"],
 ["Play It", "▶️ Play It — the GPU planner", "PlayWidget"],
 ["Full Code & Lab", "📜 Full Code — and plan vs reality", "CodeWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "A job has 100,000 output elements, one thread each. How many warps is that?", options: ["3,125", "3,200", "100,000", "32"], answer: 0, explain: "100,000 ÷ 32 = 3,125 warps." },
  { q: "The T4 holds 40 SMs × 32 warps = 1,280 warps at once. A job with 3,000 warps runs in how many waves?", options: ["1", "2", "3", "40"], answer: 2, explain: "3,000 ÷ 1,280 = 2.3, rounded up to 3 waves." },
  { q: "A job needs 1 ms of compute time and 5 ms of memory time (at peak). It is…", options: ["compute-bound, about 1 ms", "memory-bound, at least 5 ms", "6 ms exactly", "impossible"], answer: 1, explain: "Time is at least the larger lower bound: memory, 5 ms. Faster arithmetic wouldn't help." },
  { q: "Why does a bigger batch make a matmul layer compute-bound?", options: ["Bigger batches use less memory", "Each weight read from memory is reused for more inputs, so FLOPs grow faster than bytes", "The GPU clocks up", "Warps diverge less"], answer: 1, explain: "The weights are read once but used B times: more maths per byte (Unit 3.4's reuse)." },
];
const RESULT = {
  perfect: "Perfect! You can plan GPU work like an engineer.",
  good: "Good. Replay 'Play It' and move the batch slider from 1 to 2048.",
  low: "Revisit 'Build in Steps': threads → warps → waves → compute vs memory.",
  done: "Module 3 Complete! 🔬",
  body: "You can describe SMs, warps, divergence, latency hiding, the memory hierarchy, and plan a job's threads, waves and limits.",
  next: "Next up: Module 4 — CPU–GPU Teamwork.",
  teaser: "How does the CPU actually hand a job to the GPU? Allocate, copy, launch, copy back, free: you'll do every step yourself.",
};
//@@WORDS
const UNIT_WORDS = [
  ["SM", "Streaming Multiprocessor", "The T4 has 40, each holding up to 32 warps.", "from Unit 3.1"],
  ["wave", "one round of work", "As many warps as the chip can hold at once; big jobs need several waves.", "new here"],
  ["compute-bound", "limited by arithmetic", "FLOPs ÷ peak is the bigger time.", "new here"],
  ["memory-bound", "limited by memory", "Bytes ÷ bandwidth is the bigger time.", "new here"],
];
