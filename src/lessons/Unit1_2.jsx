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

const TEXTBOOK = "D2L §2.1 (Data manipulation: tensors) · D2L §9.2 (turning text into tokens)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// ── Section 1: Need — the machine only does arithmetic ──
const THINGS = [
  { k: "photo", icon: "🐈", label: "A cat photo", nums: "[[ 12,  15,  20, …],\n [ 14, 180, 210, …],\n …  ]   ← brightness of every dot", note: "A grid of brightness values, one per dot." },
  { k: "text", icon: "💬", label: "\"I love mangoes\"", nums: "[ 41, 893, 2711 ]   ← one ID per word", note: "Each word swapped for its number in a dictionary." },
  { k: "song", icon: "🎵", label: "A song", nums: "[ 0.02, 0.31, 0.58, 0.44, -0.12, … ]   ← 44,100 per second", note: "Air pressure measured 44,100 times every second." },
];
function NeedWidget() {
  const [shown, setShown] = useState([]);
  return (
    <div>
      <Frame>
        From COA you know the ALU can only <b style={{ color: C.text }}>add, subtract, multiply and compare numbers</b>. Ask it to
        "multiply a cat by 2" and it has no idea what you mean. So every AI system starts by turning the world into numbers.
        Click each item to see what the computer actually receives.
      </Frame>
      {THINGS.map((t, i) => {
        const on = shown.includes(i);
        return (
          <div key={t.k} onClick={() => !on && setShown((s) => [...s, i])} style={{ display: "flex", gap: 14, alignItems: "center", background: C.card, border: `1.5px solid ${on ? C.teal : C.border}`, borderRadius: 10, padding: 12, marginBottom: 10, cursor: on ? "default" : "pointer" }}>
            <div style={{ fontSize: 34 }}>{t.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.text, fontWeight: 600, fontSize: 13.5 }}>{t.label} {!on && <span style={{ color: C.muted, fontWeight: 400 }}>→ click to convert</span>}</div>
              {on && <pre style={{ fontFamily: "monospace", fontSize: 12, color: C.teal, margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{t.nums}</pre>}
              {on && <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{t.note}</div>}
            </div>
          </div>
        );
      })}
      {shown.length === THINGS.length && (
        <Insight title="To a computer, every photo, sentence and song is just a long list of numbers.">
          AI never sees the cat. It sees numbers and does arithmetic on them. Keep this in mind for the whole course: that
          arithmetic is the work a GPU will later do very, very fast.
        </Insight>
      )}
    </div>
  );
}

// ── Section 2: Pictures are grids of numbers ──
const LEVELS = [0, 128, 255];
const SEVEN = [
  "00000000", "02222220", "00000220", "00000200", "00002200", "00002000", "00022000", "00000000",
].map((r) => r.split("").map((d) => LEVELS[Number(d)]));
function PixelWidget() {
  const [grid, setGrid] = useState(() => Array.from({ length: 8 }, () => Array(8).fill(0)));
  const [w, setW] = useState(28);
  const [colour, setColour] = useState(false);
  const click = (r, c) => setGrid((g) => g.map((row, i) => row.map((v, j) => (i === r && j === c ? LEVELS[(LEVELS.indexOf(v) + 1) % 3] : v))));
  const count = w * w * (colour ? 3 : 1);
  return (
    <div>
      <Frame>
        A digital image is a grid of tiny dots called <b style={{ color: C.text }}>pixels</b>. Each pixel stores one number: 0 = black,
        255 = white, anything in between is grey. Click the cells to draw (each click cycles 0 → 128 → 255) and watch the
        numbers the computer stores.
      </Frame>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 30px)", gap: 2, background: C.border, padding: 2, borderRadius: 6 }}>
            {grid.map((row, r) => row.map((v, c) => (
              <div key={r + "-" + c} onClick={() => click(r, c)} style={{ width: 30, height: 30, background: `rgb(${v},${v},${v})`, cursor: "pointer" }} />
            )))}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <Btn onClick={() => setGrid(SEVEN.map((r) => [...r]))}>Draw a 7</Btn>
            <Btn ghost onClick={() => setGrid(Array.from({ length: 8 }, () => Array(8).fill(0)))}>Clear</Btn>
          </div>
        </div>
        <pre style={{ flex: 1, minWidth: 250, margin: 0, background: C.card, border: `1.5px solid ${C.teal}`, borderRadius: 10, padding: 12, fontFamily: "monospace", fontSize: 11.5, color: C.teal, lineHeight: 1.75 }}>
          {grid.map((row) => row.map((v) => String(v).padStart(3, " ")).join(" ")).join("\n")}
        </pre>
      </div>
      <div style={{ marginTop: 18, background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 8 }}>How many numbers in one image?</div>
        <Slider label={<>Image width = height = <b style={{ color: C.accent }}>{w}</b> pixels</>} value={w} min={8} max={1080} step={4} onChange={setW} />
        <label style={{ color: C.muted, fontSize: 12.5, cursor: "pointer" }}><input type="checkbox" checked={colour} onChange={(e) => setColour(e.target.checked)} /> Colour image (3 numbers per pixel: Red, Green, Blue)</label>
        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <Stat label="NUMBERS STORED" value={count.toLocaleString("en-IN")} color={C.accent} />
          <Stat label="FOR COMPARISON" value={w === 28 && !colour ? "= one MNIST digit" : w >= 1000 ? "≈ a phone screenshot" : "—"} color={C.purple} />
        </div>
      </div>
      <Insight title="A small 28 × 28 grey digit is already 784 numbers. A 1080 × 1080 colour photo is about 35 lakh.">
        Every one of those numbers goes into the AI's arithmetic. That's why image AI needs so much computing power.
      </Insight>
    </div>
  );
}

