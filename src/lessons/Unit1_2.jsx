import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab1_AI_Is_Hungry.ipynb";

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
      <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>🧪 TRY IT FOR REAL — LAB 1 · PART {part}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{what}</div>
      <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}><b style={{ color: C.green }}>You should see:</b> {expect}</div>
      <a href={LAB_URL} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", borderRadius: 8, background: C.orange, color: "#0D1117", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Open Lab 1 in Colab ↗</a>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 8 }}>Colab opens in a new tab. Click <b>File → Save a copy in Drive</b> first, then scroll to Part {part}.</div>
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

const TEXTBOOK = "D2L §5.3 (Forward and backward propagation) · D2L Ch 12 (Optimization: minibatches)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


const fmt = (x) => {
  const u = [["", 1], [" thousand", 1e3], [" million", 1e6], [" billion", 1e9], [" trillion", 1e12], [" quadrillion", 1e15], [" quintillion", 1e18], [" sextillion", 1e21], [" septillion", 1e24]];
  let k = 0; while (k < u.length - 1 && x >= u[k + 1][1]) k++;
  return `${(x / u[k][1]).toFixed(x / u[k][1] < 10 ? 1 : 0)}${u[k][0]}`;
};

// ── Section 1: Need — using a model vs teaching it ──
function NeedWidget() {
  const [mode, setMode] = useState("infer");
  const steps = mode === "infer"
    ? [["Forward pass", "Data flows in, through every layer, to an answer.", 1, C.accent]]
    : [["Forward pass", "Same as using it: compute the answer.", 1, C.accent], ["Backward pass", "Work out every weight's gradient, layer by layer, from the output back to the input. About twice the work of the forward pass.", 2, C.orange], ["Update", "Nudge every weight: w ← w − lr × gradient.", 0.1, C.green]];
  const total = steps.reduce((s, x) => s + x[2], 0);
  return (
    <div>
      <Frame>
        An AI model has two lives. <b style={{ color: C.accent }}>Inference</b> is using a trained model, like writing an exam.
        <b style={{ color: C.orange }}> Training</b> is teaching it, like the months of preparation before. Switch between them and see what has
        to be computed for ONE example.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Btn ghost={mode !== "infer"} onClick={() => setMode("infer")}>📝 Inference (use it)</Btn>
        <Btn ghost={mode !== "train"} onClick={() => setMode("train")} color={C.orange}>🏋️ Training (teach it)</Btn>
      </div>
      {steps.map(([t, d, c, col]) => (
        <div key={t} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><b style={{ color: col }}>{t}</b><span style={{ color: C.muted, fontFamily: "monospace" }}>≈ {c}× forward</span></div>
          <div style={{ height: 14, background: C.card, borderRadius: 4 }}><div style={{ width: `${(c / 3.1) * 100}%`, height: "100%", background: col, borderRadius: 4, minWidth: 6 }} /></div>
          <div style={{ color: C.muted, fontSize: 12.5, marginTop: 3 }}>{d}</div>
        </div>
      ))}
      <Stat label="WORK PER EXAMPLE" value={`≈ ${total.toFixed(1)}× a forward pass`} color={mode === "infer" ? C.accent : C.orange} />
      <Insight color={C.orange} title="Training one example costs about 3 forward passes, and training sees each example many times over.">
        Inference happens once per question. Training repeats forward + backward + update over the whole dataset, again and again. That's why
        training is the hungriest job in AI.
      </Insight>
    </div>
  );
}

