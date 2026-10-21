import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab01_AI_Basics.ipynb";

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

const TEXTBOOK = "D2L §5.1–5.3 (Multilayer perceptrons, forward and backward propagation) · Kirk & Hwu Ch 16 (Deep learning)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// ── Section 1: Need — one neuron draws one straight line ──
const PTS = [
  [0.15, 0.2, 0], [0.25, 0.12, 0], [0.85, 0.82, 0], [0.75, 0.9, 0],
  [0.15, 0.82, 1], [0.25, 0.9, 1], [0.85, 0.15, 1], [0.78, 0.25, 1],
];
function NeedWidget() {
  const [ang, setAng] = useState(45);
  const [off, setOff] = useState(0);
  const [two, setTwo] = useState(false);
  const t = (ang * Math.PI) / 180;
  const side = (x, y) => Math.cos(t) * (x - 0.5) + Math.sin(t) * (y - 0.5) - off;
  const pred = (x, y) => (two ? (x + y > 0.6 && x + y < 1.4 ? 1 : 0) : side(x, y) > 0 ? 1 : 0);
  const right = PTS.filter(([x, y, c]) => pred(x, y) === c).length;
  const S = 260, P = (v) => 10 + v * S;
  // the single line: points where side = 0
  const dx = -Math.sin(t), dy = Math.cos(t), cx = 0.5 + off * Math.cos(t), cy = 0.5 + off * Math.sin(t);
  return (
    <div>
      <Frame>
        One neuron can only split the plane with <b style={{ color: C.text }}>one straight line</b>. Here mangoes 🟢 are ripe in the bottom-left
        and top-right, and unripe 🟠 in the other two corners. Turn and slide the line: can you put all the green on one side?
      </Frame>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${S + 20} ${S + 20}`} style={{ width: 280, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
          {two ? (
            <g>
              <line x1={P(0)} y1={P(1 - 0.6)} x2={P(0.6)} y2={P(1)} stroke={C.accent} strokeWidth="2.5" />
              <line x1={P(0.4)} y1={P(0)} x2={P(1)} y2={P(0.6)} stroke={C.accent} strokeWidth="2.5" />
            </g>
          ) : (
            <line x1={P(cx - dx * 2)} y1={P(1 - (cy - dy * 2))} x2={P(cx + dx * 2)} y2={P(1 - (cy + dy * 2))} stroke={C.accent} strokeWidth="2.5" />
          )}
          {PTS.map(([x, y, c], i) => {
            const ok = pred(x, y) === c;
            return <g key={i}><circle cx={P(x)} cy={P(1 - y)} r="9" fill={c ? C.orange : C.green} />{!ok && <circle cx={P(x)} cy={P(1 - y)} r="13" fill="none" stroke={C.red} strokeWidth="2" />}</g>;
          })}
        </svg>
        <div style={{ flex: 1, minWidth: 220 }}>
          {!two && <>
            <Slider label={<>angle = <b style={{ color: C.accent }}>{ang}°</b></>} value={ang} min={0} max={180} onChange={setAng} />
            <Slider label={<>slide = <b style={{ color: C.accent }}>{off}</b></>} value={off} min={-0.6} max={0.6} step={0.05} onChange={setOff} />
          </>}
          <Stat label="CORRECT" value={`${right} / 8`} color={right === 8 ? C.green : C.yellow} />
          <div style={{ marginTop: 10 }}>
            <Btn onClick={() => setTwo((v) => !v)} color={C.purple}>{two ? "◀ Back to one neuron" : "Use a layer of 2 neurons + 1 more ▶"}</Btn>
          </div>
          <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8 }}>{two ? "Two neurons each draw a line; a third neuron combines them: 'between the lines = unripe'." : "Red ring = wrong side. The best one line can do is 6 / 8."}</div>
        </div>
      </div>
      {two && (
        <Insight color={C.purple} title="More neurons, arranged in layers, can carve out shapes that one neuron can't.">
          The first layer draws several lines; the next layer combines them. Stack enough layers and the network can separate
          cats from dogs. That's why it's called <b>deep</b> learning.
        </Insight>
      )}
    </div>
  );
}

// ── Section 2: A layer = a matrix ──
const W = [[2, -1, 0.5], [1, 1, 1], [-1, 3, 0], [0.5, 0, -2]];
const XV = [1, 2, 3];
function LayerWidget() {
  const [k, setK] = useState(-1);
  const out = W.map((row) => row.reduce((s, w, j) => s + w * XV[j], 0));
  return (
    <div>
      <Frame>
        A <b style={{ color: C.text }}>layer</b> is several neurons all reading the same inputs. Write each neuron's weights as one row, and the
        rows form a grid of numbers: a <b style={{ color: C.accent }}>matrix</b> W. Press Step to compute one neuron (one row) at a time.
      </Frame>
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", fontFamily: "monospace" }}>
        <div>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>W (4 neurons × 3 inputs)</div>
          <div style={{ border: `1.5px solid ${C.accent}`, borderRadius: 8, padding: 6 }}>
            {W.map((row, i) => (
              <div key={i} style={{ display: "flex", gap: 4, background: i === k ? C.accent + "33" : "transparent", borderRadius: 4, padding: "2px 4px" }}>
                {row.map((v, j) => <span key={j} style={{ width: 36, textAlign: "right", color: C.text, fontSize: 13 }}>{v}</span>)}
              </div>
            ))}
          </div>
        </div>
        <div style={{ color: C.muted, fontSize: 20 }}>×</div>
        <div>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>x</div>
          <div style={{ border: `1.5px solid ${C.teal}`, borderRadius: 8, padding: 6 }}>
            {XV.map((v, j) => <div key={j} style={{ color: C.teal, fontSize: 13, width: 30, textAlign: "right", background: k >= 0 ? C.teal + "22" : "transparent" }}>{v}</div>)}
          </div>
        </div>
        <div style={{ color: C.muted, fontSize: 20 }}>=</div>
        <div>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>output</div>
          <div style={{ border: `1.5px solid ${C.green}`, borderRadius: 8, padding: 6 }}>
            {out.map((v, i) => <div key={i} style={{ color: i <= k ? C.green : C.border, fontSize: 13, width: 40, textAlign: "right", fontWeight: i === k ? 700 : 400 }}>{i <= k ? v : "?"}</div>)}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, minHeight: 22, fontFamily: "monospace", fontSize: 12.5, color: C.yellow }}>
        {k >= 0 ? `neuron ${k + 1}: ${W[k].map((w, j) => `(${w})(${XV[j]})`).join(" + ")} = ${out[k]}` : "Press Step to compute neuron 1."}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Btn onClick={() => setK((v) => Math.min(3, v + 1))}>Step ▶ ({k + 1} / 4)</Btn>
        <Btn ghost onClick={() => setK(-1)}>↺ Reset</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
        <Code color={C.orange} title="✍️ BY HAND: a loop of dot products">{`for i in range(4):          # each neuron
    out[i] = b[i]
    for j in range(3):      # each input
        out[i] += W[i][j] * x[j]`}</Code>
        <Code color={C.accent} title="🧮 AS MATHS / NUMPY">{`out = W @ x + b

# W @ x is "matrix times vector"`}</Code>
      </div>
      <Insight title="A whole layer is one matrix multiplication.">
        Every row of W is a neuron; every output number is one row "dotted" with the input. Four neurons × three inputs = 12 MACs.
        This is the operation the rest of the course is about.
      </Insight>
    </div>
  );
}

