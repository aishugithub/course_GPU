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

const TEXTBOOK = "D2L §13.5–13.6 (Training on multiple GPUs) · Hamacher §12.3–12.5 (Multiprocessors)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// ── Section 1: Need — one GPU would take centuries ──
function NeedWidget() {
  const [g, setG] = useState(1);
  const flops = 3.14e23;                     // GPT-3 training estimate (Unit 1.2)
  const per = 312e12 * 0.4;                  // A100 FP16 peak × 40% utilisation
  const eff = g === 1 ? 1 : Math.pow(0.97, Math.log2(g));   // illustrative: a little communication loss per doubling
  const days = flops / (per * g * eff) / 86400;
  return (
    <div>
      <Frame>
        Training a GPT-3-sized model takes about 3 × 10²³ FLOPs (Unit 1.2). Even on one big data-centre GPU (an A100 at 40% of its FP16 peak), how long?
        Now add GPUs.
      </Frame>
      <Slider label={<>GPUs = <b style={{ color: C.green }}>{g.toLocaleString("en-IN")}</b></>} value={g} min={1} max={4096} onChange={setG} color={C.green} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="TRAINING TIME" value={days > 730 ? `${(days / 365).toFixed(0)} years` : days > 2 ? `${days.toFixed(0)} days` : `${(days * 24).toFixed(0)} hours`} color={days > 365 ? C.red : days > 60 ? C.yellow : C.green} />
        <Stat label="SCALING EFFICIENCY (ILLUSTRATIVE)" value={`${(eff * 100).toFixed(0)}%`} color={C.purple} />
      </div>
      <Insight color={C.orange} title="Big models are trained on thousands of GPUs at once, not because one is slow, but because the work is enormous.">
        The question is how to split ONE training job across many GPUs. There are two basic ways, plus a lot of fast networking.
      </Insight>
    </div>
  );
}

// ── Section 2: Data parallelism ──
function DataParWidget() {
  const [s, setS] = useState(0);
  const STEPS = [
    "Every GPU holds a full copy of the model (same weights).",
    "The batch of 256 is split: each of the 4 GPUs gets its own 64 images.",
    "Each GPU runs forward + backward on its slice and gets its own gradients.",
    "ALL-REDUCE: the GPUs exchange gradients over fast links (NVLink) and each ends up with the average.",
    "Each GPU applies the same averaged update, so the copies stay identical. Repeat.",
  ];
  const cols = [C.accent, C.green, C.orange, C.purple];
  return (
    <div>
      <Frame>
        <b style={{ color: C.text }}>Data parallelism</b>: like four examiners each marking a quarter of the answer scripts, then agreeing on the marking scheme
        together. Step through one training iteration on 4 GPUs.
      </Frame>
      <svg viewBox="0 0 520 170" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        {[0, 1, 2, 3].map((k) => (
          <g key={k}>
            <rect x={20 + k * 125} y="20" width="105" height="90" rx="8" fill={cols[k] + "18"} stroke={cols[k]} />
            <text x={72 + k * 125} y="38" fill={C.text} fontSize="11" textAnchor="middle">GPU {k}</text>
            <rect x={35 + k * 125} y="46" width="75" height="16" rx="3" fill={C.teal + "44"} /><text x={72 + k * 125} y="58" fill={C.text} fontSize="9" textAnchor="middle">full model</text>
            {s >= 1 && <><rect x={35 + k * 125} y="66" width="75" height="16" rx="3" fill={C.yellow + "44"} /><text x={72 + k * 125} y="78" fill={C.text} fontSize="9" textAnchor="middle">images {k * 64}–{k * 64 + 63}</text></>}
            {s >= 2 && <><rect x={35 + k * 125} y="86" width="75" height="16" rx="3" fill={(s >= 3 ? C.green : cols[k]) + "55"} /><text x={72 + k * 125} y="98" fill={C.text} fontSize="9" textAnchor="middle">{s >= 3 ? "avg gradient" : `gradient ${k}`}</text></>}
          </g>
        ))}
        {s === 3 && <g><line x1="72" y1="125" x2="447" y2="125" stroke={C.green} strokeWidth="3" /><text x="260" y="145" fill={C.green} fontSize="11" textAnchor="middle">all-reduce: exchange and average gradients (NVLink)</text></g>}
        {s >= 4 && <text x="260" y="145" fill={C.accent} fontSize="11" textAnchor="middle">same update everywhere → the 4 copies stay identical</text>}
      </svg>
      <div style={{ marginTop: 10, minHeight: 22, color: C.text, fontSize: 13 }}>{STEPS[s]}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Btn onClick={() => setS((v) => Math.min(4, v + 1))}>Step ▶ ({s + 1} / 5)</Btn>
        <Btn ghost onClick={() => setS(0)}>↺ Reset</Btn>
      </div>
      <Code color={C.accent} title="🔥 IN PYTORCH: DistributedDataParallel">{`model = torch.nn.parallel.DistributedDataParallel(model)   # one process per GPU
# the training loop stays the same; backward() triggers the all-reduce`}</Code>
      <Insight title="Averaging the gradients of 4 slices gives exactly the gradient of the whole batch.">
        So 4 GPUs act like one GPU with a 4× bigger batch, at nearly 4× the speed, as long as the gradient exchange is fast. The exchange is the serial part
        that Amdahl's law warns about (Unit 2.4).
      </Insight>
    </div>
  );
}

