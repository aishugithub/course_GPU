import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab5A_Why_GPUs_Make_AI_Fast.ipynb";

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
      <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>🧪 TRY IT FOR REAL — LAB 5A · PART {part}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{what}</div>
      <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}><b style={{ color: C.green }}>You should see:</b> {expect}</div>
      <a href={LAB_URL} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", borderRadius: 8, background: C.orange, color: "#0D1117", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Open Lab 5A in Colab ↗</a>
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

const TEXTBOOK = "D2L Ch 12 (Minibatch stochastic gradient descent) · D2L Ch 13 (Computational performance)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// ── Section 1: Need — "only 3× faster?" ──
function NeedWidget() {
  const [width, setWidth] = useState(128);
  const [B, setB] = useState(64);
  const params = 784 * width + width * width + width * 10;
  const flops = 6 * params * B;                          // training FLOPs per step (Unit 1.2)
  const prep = 0.004 * B;                                // ms of CPU data work per step (same on both)
  const cpu = flops / 8e10 * 1000 + 0.15 + prep;         // Colab's 2-core CPU
  const gpu = flops / 4e12 * 1000 + 0.3 + prep;          // 0.3 ms of launch overheads per step
  return (
    <div>
      <Frame>
        Students run Lab 0's digit network on the GPU and are disappointed: "only about 2× faster!" Explore why with this simple model of one
        training step. Make the network wider and the batch bigger.
      </Frame>
      <Slider label={<>Hidden layer width = <b style={{ color: C.accent }}>{width}</b> ({params.toLocaleString("en-IN")} parameters)</>} value={width} min={64} max={4096} step={64} onChange={setWidth} />
      <Slider label={<>Batch size = <b style={{ color: C.orange }}>{B}</b></>} value={B} min={8} max={1024} step={8} onChange={setB} color={C.orange} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="CPU STEP" value={`${cpu.toFixed(2)} ms`} color={C.orange} />
        <Stat label="GPU STEP" value={`${gpu.toFixed(2)} ms`} color={C.green} />
        <Stat label="GPU SPEED-UP" value={`${(cpu / gpu).toFixed(1)}×`} color={cpu / gpu > 10 ? C.green : C.yellow} />
      </div>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 6 }}>Model: Colab CPU 0.08 TFLOPS, GPU 4 TFLOPS effective; CPU pays ~0.15 ms and GPU ~0.3 ms of fixed overhead per step; both pay the same CPU data-preparation time. Illustrative.</div>
      <Insight color={C.yellow} title="A tiny model with small batches can't keep 2,560 cores busy. The GPU's advantage grows with the work per step.">
        The fixed costs (kernel launches, data preparation) dominate small steps: Amdahl again. Real AI models are big, which is exactly where GPUs shine.
      </Insight>
    </div>
  );
}

// ── Section 2: Throughput vs memory ──
function ThroughputWidget() {
  const [B, setB] = useState(64);
  const over = 0.4, per = 0.012;                     // ms per step overhead, ms per image of real work
  const tput = (b) => (b / (over + per * b)) * 1000;
  const mem = (b) => 0.6 + 0.022 * b;                // GB: weights + optimiser + activations per image (illustrative)
  const OOM = 15;
  const maxB = Math.floor((OOM - 0.6) / 0.022);
  const X = (b) => 30 + (Math.log2(b) / 11) * 460;
  return (
    <div>
      <Frame>
        Bigger batches spread the fixed per-step costs over more images, so <b style={{ color: C.green }}>throughput</b> (images per second) rises. But
        every image in the batch needs memory for its saved activations (Unit 1.2), so <b style={{ color: C.red }}>memory</b> rises too, up to the T4's limit.
      </Frame>
      <Slider label={<>Batch size = <b style={{ color: C.orange }}>{B}</b></>} value={B} min={1} max={1024} onChange={setB} color={C.orange} />
      <svg viewBox="0 0 520 190" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <polyline fill="none" stroke={C.green} strokeWidth="2.5" points={Array.from({ length: 45 }, (_, i) => 2 ** (i / 4)).map((b) => `${X(b)},${170 - (tput(b) / 85000) * 150}`).join(" ")} />
        <polyline fill="none" stroke={C.red} strokeWidth="2" strokeDasharray="5 4" points={Array.from({ length: 45 }, (_, i) => 2 ** (i / 4)).map((b) => `${X(b)},${170 - (Math.min(mem(b), 24) / 24) * 150}`).join(" ")} />
        <line x1="30" x2="500" y1={170 - (OOM / 24) * 150} y2={170 - (OOM / 24) * 150} stroke={C.red} strokeWidth="1" />
        <text x="34" y={165 - (OOM / 24) * 150} fill={C.red} fontSize="10">T4 memory limit (≈ 15 GB usable)</text>
        <line x1={X(B)} x2={X(B)} y1="15" y2="172" stroke={C.orange} strokeDasharray="3 3" />
        {[1, 4, 16, 64, 256, 1024].map((b) => <text key={b} x={X(b)} y="185" fill={C.muted} fontSize="9" textAnchor="middle">{b}</text>)}
        <text x="380" y="30" fill={C.green} fontSize="10">— throughput</text><text x="380" y="44" fill={C.red} fontSize="10">- - memory</text>
      </svg>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="IMAGES PER SECOND" value={B > maxB ? "💥 out of memory" : Math.round(tput(B)).toLocaleString("en-IN")} color={B > maxB ? C.red : C.green} />
        <Stat label="GPU MEMORY" value={`${mem(B).toFixed(1)} GB`} color={B > maxB ? C.red : C.teal} />
        <Stat label="LARGEST BATCH THAT FITS" value={maxB} color={C.purple} />
      </div>
      <Insight color={C.green} title="Throughput rises steeply at first, then flattens once the GPU is full. Memory just keeps climbing.">
        A good batch size sits on the flat part of the green curve, safely below the red line. Mixed precision (Unit 5.2) halves the activation memory,
        so batches can be bigger.
      </Insight>
    </div>
  );
}

