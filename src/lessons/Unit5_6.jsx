import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab5B_GPUs_in_Real_Projects.ipynb";

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
      <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>🧪 TRY IT FOR REAL — LAB 5B · PART {part}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{what}</div>
      <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}><b style={{ color: C.green }}>You should see:</b> {expect}</div>
      <a href={LAB_URL} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", borderRadius: 8, background: C.orange, color: "#0D1117", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Open Lab 5B in Colab ↗</a>
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

const TEXTBOOK = "Kirk & Hwu Ch 1 (Libraries and frameworks) · D2L Ch 13";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// ── Section 1: Need — where does one line go? ──
const LAYERS = [
  { k: "py", t: "Your Python code", c: C.accent, d: "y = model(x). You think in layers and tensors; you never mention SMs, warps or memory copies.", ex: "y = model(x)" },
  { k: "pt", t: "PyTorch (the framework)", c: C.purple, d: "Breaks the model into operations (matmul, add, relu…), records them for autograd (loss.backward), manages GPU memory with a caching allocator, and picks a kernel for each operation.", ex: "aten::linear → aten::addmm" },
  { k: "lib", t: "Libraries: cuBLAS, cuDNN, …", c: C.green, d: "NVIDIA's expert-tuned kernels: cuBLAS for matrix multiplies (Unit 5.1), cuDNN for neural-network layers. PyTorch also has its own kernels for simpler operations, and torch.compile can generate fused ones.", ex: "cublasSgemm(…)" },
  { k: "rt", t: "CUDA runtime", c: C.teal, d: "The API from Module 4: allocate (cudaMalloc), copy (cudaMemcpy), launch kernels <<<grid, block>>>, streams and synchronisation.", ex: "cudaLaunchKernel(…)" },
  { k: "drv", t: "NVIDIA driver", c: C.yellow, d: "Part of the operating system. It talks to the hardware: puts commands in the GPU's queue, sets up the DMA copies over PCIe, handles interrupts when work finishes (COA Unit 5).", ex: "driver 5xx.xx" },
  { k: "hw", t: "The GPU hardware", c: C.orange, d: "The SMs, warps, Tensor Cores and GDDR6 memory from Module 3 finally do the work.", ex: "40 SMs on a T4" },
];
function StackWidget() {
  const [k, setK] = useState(0);
  return (
    <div>
      <Frame>
        One line, <code style={{ color: C.accent }}>y = model(x)</code>, passes through six layers of software before any transistor switches, like a food order going
        from the app to the restaurant, the kitchen manager, the chef and finally the stove. Click down through the stack.
      </Frame>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {LAYERS.map((l, i) => (
          <div key={l.k} onClick={() => setK(i)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: l.c + (i === k ? "33" : "11"), border: `1.5px solid ${i === k ? l.c : l.c + "55"}`, marginLeft: i * 10, marginRight: i * 10 }}>
            <b style={{ color: l.c, fontSize: 13, flex: 1 }}>{l.t}</b>
            <code style={{ color: C.muted, fontSize: 11 }}>{l.ex}</code>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}><b style={{ color: C.text }}>{LAYERS[k].t}.</b> {LAYERS[k].d}</div>
      <Insight title="Each layer hides the one below it. That's why AI code is short, and why problems can come from any layer.">
        Most of the time you only touch the top. Knowing the layers underneath, which this course has walked through, is what lets you fix
        things when they go wrong.
      </Insight>
    </div>
  );
}

// ── Section 2: Versions must match ──
const SCEN = [
  { t: "PyTorch built for CUDA 12.4 · driver supports up to CUDA 12.4", ok: true, why: "Everything matches. torch.cuda.is_available() → True." },
  { t: "PyTorch built for CUDA 12.4 · driver supports only up to CUDA 11.8", ok: false, why: "The driver is too old for this PyTorch build. Typical message: 'The NVIDIA driver on your system is too old'. Fix: update the driver, or install a PyTorch build for an older CUDA." },
  { t: "PyTorch CPU-only build · good driver and GPU", ok: false, why: "pip installed the CPU version of PyTorch, so it can't see the GPU at all: torch.cuda.is_available() → False. Fix: reinstall PyTorch with CUDA support." },
  { t: "Newer driver (supports CUDA 12.6) · PyTorch built for CUDA 12.1", ok: true, why: "Fine: newer drivers run programs built for older CUDA versions (backward compatibility)." },
];
function VersionWidget() {
  const [pick, setPick] = useState({});
  return (
    <div>
      <Frame>
        The layers are built separately, so their versions must be compatible. The rule of thumb: <b style={{ color: C.text }}>the driver must support at least the CUDA
        version PyTorch was built for</b>. On Colab this is all arranged for you; on your own PC it's the number-one setup problem. Will each combination work?
      </Frame>
      {SCEN.map((s, i) => {
        const p = pick[i];
        return (
          <div key={i} style={{ background: C.card, border: `1px solid ${p === undefined ? C.border : p === s.ok ? C.green : C.red}`, borderRadius: 8, padding: "9px 12px", marginBottom: 7 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220, color: C.text, fontSize: 12.5, fontFamily: "monospace" }}>{s.t}</div>
              {[[true, "✅ Works"], [false, "❌ Fails"]].map(([v, l]) => (
                <button key={l} onClick={() => p === undefined && setPick((q) => ({ ...q, [i]: v }))} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${v ? C.green : C.red}`, background: p === v ? (v ? C.green : C.red) + "33" : "transparent", color: C.text, fontSize: 12, cursor: p === undefined ? "pointer" : "default" }}>{l}</button>
              ))}
            </div>
            {p !== undefined && <div style={{ marginTop: 5, fontSize: 12, color: p === s.ok ? C.green : C.red }}>{p === s.ok ? "✓ " : "✗ "}{s.why}</div>}
          </div>
        );
      })}
      <Code color={C.teal} title="🔍 CHECK EVERY LAYER IN 3 LINES">{`import torch
print(torch.__version__, torch.version.cuda, torch.backends.cudnn.version())
!nvidia-smi        # top line shows the driver version and the CUDA version it supports`}</Code>
      <Insight color={C.teal} title="'torch.cuda.is_available() is False' is almost always a version or installation problem, not broken hardware.">
        Check the three layers: is a GPU present (nvidia-smi), is the driver new enough, and is PyTorch the CUDA build?
      </Insight>
    </div>
  );
}

// ── Section 3: One code, many devices ──
const DEVICES = {
  cuda: { t: "NVIDIA GPU", s: "cuda", stack: "CUDA · cuBLAS · cuDNN", note: "The most widely used. Everything in this course." },
  rocm: { t: "AMD GPU", s: "cuda (via ROCm/HIP)", stack: "ROCm · HIP · rocBLAS · MIOpen", note: "AMD's stack. PyTorch's ROCm build reuses the 'cuda' device name, so most code runs unchanged." },
  mps: { t: "Apple M-series", s: "mps", stack: "Metal Performance Shaders", note: "On Mac laptops. Unified memory: no PCIe copies (Unit 4.1)." },
  cpu: { t: "CPU only", s: "cpu", stack: "oneDNN · MKL / OpenBLAS", note: "Always available. Slow for big models, fine for learning and small jobs." },
};
function DeviceWidget() {
  const [k, setK] = useState("cuda");
  const d = DEVICES[k];
  return (
    <div>
      <Frame>
        The software stack also lets the SAME Python code run on different hardware. Only the bottom layers change. Pick a machine.
      </Frame>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
        {Object.entries(DEVICES).map(([key, v]) => <Btn key={key} ghost={key !== k} onClick={() => setK(key)}>{v.t}</Btn>)}
      </div>
      <Code color={C.accent} title="🐍 YOUR CODE (UNCHANGED)">{`device = "${d.s.split(" ")[0]}"
model = model.to(device)
y = model(x.to(device))`}</Code>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="DEVICE STRING" value={d.s} color={C.accent} />
        <Stat label="LIBRARIES UNDERNEATH" value={d.stack} color={C.green} />
      </div>
      <div style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>{d.note}</div>
      <Code color={C.muted} title="PORTABLE DEVICE PICKER">{`if torch.cuda.is_available():            device = "cuda"
elif torch.backends.mps.is_available():  device = "mps"
else:                                    device = "cpu"`}</Code>
      <Insight color={C.purple} title="Frameworks are a portability layer: write once, run on whatever accelerator is underneath.">
        Inference-only tools such as ONNX Runtime and NVIDIA TensorRT go further, converting a trained model into a form optimised for one specific chip.
      </Insight>
    </div>
  );
}

// ── Section 4: Peek at real kernel names ──
const PROF = [
  ["aten::linear", "PyTorch", "the Linear layer you called"],
  ["aten::addmm", "PyTorch", "'add + matrix multiply': y = b + x·Wᵀ"],
  ["turing_s1688gemm_fp16_128x128_ldg8_relu_f2f_tn", "cuBLAS", "a GEMM kernel for Turing (T4), using FP16 Tensor Cores on 128 × 128 tiles"],
  ["volta_sgemm_128x64_nn", "cuBLAS", "an FP32 single-precision GEMM ('sgemm') on 128 × 64 tiles"],
  ["vectorized_elementwise_kernel<…relu…>", "PyTorch", "the ReLU: one thread per element, branch-free (Unit 3.2)"],
  ["Memcpy HtoD (Pageable -> Device)", "CUDA runtime", "a host-to-device copy over PCIe from pageable memory (Unit 4.1)"],
];
function KernelWidget() {
  const [i, setI] = useState(2);
  return (
    <div>
      <Frame>
        The PyTorch profiler (Unit 4.C) shows the stack in action. Here are typical entries from profiling a small model on a T4. Click each one
        and decode it with what you've learned.
      </Frame>
      <div style={{ background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, padding: 8 }}>
        {PROF.map(([n, layer], k) => (
          <div key={n} onClick={() => setI(k)} style={{ cursor: "pointer", display: "flex", gap: 8, padding: "6px 8px", borderRadius: 6, background: k === i ? C.accent + "22" : "transparent", fontFamily: "monospace", fontSize: 11.5 }}>
            <span style={{ color: C.text, flex: 1, wordBreak: "break-all" }}>{n}</span>
            <span style={{ color: C.muted }}>{layer}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: C.accent + "14", border: `1px solid ${C.accent}55`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        <b style={{ color: C.text }}>{PROF[i][0]}</b>: {PROF[i][2]}.
      </div>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 6 }}>Exact kernel names vary between GPUs and library versions. 'GEMM' = GEneral Matrix Multiply.</div>
      <Insight color={C.green} title="Under every model are a few kinds of kernels: matrix multiplies, element-wise operations, and copies.">
        You now understand all three: tiling and Tensor Cores (Module 5), branch-free element-wise kernels (Module 3), and PCIe copies (Module 4).
      </Insight>
      <LabCard part="A" title="Inspect the stack on Colab"
        what="Print the PyTorch, CUDA and cuDNN versions and the driver from nvidia-smi, write a portable device picker, then profile a small model and identify the cuBLAS GEMM kernels, element-wise kernels and memory copies."
        expect="matching version numbers, a 'cuda' device, and kernel names containing 'gemm' in the profiler table." />
    </div>
  );
}

const QUESTIONS = [
  { q: "Which library does PyTorch typically call for a big matrix multiply on an NVIDIA GPU?", options: ["cuDNN", "cuBLAS", "NumPy", "The driver directly"], answer: 1, explain: "cuBLAS provides tuned GEMM kernels; cuDNN focuses on neural-network layers like convolutions." },
  { q: "torch.cuda.is_available() returns False on a PC that has an NVIDIA GPU. The most likely cause is…", options: ["The GPU is broken", "A version/installation problem: CPU-only PyTorch or a too-old driver", "The model is too big", "The batch size is wrong"], answer: 1, explain: "Check nvidia-smi (driver and GPU present) and torch.version.cuda (None means a CPU-only build)." },
  { q: "Which part of the stack sets up DMA copies over PCIe and handles the GPU's 'work finished' interrupts?", options: ["Your Python code", "PyTorch", "The NVIDIA driver", "cuBLAS"], answer: 2, explain: "The driver is the OS-level layer that talks to the hardware, exactly the I/O role from COA Unit 5." },
  { q: "What does 'gemm' in a kernel name such as turing_s1688gemm_fp16… tell you?", options: ["It's a copy", "It's a general matrix multiply", "It's a ReLU", "It's an error"], answer: 1, explain: "GEMM = GEneral Matrix Multiply. 'fp16' and 's1688' tell you it uses FP16 Tensor Cores on a Turing GPU." },
];
const RESULT = {
  perfect: "Perfect! You can see through the whole software stack.",
  good: "Good. Replay 'Down the Stack' and click every layer.",
  low: "Revisit 'Down the Stack': Python → PyTorch → libraries → CUDA → driver → GPU.",
  done: "Unit 5.6 Complete!",
  body: "You can name every layer between your code and the GPU, fix version problems, write portable device code, and read kernel names.",
  next: "Next up: Unit 5.7 — Will It Fit? Sizing GPU Memory.",
  teaser: "Weights, gradients, optimiser states and activations: do the memory maths before the GPU does it for you.",
};

const UNIT_WORDS = [
  ["cuBLAS / cuDNN", "CUDA Basic Linear Algebra Subprograms / CUDA Deep Neural Network library", "NVIDIA's tuned kernel libraries.", "from Units 5.1, 5.4"],
  ["GEMM", "GEneral Matrix Multiply", "The standard name for C = αAB + βC kernels.", "new here"],
  ["ROCm / HIP", "AMD's GPU software platform / its CUDA-like language", "AMD's equivalent of CUDA.", "new here"],
  ["MPS", "Metal Performance Shaders", "Apple's GPU framework; PyTorch device 'mps'.", "new here"],
  ["ONNX", "Open Neural Network Exchange", "A file format for moving trained models between tools.", "new here"],
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

export default function Unit5_6({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "Down the Stack" },
    { id: "s1", label: "Versions Must Match" },
    { id: "s2", label: "One Code, Many Devices" },
    { id: "s3", label: "Real Kernel Names" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🥞 Down the Stack — from Python to silicon</h3><StackWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔧 Versions Must Match — driver, CUDA, PyTorch</h3><VersionWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔁 One Code, Many Devices</h3><DeviceWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔍 Decode Real Kernel Names</h3><KernelWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 5.6.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🥞</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 5 › UNIT 5.6</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>The Software Stack</div>
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