// ── Section 2: Forward and backward, traced ──
const FB = [
  { a: -1, txt: "A batch of images enters the input layer.", phase: "f" },
  { a: 0, txt: "Layer 1 computes X @ W₁ + b₁, then ReLU. Its output is SAVED in memory: backward will need it.", phase: "f" },
  { a: 1, txt: "Layer 2 does the same with W₂. Output saved again.", phase: "f" },
  { a: 2, txt: "Layer 3 gives the 10 scores, and the loss compares them with the right answers.", phase: "f" },
  { a: 2, txt: "BACKWARD starts at the loss: how should the scores change? That gives the gradient for W₃.", phase: "b" },
  { a: 1, txt: "Pass the blame back one layer (using the saved output of layer 2) to get W₂'s gradient.", phase: "b" },
  { a: 0, txt: "Back again, using layer 1's saved output, to get W₁'s gradient. This is backpropagation.", phase: "b" },
  { a: 3, txt: "UPDATE: every weight takes its small step. One iteration done; the saved outputs can be thrown away.", phase: "u" },
];
function TraceWidget() {
  const [i, setI] = useState(0);
  const s = FB[i];
  const col = s.phase === "f" ? C.accent : s.phase === "b" ? C.orange : C.green;
  const saved = FB.slice(0, i + 1).filter((x) => x.phase === "f" && x.a >= 0 && x.a < 2).length;
  return (
    <div>
      <Frame>Step through one training iteration on a 3-layer network. Watch the direction change, and watch what has to be remembered.</Frame>
      <svg viewBox="0 0 560 150" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        {["Input", "Layer 1", "Layer 2", "Layer 3 + loss"].map((t, k) => {
          const on = (s.phase !== "u" && s.a === k - 1) || (s.phase === "f" && s.a === -1 && k === 0) || s.phase === "u";
          return (
            <g key={t}>
              <rect x={20 + k * 135} y="40" width="110" height="56" rx="8" fill={on ? col + "33" : C.surface} stroke={on ? col : C.border} strokeWidth="2" />
              <text x={75 + k * 135} y="73" fill={C.text} fontSize="12" textAnchor="middle">{t}</text>
              {k > 0 && k < 3 && saved >= k && s.phase !== "u" && <text x={75 + k * 135} y="116" fill={C.teal} fontSize="10" textAnchor="middle">💾 output saved</text>}
              {k < 3 && <text x={140 + k * 135} y="72" fill={C.muted} fontSize="14" textAnchor="middle">{s.phase === "b" ? "←" : "→"}</text>}
            </g>
          );
        })}
        <text x="20" y="22" fill={col} fontSize="12" fontWeight="700">{s.phase === "f" ? "FORWARD →" : s.phase === "b" ? "← BACKWARD" : "UPDATE ✓"}</text>
      </svg>
      <div style={{ marginTop: 10, minHeight: 40, color: C.text, fontSize: 13, lineHeight: 1.6 }}>{s.txt}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={() => setI((v) => Math.min(FB.length - 1, v + 1))}>Step ▶ ({i + 1} / {FB.length})</Btn>
        <Btn ghost onClick={() => setI(0)}>↺ Reset</Btn>
      </div>
      <Insight color={C.teal} title="Training needs extra memory as well as extra arithmetic.">
        Every layer's output from the forward pass is stored until the backward pass uses it. Big batches × big layers = lots of saved numbers.
        In Module 5 this is the reason for the famous "CUDA out of memory" error.
      </Insight>
    </div>
  );
}