// ── Section 3: When the model doesn't fit: model parallelism ──
function ModelParWidget() {
  const [mode, setMode] = useState("pipeline");
  const MODES = {
    pipeline: { t: "Pipeline parallelism", d: "Split the LAYERS: GPU 0 holds layers 1–8, GPU 1 holds 9–16, and so on. Activations flow from GPU to GPU like an assembly line, and micro-batches keep every stage busy (the same idea as pipelining in COA Unit 3!).", draw: "layers" },
    tensor: { t: "Tensor parallelism", d: "Split each big MATRIX: each GPU holds a slice of every weight matrix and computes part of every layer, then the GPUs combine partial results. It needs very fast links, so it's used inside one server.", draw: "matrix" },
    fsdp: { t: "Sharded data parallelism (FSDP / ZeRO)", d: "Like data parallelism, but each GPU stores only a SHARE of the weights, gradients and Adam states (the 16 bytes/param from Unit 5.7), fetching the rest just when needed. Memory per GPU drops by about the number of GPUs.", draw: "shard" },
  };
  const m = MODES[mode];
  return (
    <div>
      <Frame>
        Data parallelism needs a full model copy on every GPU. A model needing 2,800 GB to train (175 B parameters × 16 bytes) fits on no single GPU.
        Then the MODEL itself has to be split. Compare three ways.
      </Frame>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {Object.entries(MODES).map(([k, v]) => <Btn key={k} ghost={k !== mode} onClick={() => setMode(k)} color={C.purple}>{v.t}</Btn>)}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {[0, 1, 2, 3].map((k) => (
          <div key={k} style={{ flex: 1, background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, padding: 8, textAlign: "center" }}>
            <div style={{ color: C.muted, fontSize: 11, marginBottom: 6 }}>GPU {k}</div>
            {m.draw === "layers" && <div style={{ background: C.purple + "44", border: `1px solid ${C.purple}`, borderRadius: 4, padding: 6, fontSize: 11, color: C.text }}>layers {k * 8 + 1}–{k * 8 + 8}</div>}
            {m.draw === "matrix" && <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>{Array.from({ length: 16 }, (_, i) => <div key={i} style={{ height: 10, background: i % 4 === k ? C.purple : C.border, borderRadius: 1 }} />)}</div>}
            {m.draw === "shard" && <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>weights ¼<br />grads ¼<br />Adam ¼</div>}
          </div>
        ))}
      </div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginTop: 10 }}>{m.d}</div>
      <Insight color={C.purple} title="Real giant-model training combines all of these at once, across thousands of GPUs.">
        Data parallel across servers, tensor parallel inside a server, pipeline across groups, and sharding everywhere. The ideas are the ones
        you know (splitting work, pipelining, Amdahl); the scale is enormous.
      </Insight>
    </div>
  );
}