// ── Section 3: Words become numbers ──
const VOCAB = { i: 41, love: 893, mangoes: 2711, mango: 2710, the: 5, bus: 1204, is: 12, late: 3330, auto: 1207, happy: 640, sad: 641, train: 1203, am: 30, very: 77, banana: 2712 };
const EMB = {
  mango: [0.82, 0.71], banana: [0.78, 0.80], apple: [0.88, 0.62],
  bus: [-0.70, 0.55], auto: [-0.62, 0.66], train: [-0.80, 0.42],
  happy: [0.10, -0.75], glad: [0.18, -0.82], sad: [-0.25, -0.70],
};
function WordsWidget() {
  const [text, setText] = useState("I love mangoes");
  const [pick, setPick] = useState("mango");
  const toks = text.toLowerCase().replace(/[^a-z ]/g, "").split(/\s+/).filter(Boolean);
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const near = Object.keys(EMB).filter((w) => w !== pick).sort((a, b) => dist(EMB[a], EMB[pick]) - dist(EMB[b], EMB[pick])).slice(0, 2);
  const X = (v) => 170 + v * 140, Y = (v) => 120 - v * 95;
  return (
    <div>
      <Frame>
        Text goes through two steps. <b style={{ color: C.text }}>Step 1:</b> chop the sentence into pieces called tokens and look each one
        up in a fixed dictionary to get an ID number. Type your own sentence.
      </Frame>
      <input value={text} onChange={(e) => setText(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 14, boxSizing: "border-box" }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {toks.map((t, i) => (
          <div key={i} style={{ background: C.card, border: `1.5px solid ${VOCAB[t] ? C.teal : C.red}`, borderRadius: 8, padding: "4px 10px", textAlign: "center" }}>
            <div style={{ color: C.text, fontSize: 12.5 }}>{t}</div>
            <div style={{ color: VOCAB[t] ? C.teal : C.red, fontFamily: "monospace", fontSize: 12 }}>{VOCAB[t] ?? "[UNK] 0"}</div>
          </div>
        ))}
      </div>
      <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Try: <i>the bus is late</i>, <i>I am very happy</i>. Red = not in this tiny dictionary ([UNK] = "unknown"). Real models know about 1 lakh tokens.</div>

      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, margin: "18px 0 10px" }}>
        <b style={{ color: C.text }}>Step 2:</b> an ID alone says nothing about meaning, because 2710 isn't "closer" to 2712 in any useful sense. So each
        token is turned into a list of numbers called an <b style={{ color: C.purple }}>embedding</b>, learned so that words with similar
        meanings end up close together. Real embeddings have hundreds of numbers per word; here we show just 2, so they fit on a map. Click a word.
      </div>
      <svg viewBox="0 0 340 240" style={{ width: "100%", maxWidth: 460, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <line x1="170" y1="10" x2="170" y2="230" stroke={C.border} /><line x1="10" y1="120" x2="330" y2="120" stroke={C.border} />
        {Object.entries(EMB).map(([w, v]) => (
          <g key={w} onClick={() => setPick(w)} style={{ cursor: "pointer" }}>
            <circle cx={X(v[0])} cy={Y(v[1])} r={w === pick ? 7 : 5} fill={w === pick ? C.purple : near.includes(w) ? C.teal : C.muted} />
            <text x={X(v[0]) + 9} y={Y(v[1]) + 4} fill={C.text} fontSize="11">{w}</text>
          </g>
        ))}
      </svg>
      <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 12.5, color: C.purple }}>{pick} → [{EMB[pick][0].toFixed(2)}, {EMB[pick][1].toFixed(2)}]</div>
      <div style={{ color: C.muted, fontSize: 12.5 }}>Nearest words: <b style={{ color: C.teal }}>{near.join(", ")}</b></div>
      <Insight color={C.purple} title="Words become lists of numbers, placed so that closeness means similar meaning.">
        Fruits sit together, vehicles sit together, feelings sit together. Chatbots work entirely in this world of number lists.
      </Insight>
    </div>
  );
}

