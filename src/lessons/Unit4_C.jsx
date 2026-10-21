import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab04_Inside_a_GPU.ipynb";

function Insight({ color = C.accent, title, children }) {
  return (
    <div style={{ marginTop: 16, background: color + "18", border: `1px solid ${color}44`, borderRadius: 8, padding: "12px 16px", fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
      🔑 <strong style={{ color }}>{title}</strong> {children}
    </div>
  );
}

function Frame({ children }) {
  return <p style={{ color: C.muted, fontSize: 13, marginBottom: 14, lineHeight: 1.7 }}>{children}</p>;
}

function Code({ children, color = C.border, title }) {
  return (
    <div style={{ background: C.card, border: `1.5px solid ${color}`, borderRadius: 10, padding: 14 }}>
      {title && <div style={{ color, fontWeight: 700, fontSize: 12, marginBottom: 8 }}>{title}</div>}
      <pre style={{ fontFamily: "monospace", fontSize: 12, color: C.text, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{children}</pre>
    </div>
  );
}

function LabCard({ part, title, what, expect }) {
  return (
    <div style={{ marginTop: 18, background: C.card, border: `1.5px solid ${C.orange}66`, borderRadius: 10, padding: 16 }}>
      <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>🧪 TRY IT FOR REAL — LAB 4 · PART {part}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{what}</div>
      <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}><b style={{ color: C.green }}>You should see:</b> {expect}</div>
      <a href={LAB_URL} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", borderRadius: 8, background: C.orange, color: "#0D1117", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Open Lab 4 in Colab ↗</a>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 8 }}>Colab opens in a new tab. Click <b>File → Save a copy in Drive</b> first, then scroll to Part {part}. Then choose <b>Runtime → Change runtime type → T4 GPU</b>.</div>
    </div>
  );
}

function Btn({ onClick, children, color = C.accentGlow, ghost, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: "8px 16px", borderRadius: 8, background: ghost ? C.card : color, border: ghost ? `1px solid ${C.border}` : "none", color: ghost ? C.muted : "#fff", fontWeight: 600, cursor: disabled ? "default" : "pointer", fontSize: 13, opacity: disabled ? 0.5 : 1 }}>{children}</button>
  );
}

function Slider({ label, value, min, max, step = 1, onChange, color = C.accent }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ color: C.muted, fontSize: 12 }}>{label}</label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", accentColor: color }} />
    </div>
  );
}

