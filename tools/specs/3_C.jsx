//@@META
{"unit": "3.C", "module": 3, "title": "Capstone: CPU or GPU?", "icon": "🏆", "lab": "Lab03_CPU_vs_GPU.ipynb", "labNo": 3, "gpu": true}
//@@WIDGETS

// Simple, labelled timing model (all figures approximate):
// CPU 0.2 TFLOPS effective, 20 GB/s memory · GPU 4 TFLOPS effective FP32, 300 GB/s memory,
// 20 µs to launch work, PCIe copies at 12 GB/s
const CPU_F = 2e11, CPU_BW = 2e10, GPU_F = 4e12, GPU_BW = 3e11, LAUNCH = 2e-5, PCIE = 1.2e10;
const tfmt = (s) => (s < 1e-3 ? `${(s * 1e6).toFixed(1)} µs` : s < 1 ? `${(s * 1e3).toFixed(1)} ms` : `${s.toFixed(2)} s`);

const JOBS = [
  { id: "tiny", t: "Add two lists of 100 numbers", parallel: true, flops: 100, bytes: 1200, serial: 0, ans: "cpu",
    why: "The GPU's 20 µs launch cost is thousands of times longer than the work itself. Tiny jobs stay on the CPU (Unit 3.1)." },
  { id: "matmul", t: "Multiply two 4096 × 4096 matrices", parallel: true, flops: 2 * 4096 ** 3, bytes: 3 * 4096 * 4096 * 4, serial: 0, ans: "gpu",
    why: "1.4 × 10¹¹ FLOPs of perfectly independent work (Unit 2.3). Even after copying 200 MB over PCIe, the GPU wins clearly." },
  { id: "csv", t: "Parse 10,000 lines of a messy CSV with lots of if/else in Python", parallel: false, flops: 0, bytes: 0, serial: 0.08, ans: "cpu",
    why: "Branchy, one-line-at-a-time Python string work isn't SIMD work at all. p ≈ 0, so Amdahl gives no speed-up (Unit 3.4). This is the CPU's home ground." },
  { id: "relu_cpu", t: "Apply ReLU to 5 crore numbers that are in CPU memory", parallel: true, flops: 5e7, bytes: 4e8, serial: 0, copy: true, ans: "cpu",
    why: "A trap! Only one comparison per number, but 400 MB must cross PCIe and come back. Copying takes longer than the CPU needs to just do it. Where the data lives matters (Module 5)." },
  { id: "relu_gpu", t: "Apply ReLU to 5 crore numbers already in GPU memory", parallel: true, flops: 5e7, bytes: 4e8, serial: 0, copy: false, ans: "gpu",
    why: "Same job, but the data is already on the GPU, so there's no copy. The GPU's fast memory makes it about 15× quicker. Keep data on the GPU between steps!" },
  { id: "chat", t: "A 7-billion-parameter chatbot writes one 200-word answer", parallel: true, flops: 3.7e12, bytes: 0, serial: 0, ans: "gpu",
    why: "3.7 × 10¹² FLOPs of matrix multiplies: about 18 s of arithmetic on the CPU, under a second on the GPU (even faster with FP16, Unit 6.2). This is exactly why AI runs on GPUs." },
];
function times(j) {
  if (!j.parallel) return { cpu: j.serial, gpu: j.serial + LAUNCH, note: "no parallel work to offload" };
  const cpu = Math.max(j.flops / CPU_F, j.bytes / CPU_BW);
  const copy = j.copy === false ? 0 : j.bytes / PCIE;
  const gpu = LAUNCH + copy + Math.max(j.flops / GPU_F, j.bytes / GPU_BW);
  return { cpu, gpu, copy };
}

// ── Section 1: The Mission ──
const TOOLS = [
  ["Latency vs throughput, and the GPU's start-up cost", "Unit 3.1"],
  ["time = work ÷ speed", "Unit 2.1"],
  ["Is the work independent (SIMD/SIMT-friendly)?", "Units 2.3, 3.3"],
  ["Amdahl: the serial part sets the ceiling", "Unit 3.4"],
  ["Data must be copied to the GPU before it can work on it", "preview of Module 5"],
];
function MissionWidget() {
  const [ticks, setTicks] = useState([]);
  return (
    <div>
      <Frame>
        You're the student coordinator of the college's new AI lab, with one GPU server. Teams bring you jobs and ask: <i>"Should this run on the
        CPU or the GPU?"</i> A wrong call wastes GPU time that other teams need. Your tools:
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
      <Insight color={C.green} title="'Use the GPU for everything' is wrong. So is 'the GPU is just for graphics'.">
        The right answer depends on the size of the work, how parallel it is, and where the data lives. By the end of this capstone you'll decide in
        seconds.
      </Insight>
    </div>
  );
}