// ── Section 3: Stack layers — count parameters and MACs ──
function StackWidget() {
  const [layers, setLayers] = useState(2);
  const [width, setWidth] = useState(128);
  const sizes = [784, ...Array(layers).fill(width), 10];
  let params = 0, macs = 0;
  for (let i = 0; i < sizes.length - 1; i++) { params += sizes[i] * sizes[i + 1] + sizes[i + 1]; macs += sizes[i] * sizes[i + 1]; }
  return (
    <div>
      <Frame>
        A digit classifier takes 784 pixels in and gives 10 scores out (one per digit 0–9). In between are hidden layers. Change how many
        and how wide, and count the knobs (weights + biases, called <b style={{ color: C.text }}>parameters</b>) and the multiply-adds needed
        for <b style={{ color: C.text }}>one</b> image.
      </Frame>
      <Slider label={<>Hidden layers = <b style={{ color: C.accent }}>{layers}</b></>} value={layers} min={1} max={6} onChange={setLayers} />
      <Slider label={<>Neurons per hidden layer = <b style={{ color: C.accent }}>{width}</b></>} value={width} min={16} max={2048} step={16} onChange={setWidth} />
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", overflowX: "auto", padding: "10px 0" }}>
        {sizes.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 46, height: Math.max(14, Math.min(130, Math.sqrt(s) * 4)), background: (i === 0 ? C.teal : i === sizes.length - 1 ? C.green : C.accent) + "44", border: `1.5px solid ${i === 0 ? C.teal : i === sizes.length - 1 ? C.green : C.accent}`, borderRadius: 6 }} />
              <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{s}</div>
            </div>
            {i < sizes.length - 1 && <div style={{ color: C.muted, marginBottom: 20 }}>→</div>}
          </div>
        ))}
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 12, color: C.muted }}>shapes: {sizes.join(" → ")}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="PARAMETERS (KNOBS)" value={params.toLocaleString("en-IN")} color={C.purple} />
        <Stat label="MACs PER IMAGE" value={macs.toLocaleString("en-IN")} color={C.orange} />
      </div>
      <Insight color={C.purple} title="Each layer is a matrix, and its size multiplies fast.">
        Two layers of 128 already need about 1 lakh multiply-adds per digit. ChatGPT-class models have hundreds of layers and billions of
        parameters, so the number of multiply-adds gets enormous.
      </Insight>
    </div>
  );
}