// ── Section 4: Scalars → vectors → matrices → tensors ──
const SHAPES = [
  { k: "scalar", name: "Scalar", shape: "()", ex: "37.5", what: "One number, e.g. today's temperature.", n: 1 },
  { k: "vector", name: "Vector", shape: "(3,)", ex: "[4.5, 92, 1]", what: "A list: one student's hours, attendance %, and whether they did the homework.", n: 3 },
  { k: "matrix", name: "Matrix", shape: "(28, 28)", ex: "[[0, 0, …],\n [0, 255, …], …]", what: "A grid: one grey digit image.", n: 784 },
  { k: "tensor", name: "3-D tensor", shape: "(3, 224, 224)", ex: "[R grid, G grid, B grid]", what: "A stack of grids: one colour photo (3 colour layers).", n: 3 * 224 * 224 },
];
function TensorWidget() {
  const [sel, setSel] = useState(2);
  const [batch, setBatch] = useState(32);
  const s = SHAPES[sel];
  return (
    <div>
      <Frame>
        AI people use one word for "a box of numbers with some number of dimensions": a <b style={{ color: C.text }}>tensor</b>. Its
        <b style={{ color: C.accent }}> shape</b> tells you how the numbers are arranged. Click through the four kinds.
      </Frame>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {SHAPES.map((x, i) => <Btn key={x.k} ghost={i !== sel} onClick={() => setSel(i)}>{x.name}</Btn>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Code color={C.teal} title={`shape = ${s.shape}`}>{s.ex}</Code>
        <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
          {s.what}<br /><b style={{ color: C.text }}>{s.n.toLocaleString("en-IN")}</b> numbers.
        </div>
      </div>
      <div style={{ marginTop: 16, background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>AI never handles one image at a time. It takes a <span style={{ color: C.orange }}>batch</span>.</div>
        <Slider label={<>Batch size = <b style={{ color: C.orange }}>{batch}</b> colour photos</>} value={batch} min={1} max={256} onChange={setBatch} color={C.orange} />
        <div style={{ fontFamily: "monospace", fontSize: 13, color: C.text }}>shape = ({batch}, 3, 224, 224) → <b style={{ color: C.orange }}>{(batch * 3 * 224 * 224).toLocaleString("en-IN")}</b> numbers in one go</div>
      </div>
      <Insight title="Shapes are how AI code describes its data.">
        A batch of photos is a 4-D tensor. You'll see shapes like (32, 3, 224, 224) printed constantly in PyTorch, and a GPU is
        built to chew through tensors this size.
      </Insight>
      <LabCard part="B" title="Look inside a real image"
        what="Load a handwritten digit from the MNIST dataset, print its 28 × 28 grid of numbers, check its shape, and draw it back as a picture."
        expect="shape (28, 28), values between 0 and 255, and the digit outlined in the printed numbers." />
    </div>
  );
}

const QUESTIONS = [
  { q: "A grey image is 28 pixels wide and 28 pixels tall. How many numbers does the computer store for it?", options: ["28", "56", "784", "2,352"], answer: 2, explain: "One number per pixel: 28 × 28 = 784. A colour image would need 3 per pixel (R, G, B), giving 2,352." },
  { q: "Why are words turned into embeddings instead of being left as dictionary IDs?", options: ["IDs are too long to store", "IDs carry no meaning; embeddings place similar words close together", "Embeddings use fewer numbers", "GPUs cannot read integers"], answer: 1, explain: "ID 2710 being next to 2712 means nothing. Embeddings are learned so that distance reflects meaning: mango sits near banana." },
  { q: "A batch of 64 colour photos, each 224 × 224, has which shape?", options: ["(64, 224)", "(224, 224, 64)", "(64, 3, 224, 224)", "(3, 64)"], answer: 2, explain: "Batch size first, then 3 colour layers, then height and width: (64, 3, 224, 224)." },
  { q: "Pixel value 0 means black and 255 means white. What does 128 look like?", options: ["Bright red", "Mid grey", "Transparent", "An error"], answer: 1, explain: "128 is about halfway between 0 and 255, so it's mid grey. Brightness is just a number." },
];
const RESULT = {
  perfect: "Perfect! You see the world the way an AI does: as numbers.",
  good: "Good. Replay 'Tensors & Shapes' to lock in what a shape means.",
  low: "Revisit 'Pictures Are Grids': every pixel is one number, and that idea is the base for everything else.",
  done: "Unit 1.2 Complete!",
  body: "You can turn images and text into numbers and describe them with tensor shapes.",
  next: "Next up: Unit 1.3 — The Neuron.",
  teaser: "The tiny calculator, built from multiply and add, that all of AI is made of.",
};

const UNIT_WORDS = [
  ["ALU", "Arithmetic Logic Unit", "The part of a processor that adds, multiplies and compares numbers.", "from COA"],
  ["RGB", "Red, Green, Blue", "The three numbers stored for every pixel of a colour image.", "new here"],
  ["MNIST", "Modified National Institute of Standards and Technology dataset", "70,000 small images of handwritten digits 0–9, the classic first AI dataset.", "new here"],
  ["UNK", "Unknown token", "The placeholder used for a word that isn't in the dictionary.", "new here"],
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
    { id: "s0", label: "Only Numbers" },
    { id: "s1", label: "Pictures = Grids" },
    { id: "s2", label: "Words → Numbers" },
    { id: "s3", label: "Tensors & Shapes" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔢 Only Numbers — what the machine actually receives</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🖼️ Pictures Are Grids — pixels are numbers</h3><PixelWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>💬 Words Become Numbers — tokens and embeddings</h3><WordsWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📦 Tensors & Shapes — boxes of numbers</h3><TensorWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 1.2.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔢</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 1 › UNIT 1.2</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Everything Is Numbers</div>
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