// ── Section 2: Build in Steps ──
const VERSIONS = [
  { tag: "v1", title: "Compute time only", color: C.teal, why: "First guess: time = FLOPs ÷ speed on each machine. But this ignores two GPU costs, so it says 'GPU' for everything, even tiny jobs.", code: `CPU_FLOPS, GPU_FLOPS = 0.2e12, 4e12        # effective speeds (approx.)

def cpu_time(flops): return flops / CPU_FLOPS
def gpu_time(flops): return flops / GPU_FLOPS` },
  { tag: "v2", title: "+ launch and copy costs", color: C.yellow, why: "A GPU job has a fixed launch cost (~20 µs), and its data must cross PCIe (~12 GB/s) unless it's already there. Now tiny jobs and copy-heavy jobs correctly go to the CPU.", code: `LAUNCH = 20e-6          # seconds to start GPU work
PCIE   = 12e9           # bytes per second over the PCIe bus

def gpu_time(flops, nbytes, data_on_gpu=False):
    copy = 0 if data_on_gpu else nbytes / PCIE
    return LAUNCH + copy + flops / GPU_FLOPS` },
  { tag: "v3", title: "+ Amdahl's serial part", color: C.green, why: "Real programs have a serial part that no GPU can speed up. Add it to both sides, then decide.", code: `def decide(flops, nbytes, serial_s=0.0, data_on_gpu=False):
    cpu = serial_s + cpu_time(flops)
    gpu = serial_s + gpu_time(flops, nbytes, data_on_gpu)
    winner = "GPU" if gpu < cpu else "CPU"
    return winner, cpu, gpu

print(decide(2 * 4096**3, 3 * 4096**2 * 4))   # ('GPU', 0.69, 0.05)
print(decide(100, 1200))                      # ('CPU', ...)` },
];
function BuildWidget() {
  const [v, setV] = useState(0);
  const cur = VERSIONS[v];
  return (
    <div>
      <Frame>Grow a "CPU or GPU?" decision function, one idea per version.</Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {VERSIONS.map((x, i) => <Btn key={x.tag} ghost={i !== v} onClick={() => setV(i)} color={x.color}>{x.tag}: {x.title}</Btn>)}
      </div>
      <div style={{ padding: "10px 14px", borderRadius: 8, background: cur.color + "14", border: `1px solid ${cur.color}55`, color: C.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
        <b style={{ color: cur.color }}>{cur.tag}: </b>{cur.why}
      </div>
      <Code color={cur.color}>{cur.code}</Code>
      <Insight title="Each version fixes the previous one's wrong answers.">
        v1 sends everything to the GPU; v2 learns about launch and copy costs; v3 respects Amdahl. That's how engineering models improve.
      </Insight>
    </div>
  );
}

// ── Section 3: Play It — the job queue ──
function PlayWidget() {
  const [picks, setPicks] = useState({});
  const right = JOBS.filter((j) => picks[j.id] === j.ans).length;
  return (
    <div>
      <Frame>Six jobs in the queue. Decide CPU or GPU for each, then see the model's timing and the reason. (Approximate model, explained in Build in Steps.)</Frame>
      {JOBS.map((j) => {
        const p = picks[j.id], t = times(j);
        return (
          <div key={j.id} style={{ background: C.card, border: `1.5px solid ${p ? (p === j.ans ? C.green : C.red) : C.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220, color: C.text, fontSize: 13, fontWeight: 600 }}>{j.t}</div>
              {[["cpu", "🧠 CPU", C.orange], ["gpu", "⚡ GPU", C.green]].map(([k, l, c]) => (
                <button key={k} onClick={() => !p && setPicks((s) => ({ ...s, [j.id]: k }))} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${c}`, background: p === k ? c + "33" : "transparent", color: C.text, fontSize: 12, cursor: p ? "default" : "pointer" }}>{l}</button>
              ))}
            </div>
            {p && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontFamily: "monospace", fontSize: 12 }}>
                  <span style={{ color: C.orange }}>CPU ≈ {tfmt(t.cpu)}</span>
                  <span style={{ color: C.green }}>GPU ≈ {tfmt(t.gpu)}{t.copy ? ` (incl. ${tfmt(t.copy)} copying)` : ""}</span>
                </div>
                <div style={{ color: p === j.ans ? C.green : C.red, fontSize: 12.5, marginTop: 4, lineHeight: 1.6 }}>{p === j.ans ? "✓ " : "✗ "}{j.why}</div>
              </div>
            )}
          </div>
        );
      })}
      {Object.keys(picks).length === JOBS.length && (
        <Insight color={C.purple} title={`You scored ${right} / ${JOBS.length}. GPU = big + parallel + data already there (or worth the copy).`}>
          Small jobs, branchy serial code and copy-dominated jobs belong on the CPU. Big matrix maths, especially with data kept on the GPU,
          belongs on the GPU.
        </Insight>
      )}
    </div>
  );
}

