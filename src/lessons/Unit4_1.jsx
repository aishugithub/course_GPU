import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab4_CPU_GPU_Teamwork.ipynb";

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

const TEXTBOOK = "Hamacher §12.2.1 (GPUs) and Ch 7 (PCI Express) · Kirk & Hwu Ch 2 (Heterogeneous data parallel computing)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// ── Section 1: Need — the data is in the wrong building ──
function NeedWidget() {
  const [fixed, setFixed] = useState(false);
  return (
    <div>
      <Frame>
        A first-time GPU user moves the model to the GPU and runs it on some data. Python stops with an error. Toggle to see the broken code,
        then the fix.
      </Frame>
      <Btn onClick={() => setFixed((v) => !v)} color={fixed ? C.green : C.red}>{fixed ? "◀ Show the broken version" : "▶ Fix it"}</Btn>
      <div style={{ marginTop: 12 }}>
        <Code color={fixed ? C.green : C.red} title={fixed ? "✅ WORKS" : "❌ CRASHES"}>{fixed ? `model = model.to("cuda")      # weights → GPU memory
x = x.to("cuda")              # data   → GPU memory too
y = model(x)                  # ✓ both live on the GPU` : `model = model.to("cuda")      # weights → GPU memory
y = model(x)                  # x is still in CPU memory!`}</Code>
        {!fixed && (
          <pre style={{ marginTop: 8, background: "#2a1214", border: `1px solid ${C.red}`, borderRadius: 8, padding: 10, color: C.red, fontFamily: "monospace", fontSize: 11.5, whiteSpace: "pre-wrap" }}>
{`RuntimeError: Expected all tensors to be on the same device,
but found at least two devices, cuda:0 and cpu!`}
          </pre>
        )}
      </div>
      <Insight color={fixed ? C.green : C.red} title="The GPU can only compute on data that's in the GPU's own memory.">
        The GPU is a separate card with its own memory, like a coaching centre in a different building. Before it can work on your numbers,
        someone has to carry them over. This module is about that carrying.
      </Insight>
    </div>
  );
}