// ── Section 3: Epochs, batches, iterations ──
function EpochWidget() {
  const [N, setN] = useState(60000);
  const [B, setB] = useState(64);
  const [E, setE] = useState(3);
  const iters = Math.ceil(N / B);
  const [cur, setCur] = useState(0);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);
  const play = () => { clearInterval(timer.current); setCur(0); timer.current = setInterval(() => setCur((c) => { if (c >= 39) { clearInterval(timer.current); return 39; } return c + 1; }), 80); };
  return (
    <div>
      <Frame>
        Three words you'll see in every training log. A <b style={{ color: C.orange }}>batch</b> is a handful of examples processed together.
        An <b style={{ color: C.accent }}>iteration</b> is one forward + backward + update on one batch. An <b style={{ color: C.purple }}>epoch</b> is
        one full pass over the whole dataset.
      </Frame>
      <Slider label={<>Dataset size = <b style={{ color: C.teal }}>{N.toLocaleString("en-IN")}</b> examples</>} value={N} min={1000} max={100000} step={1000} onChange={setN} color={C.teal} />
      <Slider label={<>Batch size = <b style={{ color: C.orange }}>{B}</b></>} value={B} min={1} max={1024} onChange={setB} color={C.orange} />
      <Slider label={<>Epochs = <b style={{ color: C.purple }}>{E}</b></>} value={E} min={1} max={50} onChange={setE} color={C.purple} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="ITERATIONS PER EPOCH" value={iters.toLocaleString("en-IN")} color={C.accent} />
        <Stat label="TOTAL WEIGHT UPDATES" value={(iters * E).toLocaleString("en-IN")} color={C.green} />
        <Stat label="EXAMPLES PROCESSED" value={(N * E).toLocaleString("en-IN")} color={C.purple} />
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>One epoch, drawn as 40 slices of the dataset:</div>
        <div style={{ display: "flex", gap: 2 }}>{Array.from({ length: 40 }, (_, k) => <div key={k} style={{ flex: 1, height: 22, borderRadius: 3, background: k < cur ? C.green : k === cur ? C.orange : C.card, border: `1px solid ${C.border}` }} />)}</div>
        <div style={{ marginTop: 8 }}><Btn onClick={play} color={C.orange}>▶ Play an epoch</Btn></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
        {[["Batch = 1", C.red, "Very noisy steps, and the hardware sits mostly idle: a tiny matrix multiply can't keep many workers busy."], ["Batch = 32–512", C.green, "The usual sweet spot: big enough matrix multiplies, steady steps, fits in memory."], ["Batch = huge", C.yellow, "Needs lots of memory, and makes fewer (if larger) updates per epoch."]].map(([t, c, d]) => (
          <div key={t} style={{ background: C.card, borderRadius: 8, padding: 10, border: `1.5px solid ${c}` }}><b style={{ color: c, fontSize: 12.5 }}>{t}</b><div style={{ color: C.muted, fontSize: 12, marginTop: 4, lineHeight: 1.6 }}>{d}</div></div>
        ))}
      </div>
      <Insight color={C.purple} title="Batches turn many small sums into one big matrix multiply.">
        From Unit 0.5: a batch makes the layer X @ W with many rows. Bigger, fewer matrix multiplies suit parallel hardware far better than
        thousands of tiny ones. Unit 5.4 measures this on a real GPU.
      </Insight>
    </div>
  );
}

// ── Section 4: The training bill ──
function BillWidget() {
  const [params, setParams] = useState(1);
  const [tokens, setTokens] = useState(20);
  const P = params * 1e9, D = tokens * 1e9;
  const train = 6 * P * D;
  const answer = 2 * P * 650;
  const t4 = 6.5e13 * 0.4;
  const days = train / t4 / 86400;
  return (
    <div>
      <Frame>
        A widely used rule of thumb for language models: <b style={{ color: C.text }}>training FLOPs ≈ 6 × parameters × training tokens</b>
        (2 for forward + 4 for backward, per parameter per token). Compare that with answering one question.
      </Frame>
      <Slider label={<>Model size = <b style={{ color: C.accent }}>{params} billion</b> parameters</>} value={params} min={0.1} max={200} step={0.1} onChange={setParams} />
      <Slider label={<>Training data = <b style={{ color: C.purple }}>{tokens} billion</b> tokens</>} value={tokens} min={1} max={2000} onChange={setTokens} color={C.purple} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="TRAINING (ONCE)" value={`${fmt(train)} FLOPs`} color={C.orange} />
        <Stat label="ONE 500-WORD ANSWER" value={`${fmt(answer)} FLOPs`} color={C.accent} />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <Stat label="ON ONE T4 GPU (40% OF PEAK)" value={days < 1 ? `${(days * 24).toFixed(1)} hours` : days < 730 ? `${days.toFixed(0)} days` : `${(days / 365).toFixed(0)} years`} color={days > 365 ? C.red : C.yellow} />
        <Stat label="TRAINING = HOW MANY ANSWERS?" value={fmt(train / answer)} color={C.purple} />
      </div>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 6 }}>Assumes the T4's 65 TFLOPS FP16 peak and 40% average use (approximate). Real projects use thousands of bigger GPUs at once.</div>
      <Insight color={C.orange} title="Training is a one-time mountain; inference is a daily river.">
        A big model's training run would take a single GPU centuries, so companies split it across thousands of GPUs (Unit 5.9). Serving
        crores of users adds up too. Either way the answer is the same: more parallel arithmetic.
      </Insight>
      <LabCard part="B" title="Time inference vs training on the CPU"
        what="Take your Lab 0 network, time 100 forward passes on a batch, then time 100 full training iterations (forward + backward + update), and compute the ratio."
        expect="a training iteration takes roughly 2–4× as long as a forward pass alone." />
    </div>
  );
}