function Stat({ label, value, color = C.teal }) {
  return (
    <div style={{ background: C.card, border: `1.5px solid ${color}`, borderRadius: 8, padding: "8px 12px", flex: 1, minWidth: 120 }}>
      <div style={{ color: C.muted, fontSize: 11, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ color, fontFamily: "monospace", fontSize: 15, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const TEXTBOOK = "Kirk & Hwu Ch 4–5 · H&P §4.4";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


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
  ["One thread per output element (SIMT)", "Unit 3.3"],
  ["Threads are grouped into warps of 32", "Units 3.3, 4.2"],
  ["The T4 has 40 SMs, each holding up to 32 warps at once", "Units 4.1, 4.3"],
  ["Compute time ≥ FLOPs ÷ peak FLOPS", "Units 2.1, 4.1"],
  ["Memory time ≥ bytes ÷ bandwidth (if coalesced)", "Unit 4.4"],
  ["Keep warps from diverging", "Unit 4.2"],
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
        You'll meet this "whichever is slower" idea again as the roofline model in Unit 6.3.
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
      <div style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>{p.warps < 1280 ? "⚠️ Fewer warps than slots: some SMs are idle or can't hide latency well (Unit 4.3). Bigger batches help." : "✓ Enough warps to fill every SM and hide memory latency."}</div>
      <Insight color={C.yellow} title="Try the matmul at B = 1, then B = 1024: the same layer switches from memory-bound to compute-bound.">
        With one input, the whole 64 MB weight matrix is read to do very little maths per byte. With a big batch, each weight is reused many
        times (Unit 4.4's reuse). ReLU is always memory-bound. Module 6 builds on exactly this.
      </Insight>
    </div>
  );
}

// ── Section 4: Full code + lab ──
function CodeWidget() {
  return (
    <div>
      <Frame>The complete planner. In Lab 4 Part E you'll time these exact jobs on the T4 and see how close the plan comes.</Frame>
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
      <Insight color={C.orange} title="Module 4 complete: you can see inside the GPU.">
        Next, the other half of the story: how the CPU actually hands this work to the GPU, step by step, across PCIe.
      </Insight>
    </div>
  );
}

const QUESTIONS = [
  { q: "A job has 100,000 output elements, one thread each. How many warps is that?", options: ["3,125", "3,200", "100,000", "32"], answer: 0, explain: "100,000 ÷ 32 = 3,125 warps." },
  { q: "The T4 holds 40 SMs × 32 warps = 1,280 warps at once. A job with 3,000 warps runs in how many waves?", options: ["1", "2", "3", "40"], answer: 2, explain: "3,000 ÷ 1,280 = 2.3, rounded up to 3 waves." },
  { q: "A job needs 1 ms of compute time and 5 ms of memory time (at peak). It is…", options: ["compute-bound, about 1 ms", "memory-bound, at least 5 ms", "6 ms exactly", "impossible"], answer: 1, explain: "Time is at least the larger lower bound: memory, 5 ms. Faster arithmetic wouldn't help." },
  { q: "Why does a bigger batch make a matmul layer compute-bound?", options: ["Bigger batches use less memory", "Each weight read from memory is reused for more inputs, so FLOPs grow faster than bytes", "The GPU clocks up", "Warps diverge less"], answer: 1, explain: "The weights are read once but used B times: more maths per byte (Unit 4.4's reuse)." },
];
const RESULT = {
  perfect: "Perfect! You can plan GPU work like an engineer.",
  good: "Good. Replay 'Play It' and move the batch slider from 1 to 2048.",
  low: "Revisit 'Build in Steps': threads → warps → waves → compute vs memory.",
  done: "Module 4 Complete! 🔬",
  body: "You can describe SMs, warps, divergence, latency hiding, the memory hierarchy, and plan a job's threads, waves and limits.",
  next: "Next up: Module 5 — CPU–GPU Teamwork.",
  teaser: "How does the CPU actually hand a job to the GPU? Allocate, copy, launch, copy back, free: you'll do every step yourself.",
};

const UNIT_WORDS = [
  ["SM", "Streaming Multiprocessor", "The T4 has 40, each holding up to 32 warps.", "from Unit 4.1"],
  ["wave", "one round of work", "As many warps as the chip can hold at once; big jobs need several waves.", "new here"],
  ["compute-bound", "limited by arithmetic", "FLOPs ÷ peak is the bigger time.", "new here"],
  ["memory-bound", "limited by memory", "Bytes ÷ bandwidth is the bigger time.", "new here"],
];

// ── Quiz ──
function Quiz({ onComplete }) {
  const questions = QUESTIONS;
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const choose = (i) => { if (selected !== null) return; setSelected(i); if (i === questions[current].answer) setScore((s) => s + 1); };
  const next = () => { if (current < questions.length - 1) { setCurrent((c) => c + 1); setSelected(null); } else { setDone(true); onComplete && onComplete(); } };
  if (done) {
    return (
      <div style={{ textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: 52 }}>{score >= 3 ? "🎉" : "👍"}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginTop: 10 }}>You scored {score} / {questions.length}</div>
        <div style={{ color: C.muted, marginTop: 8, marginBottom: 20 }}>{score === 4 ? RESULT.perfect : score >= 2 ? RESULT.good : RESULT.low}</div>
        <div style={{ padding: 20, borderRadius: 12, background: `linear-gradient(135deg, ${C.accentGlow}22, ${C.purple}22)`, border: `1px solid ${C.accent}55` }}>
          <div style={{ color: C.accent, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>🎓 {RESULT.done}</div>
          <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
            {RESULT.body}<br /><br />
            <strong style={{ color: C.accent }}>{RESULT.next}</strong> {RESULT.teaser}
          </div>
        </div>
      </div>
    );
  }
  const q = questions[current];
  const codey = q.q.includes("\n");
  return (
    <div>
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>Question {current + 1} of {questions.length}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 15, marginBottom: 16, whiteSpace: "pre-wrap", fontFamily: codey ? "monospace" : "inherit" }}>{q.q}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {q.options.map((opt, i) => {
          let bg = C.card, border = C.border, col = C.text;
          if (selected !== null) {
            if (i === q.answer) { bg = C.green + "22"; border = C.green; col = C.green; }
            else if (i === selected) { bg = C.red + "22"; border = C.red; col = C.red; }
          }
          return (
            <button key={i} onClick={() => choose(i)} style={{ textAlign: "left", padding: "10px 14px", borderRadius: 8, background: bg, border: `1.5px solid ${border}`, color: col, cursor: selected !== null ? "default" : "pointer", fontSize: 13, transition: "all 0.25s" }}>
              {i === q.answer && selected !== null ? "✓ " : i === selected && selected !== q.answer ? "✗ " : ""}{opt}
            </button>
          );
        })}
      </div>
      {selected !== null && <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: C.purple + "18", border: `1px solid ${C.purple}44`, color: C.muted, fontSize: 13 }}>💡 {q.explain}</div>}
      {selected !== null && <button onClick={next} style={{ marginTop: 14, padding: "10px 24px", borderRadius: 8, background: C.accentGlow, border: "none", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>{current < questions.length - 1 ? "Next Question →" : "See Results"}</button>}
    </div>
  );
}

// ── Word bank: every short name used in this unit, spelled out ──
function UnitWordBank() {
  const [open, setOpen] = useState(false);
  if (!UNIT_WORDS.length) return null;
  return (
    <div style={{ marginBottom: 18, borderRadius: 8, border: `1px solid ${C.teal}44`, background: C.teal + "0D", padding: "8px 12px" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: C.teal, fontSize: 12, fontWeight: 700, textAlign: "left", lineHeight: 1.5 }}>
        📖 Short names in this unit: <span style={{ fontFamily: "monospace", fontWeight: 400 }}>{UNIT_WORDS.map((w) => w[0]).join(" · ")}</span> {open ? "▲" : "▼ tap to see what they mean"}
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          {UNIT_WORDS.map(([w, full, plain, from]) => (
            <div key={w} style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6, marginBottom: 3 }}>
              <span style={{ fontFamily: "monospace", color: C.teal, fontWeight: 700 }}>{w}</span> = <b style={{ color: C.text }}>{full}</b>. {plain}{" "}
              <span style={{ fontSize: 11, color: from === "new here" ? C.yellow : C.muted }}>({from})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TextbookNote() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 18, borderRadius: 8, border: `1px solid ${C.purple}44`, background: C.purple + "0D", padding: "8px 12px" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: C.purple, fontSize: 12, fontWeight: 700, textAlign: "left", lineHeight: 1.6 }}>
        📘 Textbook: <span style={{ fontWeight: 400, color: C.text }}>{TEXTBOOK}</span> {open ? "▲" : "▼ which books?"}
      </button>
      {open && <div style={{ marginTop: 6, fontSize: 12, color: C.muted, lineHeight: 1.7 }}>{TEXTBOOK_KEY}</div>}
    </div>
  );
}