// ── Section 2: The system picture ──
const PARTS = {
  cpu: { t: "CPU (the host)", d: "Runs your Python program, makes decisions, and tells the GPU what to do. In CUDA language the CPU side is called the HOST.", c: C.orange },
  ram: { t: "Host memory (RAM)", d: "Where your program's variables, the dataset and NumPy arrays live, around 12 GB on Colab. The GPU can't compute directly on it.", c: C.orange },
  pcie: { t: "PCIe bus", d: "The slot the GPU card plugs into: a high-speed serial bus (COA Unit 5: standard I/O interfaces). The T4 uses PCIe Gen 3 ×16, about 16 GB/s in theory and around 12 GB/s in practice. Copies are done by DMA engines on the GPU, without the CPU moving each byte.", c: C.yellow },
  gpu: { t: "GPU (the device)", d: "The SMs, cores and Tensor Cores from Module 3. In CUDA language the GPU side is called the DEVICE.", c: C.green },
  vram: { t: "Device memory (GDDR6)", d: "The GPU's own 16 GB, delivering 320 GB/s, about 25× faster than PCIe. Your model weights and tensors must be here for the GPU to use them.", c: C.green },
};
function SystemWidget() {
  const [k, setK] = useState("pcie");
  const Box = ({ id, x, y, w, h, label }) => (
    <g onClick={() => setK(id)} style={{ cursor: "pointer" }}>
      <rect x={x} y={y} width={w} height={h} rx="8" fill={PARTS[id].c + (k === id ? "44" : "18")} stroke={PARTS[id].c} strokeWidth={k === id ? 2.5 : 1.2} />
      <text x={x + w / 2} y={y + h / 2 + 4} fill={C.text} fontSize="12" textAnchor="middle">{label}</text>
    </g>
  );
  return (
    <div>
      <Frame>Every GPU computer looks like this. Click each part. (Numbers for Colab's T4 machine, approximate.)</Frame>
      <svg viewBox="0 0 520 190" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <text x="20" y="20" fill={C.orange} fontSize="11" fontWeight="700">HOST</text>
        <text x="390" y="20" fill={C.green} fontSize="11" fontWeight="700">DEVICE</text>
        <Box id="cpu" x={20} y={30} w={140} h={50} label="CPU" />
        <Box id="ram" x={20} y={110} w={140} h={50} label="RAM ≈ 12 GB" />
        <line x1="90" y1="80" x2="90" y2="110" stroke={C.orange} strokeWidth="2" />
        <Box id="pcie" x={185} y={70} w={150} h={40} label="PCIe ≈ 12 GB/s" />
        <line x1="160" y1="90" x2="185" y2="90" stroke={C.yellow} strokeWidth="3" /><line x1="335" y1="90" x2="360" y2="90" stroke={C.yellow} strokeWidth="3" />
        <Box id="gpu" x={360} y={30} w={140} h={50} label="GPU (40 SMs)" />
        <Box id="vram" x={360} y={110} w={140} h={50} label="GDDR6 16 GB" />
        <line x1="430" y1="80" x2="430" y2="110" stroke={C.green} strokeWidth="5" />
        <text x="438" y="100" fill={C.green} fontSize="9">320 GB/s</text>
      </svg>
      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: PARTS[k].c + "14", border: `1px solid ${PARTS[k].c}55`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        <b style={{ color: C.text }}>{PARTS[k].t}.</b> {PARTS[k].d}
      </div>
      <Insight color={C.yellow} title="To the CPU, the GPU is an I/O device on a bus, exactly like in COA Unit 5.">
        Your COA knowledge applies directly: the GPU card sits on PCIe, data moves by DMA, and the GPU signals when it's done. The narrow
        PCIe link between two fast memories is the bottleneck to respect.
      </Insight>
    </div>
  );
}

// ── Section 3: What a copy costs ──
function CopyWidget() {
  const [mb, setMb] = useState(500);
  const [ops, setOps] = useState(1);
  const pcie = mb / 12000, inside = (mb / 320000) * ops;
  const total = pcie * 2 + inside;
  return (
    <div>
      <Frame>
        Move data over, do some GPU operations on it, bring the result back. How much of the time is just carrying? Change the data size and
        how many operations the GPU does on the data while it's there (each one reads and writes it at 320 GB/s).
      </Frame>
      <Slider label={<>Data size = <b style={{ color: C.teal }}>{mb} MB</b></>} value={mb} min={1} max={4000} onChange={setMb} color={C.teal} />
      <Slider label={<>GPU operations done on it before copying back = <b style={{ color: C.green }}>{ops}</b></>} value={ops} min={1} max={500} onChange={setOps} color={C.green} />
      <div style={{ display: "flex", height: 34, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}`, marginTop: 6 }}>
        <div style={{ width: `${(pcie / total) * 100}%`, background: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", color: "#0D1117", fontSize: 11, fontWeight: 700 }}>copy in</div>
        <div style={{ width: `${(inside / total) * 100}%`, minWidth: 3, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", color: "#0D1117", fontSize: 11, fontWeight: 700 }}>{inside / total > 0.15 ? "GPU work" : ""}</div>
        <div style={{ width: `${(pcie / total) * 100}%`, background: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", color: "#0D1117", fontSize: 11, fontWeight: 700 }}>copy out</div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="EACH PCIe COPY" value={`${(pcie * 1000).toFixed(1)} ms`} color={C.yellow} />
        <Stat label="GPU WORK" value={`${(inside * 1000).toFixed(1)} ms`} color={C.green} />
        <Stat label="TIME SPENT COPYING" value={`${((2 * pcie / total) * 100).toFixed(0)}%`} color={2 * pcie / total > 0.5 ? C.red : C.green} />
      </div>
      <Insight color={C.green} title="Copy once, compute many times, copy back once.">
        One operation per copy wastes about 98% of the time on PCIe. Hundreds of operations per copy (like a whole training run on data that stays
        on the GPU) make the copy negligible. That's why models and batches are moved to the GPU and kept there.
      </Insight>
    </div>
  );
}

// ── Section 4: Other ways to connect ──
const VARIANTS = [
  { t: "Pinned (page-locked) host memory", c: C.teal, d: "Normal RAM can be moved around by the operating system's paging, so the GPU's DMA engine can't read it directly: the driver first copies it into a locked staging area. Pinned memory is locked in place, so DMA reads it directly. Copies get faster and can overlap with computing. In PyTorch: DataLoader(pin_memory=True)." },
  { t: "Integrated GPU / unified memory", c: C.purple, d: "Phones, laptops with integrated graphics and Apple M-series chips put the CPU and GPU on one chip sharing ONE memory: no PCIe copy at all. The trade-off is less total memory bandwidth than a big discrete GPU." },
  { t: "NVLink", c: C.green, d: "NVIDIA's direct GPU-to-GPU link in data-centre servers: hundreds of GB/s, many times faster than PCIe. It lets 8 GPUs work on one model (Unit 5.9)." },
  { t: "Newer PCIe generations", c: C.yellow, d: "Each PCIe generation roughly doubles the speed: Gen 3 ≈ 16 GB/s, Gen 4 ≈ 32 GB/s, Gen 5 ≈ 64 GB/s for ×16 (theoretical, approximate). Still far below the GPU's own memory." },
];
function VariantsWidget() {
  const [i, setI] = useState(0);
  return (
    <div>
      <Frame>The basic picture has some important variations. Click each.</Frame>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {VARIANTS.map((v, k) => <Btn key={k} ghost={k !== i} onClick={() => setI(k)} color={v.c}>{v.t}</Btn>)}
      </div>
      <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 8, background: VARIANTS[i].c + "14", border: `1px solid ${VARIANTS[i].c}55`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{VARIANTS[i].d}</div>
      <Insight color={C.teal} title="The goal is always the same: make the host-device link matter less.">
        Lock memory so DMA can use it directly, share memory instead of copying, or build faster links. All of them attack the same bottleneck.
      </Insight>
      <LabCard part="A" title="Where does a tensor live, and what does moving it cost?"
        what="Check tensor.device, trigger the 'same device' error and fix it, then time .to('cuda') for growing sizes to measure your PCIe speed, with and without pinned memory."
        expect="'cpu' and 'cuda:0' devices, copy speeds of a few GB/s up to about 12 GB/s, and pinned memory copying noticeably faster." />
    </div>
  );
}

const QUESTIONS = [
  { q: "In CUDA terminology, the 'host' is…", options: ["The GPU", "The CPU and its memory", "The PCIe bus", "The cloud server"], answer: 1, explain: "Host = CPU + RAM; device = GPU + its own memory." },
  { q: "PyTorch says 'Expected all tensors to be on the same device, cuda:0 and cpu'. What's the fix?", options: ["Restart Colab", "Move the CPU tensor to the GPU with .to('cuda')", "Use a smaller batch", "Turn off the GPU"], answer: 1, explain: "The GPU can only compute on data in its own memory. Move the data (or the model) so both are on the same device." },
  { q: "Copying 1.2 GB over PCIe at 12 GB/s takes about…", options: ["1 ms", "10 ms", "100 ms", "1 s"], answer: 2, explain: "1.2 GB ÷ 12 GB/s = 0.1 s = 100 ms. Inside the GPU (320 GB/s) the same data moves in about 4 ms." },
  { q: "Why is pinned (page-locked) memory faster to copy?", options: ["It's stored on the GPU", "The GPU's DMA engine can read it directly, without an extra staging copy", "It compresses the data", "It uses NVLink"], answer: 1, explain: "Pageable memory might be moved by the OS, so it's first copied to a locked buffer. Pinned memory skips that step." },
];
const RESULT = {
  perfect: "Perfect! You understand the host-device split.",
  good: "Good. Replay 'What a Copy Costs' and push the operations slider.",
  low: "Revisit 'Host & Device': two memories, one narrow bus.",
  done: "Unit 4.1 Complete!",
  body: "You can explain host vs device, the PCIe link, copy costs, and pinned memory, unified memory and NVLink.",
  next: "Next up: Unit 4.2 — The Five Steps of Offloading.",
  teaser: "Allocate, copy in, launch, copy out, free: exactly how the CPU hands a job to the GPU.",
};

const UNIT_WORDS = [
  ["host / device", "CPU side / GPU side", "CUDA's names for the two halves of the system.", "new here"],
  ["PCIe", "Peripheral Component Interconnect Express", "The bus the GPU card plugs into (COA Unit 5).", "from COA"],
  ["DMA", "Direct Memory Access", "Hardware that copies data without the CPU moving each byte (COA Unit 5).", "from COA"],
  ["VRAM / GDDR6", "the GPU's own memory", "Video RAM; on the T4 it's 16 GB of GDDR6.", "from Unit 3.1"],
  ["NVLink", "NVIDIA's GPU-to-GPU link", "Much faster than PCIe; used in multi-GPU servers.", "new here"],
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

export default function Unit4_1({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "Wrong Building" },
    { id: "s1", label: "Host & Device" },
    { id: "s2", label: "What a Copy Costs" },
    { id: "s3", label: "Variations" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🏢 The Data Is in the Wrong Building</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔌 Host & Device — the system picture</h3><SystemWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📦 What a Copy Costs — PCIe vs GPU memory</h3><CopyWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔀 Variations — pinned memory, unified memory, NVLink</h3><VariantsWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 4.1.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔌</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 4 › UNIT 4.1</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Host & Device on PCIe</div>
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