const QUESTIONS = [
  { q: "A dataset has 10,000 images and the batch size is 100. How many iterations make one epoch?", options: ["10", "100", "1,000", "10,000"], answer: 1, explain: "10,000 ÷ 100 = 100 batches. Each batch is one iteration, and doing them all is one epoch." },
  { q: "Roughly how much work is ONE training step on an example, compared with one inference (forward pass)?", options: ["The same", "About half", "About 3 times", "About 100 times"], answer: 2, explain: "Forward (1×) + backward (≈ 2×) + a small update ≈ 3× a forward pass." },
  { q: "Why does training need much more memory than inference?", options: ["Weights are stored twice", "Each layer's forward output must be saved until the backward pass uses it", "The dataset is copied into every layer", "The learning rate takes memory"], answer: 1, explain: "Backpropagation needs the saved outputs (activations) of every layer, so they all stay in memory during the iteration." },
  { q: "Using training FLOPs ≈ 6 × parameters × tokens: a 1-billion-parameter model trained on 10 billion tokens needs about…", options: ["6 × 10¹⁰", "6 × 10¹⁹", "10¹⁹", "6 × 10⁹"], answer: 1, explain: "6 × 10⁹ × 10¹⁰ = 6 × 10¹⁹ FLOPs." },
];
const RESULT = {
  perfect: "Perfect! You can read a training log and estimate its cost.",
  good: "Good. Replay 'Forward & Backward' and watch the saved outputs.",
  low: "Revisit 'Use vs Teach' and 'Epochs & Batches': they're the vocabulary for the rest of the course.",
  done: "Unit 1.2 Complete!",
  body: "You can explain inference vs training, forward vs backward, and epochs vs batches vs iterations, and estimate a training bill.",
  next: "Next up: Unit 1.3 — Every Output Is Independent.",
  teaser: "All this work has a hidden gift: most of it doesn't have to wait in a queue.",
};

const UNIT_WORDS = [
  ["FLOP", "FLoating-point OPeration", "One add or multiply on decimal numbers.", "from Unit 1.1"],
  ["lr", "learning rate", "The size of each update step.", "from Unit 0.4"],
  ["CUDA", "Compute Unified Device Architecture", "NVIDIA's system for programming its GPUs. Used properly from Module 4.", "new here"],
  ["T4", "NVIDIA Tesla T4", "The GPU you get free in Google Colab.", "new here"],
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

export default function Unit1_2({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "Use vs Teach" },
    { id: "s1", label: "Forward & Backward" },
    { id: "s2", label: "Epochs & Batches" },
    { id: "s3", label: "The Training Bill" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📝 Use vs Teach — inference and training</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔁 Forward & Backward — one iteration, traced</h3><TraceWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🍰 Epochs, Batches, Iterations — the vocabulary of training</h3><EpochWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🧾 The Training Bill — 6 × parameters × tokens</h3><BillWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 1.2.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏋️</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 1 › UNIT 1.2</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Training vs Inference, Epochs & Batches</div>
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