// ── Section 4: Full code + lab ──
function CodeWidget() {
  return (
    <div>
      <Frame>The complete decision tool. In Lab 3 Part E you'll test its predictions against real timings on Colab's T4.</Frame>
      <Code color={C.green} title="🧭 cpu_or_gpu.py">{`CPU_FLOPS, CPU_BW = 0.2e12, 20e9     # effective speed, memory bandwidth (approx.)
GPU_FLOPS, GPU_BW = 4e12, 300e9
LAUNCH, PCIE = 20e-6, 12e9

def cpu_time(flops, nbytes):
    return max(flops / CPU_FLOPS, nbytes / CPU_BW)

def gpu_time(flops, nbytes, data_on_gpu=False):
    copy = 0 if data_on_gpu else nbytes / PCIE
    return LAUNCH + copy + max(flops / GPU_FLOPS, nbytes / GPU_BW)

def decide(name, flops, nbytes, serial_s=0.0, data_on_gpu=False):
    c = serial_s + cpu_time(flops, nbytes)
    g = serial_s + gpu_time(flops, nbytes, data_on_gpu)
    print(f"{name:32s} CPU {c*1e3:9.3f} ms   GPU {g*1e3:9.3f} ms   → {'GPU' if g < c else 'CPU'}")

decide("add 100 numbers", 100, 1200)
decide("4096 x 4096 matmul", 2 * 4096**3, 3 * 4096**2 * 4)
decide("ReLU 5 crore, data on CPU", 5e7, 4e8)
decide("ReLU 5 crore, data on GPU", 5e7, 4e8, data_on_gpu=True)`}</Code>
      <div style={{ marginTop: 12, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        <b style={{ color: C.text }}>Challenge upgrades:</b> (1) find the matrix size where the decision flips from CPU to GPU; (2) add a
        "number of times the job repeats" parameter: copying once and computing 100 times changes the answer.
      </div>
      <LabCard part="E" title="The real race: CPU vs GPU matrix multiply"
        what="Time NumPy (CPU) against PyTorch on the T4 for matrix sizes from 64 to 4096, plot both, find the crossover, and measure the copy cost separately."
        expect="the CPU wins for small sizes; somewhere in the low hundreds the GPU takes over, and at 4096 it is many times faster." />
      <Insight color={C.orange} title="Module 3 complete: you know when and why the GPU wins.">
        Next: open the GPU up and look inside: multiprocessors, warps, and its special memory.
      </Insight>
    </div>
  );
}
//@@SECTIONS
[["The Mission", "🎯 The Mission — coordinator of the AI lab", "MissionWidget"],
 ["Build in Steps", "🪜 Build in Steps — a CPU-or-GPU decision tool", "BuildWidget"],
 ["Play It", "▶️ Play It — the job queue", "PlayWidget"],
 ["Full Code & Lab", "📜 Full Code — and the real race", "CodeWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "Why can a GPU lose to a CPU on a very small job?", options: ["GPUs can't add", "The fixed launch and copy costs are larger than the work itself", "GPU cores are broken for small numbers", "The CPU has more cores"], answer: 1, explain: "Tens of microseconds to start, plus copying, swamp a job that takes nanoseconds on the CPU." },
  { q: "ReLU on 5 crore numbers: the GPU loses when the data starts in CPU memory but wins when it's already in GPU memory. Why?", options: ["ReLU is different on each", "The PCIe copy dominates when data must be moved", "The GPU is faster at night", "CPU memory is faster than GPU memory"], answer: 1, explain: "Simple work per byte + an expensive copy = CPU wins. Remove the copy and the GPU's fast memory wins." },
  { q: "Which job belongs on the CPU?", options: ["A 8192 × 8192 matrix multiply", "Training a neural network on images", "Branch-heavy Python code that processes text one line at a time", "Running a large chatbot"], answer: 2, explain: "Serial, branchy work has p ≈ 0: there's nothing for thousands of cores to share." },
  { q: "The best habit for GPU programs is to…", options: ["Copy data to the GPU before every operation", "Copy data once, do many operations on it on the GPU, then copy results back", "Avoid the GPU for matrix work", "Use the CPU for all multiply-adds"], answer: 1, explain: "Copies are expensive. Keep data on the GPU across many operations; Module 5 is built around this idea." },
];
const RESULT = {
  perfect: "Perfect! You'd make an excellent AI lab coordinator.",
  good: "Good. Replay 'Play It' and read each reason carefully.",
  low: "Revisit 'Build in Steps': launch and copy costs plus Amdahl decide everything.",
  done: "Module 3 Complete! ⚔️",
  body: "You can explain why GPUs exist, how SIMD/SIMT work, apply Amdahl's law, and decide where any job should run.",
  next: "Next up: Module 4 — Inside a GPU.",
  teaser: "Streaming multiprocessors, Tensor Cores, warps and their secret weapon for hiding slow memory.",
};
//@@WORDS
const UNIT_WORDS = [
  ["PCIe", "Peripheral Component Interconnect Express", "The bus the GPU card plugs into, about 12 GB/s in practice for the T4. Hamacher Ch 7.", "from COA"],
  ["GB/s", "gigabytes per second", "How fast data moves.", "new here"],
  ["µs", "microsecond", "One millionth of a second.", "new here"],
  ["FLOPS", "FLoating-point Operations Per Second", "A machine's arithmetic speed.", "from Unit 2.1"],
];