// ── Section 4: A batch = matrix × matrix, every cell independent ──
function BatchWidget() {
  const N = 8;
  const [mode, setMode] = useState("idle");
  const [done, setDone] = useState(0);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);
  const run = (m) => {
    clearInterval(timer.current); setMode(m);
    if (m === "all") { setDone(0); setTimeout(() => setDone(N * N), 350); return; }
    setDone(0);
    timer.current = setInterval(() => setDone((d) => { if (d + 1 >= N * N) clearInterval(timer.current); return d + 1; }), 90);
  };
  return (
    <div>
      <Frame>
        AI feeds in a <b style={{ color: C.text }}>batch</b> of inputs at once. Stack 8 images as rows of a matrix X and the layer becomes
        <b style={{ color: C.accent }}> matrix × matrix</b>. Each output cell is one dot product (row of X · column of W) that needs no other cell.
        Compute the grid two ways.
      </Frame>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Btn onClick={() => run("one")} color={C.orange}>🐢 One cell at a time</Btn>
        <Btn onClick={() => run("all")} color={C.green}>⚡ All cells at once</Btn>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${N}, 26px)`, gap: 3 }}>
          {Array.from({ length: N * N }, (_, i) => (
            <div key={i} style={{ width: 26, height: 26, borderRadius: 4, background: i < done ? (mode === "all" ? C.green : C.orange) : C.card, border: `1px solid ${C.border}`, transition: mode === "all" ? "background 0.3s" : "none" }} />
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Stat label="CELLS DONE" value={`${done} / ${N * N}`} color={mode === "all" ? C.green : C.orange} />
          <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8, lineHeight: 1.7 }}>
            Real sizes: a batch of 64 images × 784 inputs × 128 neurons = <b style={{ color: C.text }}>64 × 128 = 8,192 cells</b>, each a 784-long
            dot product, for about <b style={{ color: C.orange }}>64 lakh MACs</b>, for just one layer of one batch.
          </div>
        </div>
      </div>
      <Code color={C.accent} title="🧮 THE WHOLE LAYER FOR A WHOLE BATCH">{`Y = X @ W.T + b      # X: (64, 784)   W: (128, 784)   →  Y: (64, 128)`}</Code>
      <Insight color={C.green} title="Every cell of a matrix multiply can be computed independently, so they can all be done at the same time.">
        A machine with one worker fills the grid cell by cell. A machine with thousands of workers fills it almost at once. Keep that
        thought: it is exactly the idea behind the GPU.
      </Insight>
      <LabCard part="E" title="A layer is a matrix multiply: prove it"
        what="Make a random batch X and weights W in NumPy, compute X @ W.T + b, and check it matches PyTorch's nn.Linear with the same weights. Then count the MACs."
        expect="the two outputs match (difference ≈ 0) and shape (64, 128)." />
    </div>
  );
}