// ── Section 3: Faster epochs ≠ faster learning ──
function TradeoffWidget() {
  const [B, setB] = useState(128);
  const epochTime = (b) => 60000 / ((b / (0.4 + 0.012 * b)) * 1000);       // seconds per MNIST epoch (from section 2)
  const epochsNeeded = (b) => 2 + Math.pow(b / 256, 1.3) * 1.5;           // illustrative: big batches need more epochs
  const total = (b) => epochTime(b) * epochsNeeded(b);
  const Bs = [8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
  const best = Bs.reduce((a, b) => (total(b) < total(a) ? b : a));
  const maxT = Math.max(...Bs.map(total));
  return (
    <div>
      <Frame>
        A bigger batch makes each <b style={{ color: C.text }}>epoch</b> faster, but it also makes <b style={{ color: C.text }}>fewer weight updates</b> per epoch (Unit 1.2), so the model may
        need more epochs to learn as well. What matters is the total time to reach a good accuracy. (Illustrative curves; the usual fix for big batches is
        a proportionally larger learning rate.)
      </Frame>
      <Slider label={<>Batch size = <b style={{ color: C.orange }}>{B}</b></>} value={B} min={8} max={4096} step={8} onChange={setB} color={C.orange} />
      <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 120, padding: "0 4px" }}>
        {Bs.map((b) => (
          <div key={b} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: (total(b) / maxT) * 100, background: b === best ? C.green : C.accent + "88", borderRadius: "3px 3px 0 0" }} />
            <div style={{ color: C.muted, fontSize: 9 }}>{b}</div>
          </div>
        ))}
      </div>
      <div style={{ color: C.muted, fontSize: 11.5, textAlign: "center" }}>total training time to reach the target accuracy, by batch size (green = shortest)</div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="UPDATES PER EPOCH" value={Math.ceil(60000 / B).toLocaleString("en-IN")} color={C.purple} />
        <Stat label="SECONDS PER EPOCH" value={epochTime(B).toFixed(2)} color={C.green} />
        <Stat label="EPOCHS NEEDED (ILLUSTRATIVE)" value={epochsNeeded(B).toFixed(1)} color={C.yellow} />
        <Stat label="TOTAL" value={`${total(B).toFixed(1)} s`} color={B === best ? C.green : C.text} />
      </div>
      <Insight color={C.purple} title="There's a sweet spot: big enough to fill the GPU, not so big that learning slows down.">
        That's why batch sizes of 32–512 are so common, and why people tune the learning rate together with the batch size.
      </Insight>
    </div>
  );
}