export default function Unit4_C({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "The Mission" },
    { id: "s1", label: "Build in Steps" },
    { id: "s2", label: "Play It" },
    { id: "s3", label: "Full Code & Lab" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🎯 The Mission — plan a layer on the T4</h3><MissionWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🪜 Build in Steps — threads → waves → time</h3><BuildWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>▶️ Play It — the GPU planner</h3><PlayWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📜 Full Code — and plan vs reality</h3><CodeWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 4.C.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏆</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 4 › UNIT 4.C</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Capstone: Map a Job onto a GPU</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>{completed.length} / {sections.length} done</div>
      </div>
      <div style={{ height: 3, background: C.border }}>
        <div style={{ height: "100%", width: `${(completed.length / sections.length) * 100}%`, background: C.green, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: C.surface, borderRadius: 10, padding: 4, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
          {sections.map((s, i) => (
            <button key={i} onClick={() => setActiveSection(i)} style={{ flex: 1, minWidth: 80, padding: "8px 6px", borderRadius: 7, background: activeSection === i ? C.accentGlow : "transparent", border: "none", color: activeSection === i ? "#fff" : C.muted, cursor: "pointer", fontSize: 11, fontWeight: activeSection === i ? 600 : 400, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "all 0.2s" }}>
              {completed.includes(i) && <span style={{ color: C.green }}>✓</span>}{s.label}
            </button>
          ))}
        </div>
        <div style={{ background: C.surface, borderRadius: 12, padding: "24px 20px", border: `1px solid ${C.border}`, minHeight: 300 }}>
          <UnitWordBank />
          <TextbookNote />
          {content[activeSection]}
        </div>
        {activeSection < sections.length - 1 && (
          <button onClick={goNext} style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: 8, background: C.accentGlow, border: "none", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Mark Complete &amp; Continue →</button>
        )}
      </div>
    </div>
  );
}