const QUESTIONS = [
  { q: "A layer has 5 neurons and each reads 3 inputs. What is the shape of its weight matrix W?", options: ["(3, 3)", "(5, 3)", "(5, 5)", "(15,)"], answer: 1, explain: "One row per neuron, one column per input: 5 rows × 3 columns. That's 15 weights (plus 5 biases)." },
  { q: "W = [[1, 2], [3, 4]] and x = [1, 1]. What is W @ x?", options: ["[3, 7]", "[4, 6]", "[1, 2]", "[10]"], answer: 0, explain: "Row 1 · x = 1 + 2 = 3; Row 2 · x = 3 + 4 = 7. Each output is one row dotted with x." },
  { q: "Why can't a single neuron separate the 'ripe in opposite corners' mangoes?", options: ["It has too few inputs", "It can only draw one straight line", "Its learning rate is wrong", "The data has no labels"], answer: 1, explain: "A neuron's decision boundary is one straight line. Opposite corners need at least two lines, which takes a layer of neurons." },
  { q: "What makes a batch matrix multiply perfect for doing many things at once?", options: ["It uses only integers", "Each output cell is an independent dot product", "It needs no memory", "It is always small"], answer: 1, explain: "No output cell depends on another, so thousands of workers could each compute one cell simultaneously. That's the GPU's whole idea." },
];
const RESULT = {
  perfect: "Perfect! You see neural networks the way hardware does: as matrix multiplies.",
  good: "Good. Replay 'A Layer = A Matrix' and step through the rows again.",
  low: "Revisit 'A Layer = A Matrix': one row = one neuron is the key picture.",
  done: "Unit 1.5 Complete!",
  body: "You can write a layer as W @ x + b, count its parameters and multiply-adds, and explain why batches become matrix × matrix.",
  next: "Next up: Unit 1.C — Capstone: Train a Tiny Network.",
  teaser: "Put the neuron, the loss and gradient descent together, and watch a network learn in front of you.",
};

const UNIT_WORDS = [
  ["MAC", "Multiply-Accumulate", "Multiply, then add to a running total. A layer needs (inputs × neurons) of them.", "from Unit 1.3"],
  ["W @ x", "matrix multiplication", "Python's @ operator multiplies matrices: each output = one row of W dotted with x.", "new here"],
  ["MNIST", "the handwritten-digit dataset", "28 × 28 grey images, so 784 inputs.", "from Unit 1.2"],
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

export default function Unit1_5({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "One Line Isn't Enough" },
    { id: "s1", label: "A Layer = A Matrix" },
    { id: "s2", label: "Stack the Layers" },
    { id: "s3", label: "Batches" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📐 One Line Isn't Enough — why we need layers</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🧱 A Layer = A Matrix — many neurons, one multiply</h3><LayerWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🏗️ Stack the Layers — count the knobs and the work</h3><StackWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>⚡ Batches — matrix × matrix, every cell independent</h3><BatchWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 1.5.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🧱</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 1 › UNIT 1.5</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Layers = Matrix Multiplication</div>
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