// ── Section 4: Beyond NVIDIA GPUs ──
const ACCEL = [
  { t: "Google TPU", c: C.green, d: "Tensor Processing Unit: built around a huge matrix-multiply unit (a 'systolic array') where numbers flow through a grid of multiply-add cells. Used through Google Cloud and Colab." },
  { t: "NPUs in phones and laptops", c: C.teal, d: "Neural Processing Units: small, low-power AI engines (often INT8) on phone and laptop chips. They run face unlock, camera effects and on-device assistants without the cloud." },
  { t: "AMD Instinct GPUs", c: C.red, d: "AMD's data-centre GPUs, programmed with ROCm/HIP (Unit 5.6). Same SIMT ideas, different company." },
  { t: "Apple M-series", c: C.purple, d: "CPU, GPU and Neural Engine on one chip sharing unified memory: no PCIe copies (Unit 4.1). Great for running models locally." },
  { t: "Cloud GPUs", c: C.yellow, d: "Rent instead of buy: T4, L4, A100, H100 by the hour from cloud providers. Colab's free T4 is the entry point; prices vary a lot, so always check current rates." },
];
function AccelWidget() {
  const [i, setI] = useState(0);
  return (
    <div>
      <Frame>
        GPUs aren't the only AI chips. Click each family. Notice what they all have in common.
      </Frame>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {ACCEL.map((a, k) => <Btn key={k} ghost={k !== i} onClick={() => setI(k)} color={a.c}>{a.t}</Btn>)}
      </div>
      <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 8, background: ACCEL[i].c + "14", border: `1px solid ${ACCEL[i].c}55`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{ACCEL[i].d}</div>
      <Insight color={C.green} title="Every AI chip is the same bargain: huge numbers of multiply-adds in parallel, low precision, and a memory system to feed them.">
        Learn the principles in this course (SIMD, memory bandwidth, precision, the roofline, host-device copies) and you can understand any of them.
      </Insight>
      <LabCard part="D" title="Prove data parallelism on one GPU"
        what="Colab gives you one GPU, but you can still check the key idea: split a batch into 4 slices, compute each slice's gradient separately, average them, and compare with the gradient of the whole batch."
        expect="the averaged gradient matching the full-batch gradient (difference ≈ 0), exactly what all-reduce relies on." />
    </div>
  );
}

const QUESTIONS = [
  { q: "In data parallelism with 8 GPUs, what does each GPU hold?", options: ["One-eighth of the model", "A full copy of the model and one-eighth of each batch", "Only the gradients", "Only the data"], answer: 1, explain: "Every GPU has the whole model; the batch is split; gradients are averaged with an all-reduce." },
  { q: "Why is averaging the gradients of 4 batch slices correct?", options: ["It's an approximation that usually works", "The gradient of the average loss over a batch equals the average of the slice gradients (for equal slices)", "Because GPUs round numbers", "It isn't; each GPU learns separately"], answer: 1, explain: "Gradients add up linearly, so averaging equal slices gives exactly the full-batch gradient." },
  { q: "A model is too big for one GPU's memory even for a single example. Which approach helps?", options: ["Plain data parallelism", "Model parallelism (pipeline/tensor) or sharding the model state (FSDP)", "A bigger batch", "More DataLoader workers"], answer: 1, explain: "Data parallelism copies the whole model to every GPU. To fit, the model or its state must be split." },
  { q: "What do GPUs, TPUs and NPUs have in common?", options: ["They're all made by NVIDIA", "Massive parallel multiply-adds, usually in low precision, fed by a fast memory system", "They all use PCIe Gen 5", "They can't run neural networks"], answer: 1, explain: "Different designs, same bargain: lots of parallel MACs plus a way to feed them data." },
];
const RESULT = {
  perfect: "Perfect! You understand AI computing at scale.",
  good: "Good. Replay 'Data Parallelism' and step through the all-reduce.",
  low: "Revisit 'Data Parallelism': full model per GPU, split batch, average gradients.",
  done: "Unit 5.9 Complete!",
  body: "You can explain data, pipeline, tensor and sharded parallelism, and how TPUs, NPUs and other accelerators relate to GPUs.",
  next: "Next up: Unit 5.C — Grand Capstone: Plan an AI Project.",
  teaser: "Put the whole course to work: plan the GPU side of a real AI project, then run a real language model.",
};

const UNIT_WORDS = [
  ["all-reduce", "a collective communication step", "Every GPU contributes its gradients and receives the average.", "new here"],
  ["DDP", "DistributedDataParallel", "PyTorch's data-parallel wrapper: one process per GPU.", "new here"],
  ["FSDP / ZeRO", "Fully Sharded Data Parallel / Zero Redundancy Optimizer", "Store only a share of the weights, gradients and optimiser state on each GPU.", "new here"],
  ["TPU / NPU", "Tensor / Neural Processing Unit", "AI accelerators from Google / in phones and laptops.", "new here"],
  ["NVLink", "NVIDIA's GPU-to-GPU link", "Much faster than PCIe (Unit 4.1).", "from Unit 4.1"],
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

export default function Unit5_9({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "Centuries on One GPU" },
    { id: "s1", label: "Data Parallelism" },
    { id: "s2", label: "Model Parallelism" },
    { id: "s3", label: "Other Accelerators" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>⏳ Centuries on One GPU — why go multi-GPU</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🍰 Data Parallelism — split the batch, average the gradients</h3><DataParWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🧩 When the Model Doesn't Fit — split the model</h3><ModelParWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🌐 Beyond NVIDIA — TPUs, NPUs and more</h3><AccelWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 5.9.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🌐</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 5 › UNIT 5.9</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Many GPUs & Other Accelerators</div>
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