// ── Section 4: The GPU training recipe ──
const RECIPE = [
  { t: "Pick the device and move the model once", code: `device = "cuda" if torch.cuda.is_available() else "cpu"\nmodel = model.to(device)`, u: "5.1" },
  { t: "Feed data fast: workers + pinned memory", code: `loader = DataLoader(data, batch_size=256, shuffle=True,\n                    num_workers=2, pin_memory=True)`, u: "5.4" },
  { t: "Copy each batch without blocking", code: `x = x.to(device, non_blocking=True)`, u: "5.4" },
  { t: "Batch size that fills the GPU but fits in memory", code: `# try 64, 128, 256 … watch throughput and nvidia-smi`, u: "6.4" },
  { t: "Mixed precision for Tensor Cores", code: `with torch.autocast("cuda", dtype=torch.float16):\n    loss = loss_fn(model(x), y)\nscaler.scale(loss).backward()`, u: "6.2" },
  { t: "No per-step sync points", code: `running += loss.detach()     # .item() once per epoch`, u: "5.4" },
  { t: "Let cuDNN pick the fastest kernels", code: `torch.backends.cudnn.benchmark = True`, u: "6.1" },
  { t: "Optional: compile to fuse operations", code: `model = torch.compile(model)`, u: "6.3" },
];
function RecipeWidget() {
  const [done, setDone] = useState([]);
  const [open, setOpen] = useState(0);
  return (
    <div>
      <Frame>Everything from Modules 4 and 5 as one checklist: the GPU training recipe. Click each item to see the code, and tick it off.</Frame>
      {RECIPE.map((r, i) => {
        const on = done.includes(i);
        return (
          <div key={i} style={{ background: C.card, border: `1.5px solid ${on ? C.green : C.border}`, borderRadius: 8, padding: "8px 12px", marginBottom: 6 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }} onClick={() => setOpen(i)}>
              <span onClick={(e) => { e.stopPropagation(); setDone((s) => (on ? s.filter((x) => x !== i) : [...s, i])); }} style={{ fontSize: 16 }}>{on ? "✅" : "⬜"}</span>
              <span style={{ flex: 1, color: C.text, fontSize: 13 }}>{r.t}</span>
              <span style={{ color: C.accent, fontFamily: "monospace", fontSize: 11.5 }}>Unit {r.u}</span>
            </div>
            {open === i && <pre style={{ margin: "8px 0 0", fontFamily: "monospace", fontSize: 11.5, color: C.teal, whiteSpace: "pre-wrap" }}>{r.code}</pre>}
          </div>
        );
      })}
      <div style={{ color: done.length === RECIPE.length ? C.green : C.muted, fontSize: 12.5 }}>{done.length} / {RECIPE.length} ingredients ticked</div>
      <Insight color={C.green} title="Eight lines turn 'it runs on the GPU' into 'it runs WELL on the GPU'.">
        None of them changes the model or the maths, only how the work is fed to the hardware. That's the practical skill this course set out to build.
      </Insight>
      <LabCard part="D" title="Real training on the T4: CPU vs GPU, batch sweep, mixed precision"
        what="Train a wider MNIST network for one epoch on the CPU and on the GPU, sweep the batch size and plot images per second, then switch on autocast and compare speed and accuracy."
        expect="a big GPU speed-up for the wide network, throughput rising then levelling off with batch size, and autocast faster at the same accuracy." />
    </div>
  );
}

const QUESTIONS = [
  { q: "Why does a tiny model with batch size 16 get only a small speed-up on a GPU?", options: ["GPUs are slow at small numbers", "Fixed per-step costs (launches, data prep) dominate, and there's too little work to fill the cores", "The CPU secretly helps", "The learning rate is wrong"], answer: 1, explain: "Amdahl's law: the fixed overheads don't shrink, and a small step can't keep 2,560 cores busy." },
  { q: "As batch size grows, throughput (images per second)…", options: ["keeps doubling forever", "rises, then levels off once the GPU is fully used", "falls", "stays the same"], answer: 1, explain: "Overheads get spread out until the GPU is saturated; after that, more images per step just take proportionally longer." },
  { q: "What usually limits how big a batch you can use?", options: ["The number of CPU cores", "GPU memory for the saved activations of every image", "The size of the dataset file", "The clock speed"], answer: 1, explain: "Each image's activations are stored for the backward pass. Too many images → 'CUDA out of memory'." },
  { q: "Why isn't the biggest batch that fits always the fastest way to train?", options: ["It uses more electricity", "Fewer weight updates per epoch can mean more epochs are needed to reach the same accuracy", "It always crashes", "Batches must be powers of 10"], answer: 1, explain: "Time per epoch falls, but learning per epoch can fall too. Total time to accuracy has a sweet spot." },
];
const RESULT = {
  perfect: "Perfect! You can train models efficiently on a GPU.",
  good: "Good. Replay 'Throughput vs Memory' and find the largest batch that fits.",
  low: "Revisit 'Only 3× Faster?': fixed costs vs work per step is the key idea.",
  done: "Unit 5.4 Complete!",
  body: "You can choose batch sizes, reason about throughput, memory and learning speed, and apply the full GPU training recipe.",
  next: "Next up: Unit 5.5 — Capstone: Speed Up a Training Run.",
  teaser: "Take a slow image-classifier training run and apply every trick, measuring each one's effect.",
};

const UNIT_WORDS = [
  ["throughput", "work per second", "Here: images processed per second during training.", "from Unit 2.1"],
  ["OOM", "Out Of Memory", "The 'CUDA out of memory' error when tensors don't fit in GPU memory (Unit 5.8).", "new here"],
  ["cuDNN", "CUDA Deep Neural Network library", "NVIDIA's library of fast kernels for neural-network layers.", "new here"],
  ["AMP", "Automatic Mixed Precision", "autocast + GradScaler (Unit 5.2).", "from Unit 5.2"],
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

export default function Unit5_4({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "Only 3× Faster?" },
    { id: "s1", label: "Throughput vs Memory" },
    { id: "s2", label: "Faster ≠ Better" },
    { id: "s3", label: "The Recipe" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🤨 Only 3× Faster? — when the GPU is underused</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📈 Throughput vs Memory — choosing a batch size</h3><ThroughputWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>⚖️ Faster Epochs ≠ Faster Learning</h3><TradeoffWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📋 The GPU Training Recipe</h3><RecipeWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 5.4.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏋️</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 5 › UNIT 5.4</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Batch Size & Training on GPU</div>
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
