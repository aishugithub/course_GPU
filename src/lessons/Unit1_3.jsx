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

const TEXTBOOK = "Hamacher §12.2 (Vector (SIMD) processing: vectorization) · H&P §4.1 and §4.5 (Data-level and loop-level parallelism)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// ── Section 1: Need — one worker, n³ steps ──
function NeedWidget() {
  const [n, setN] = useState(1000);
  const macs = n ** 3;
  const secs = macs / 1e9;
  const show = secs < 1 ? `${(secs * 1000).toFixed(1)} ms` : secs < 120 ? `${secs.toFixed(1)} s` : secs < 7200 ? `${(secs / 60).toFixed(0)} min` : `${(secs / 3600).toFixed(1)} hours`;
  return (
    <div>
      <Frame>
        Multiplying two n × n matrices takes n × n output cells, each a dot product of length n: <b style={{ color: C.text }}>n³ multiply-adds</b>.
        Suppose a single worker does one MAC per nanosecond (10⁹ per second), one after another, the way the CPU in COA steps through
        instructions. Drag n.
      </Frame>
      <Slider label={<>Matrix size n = <b style={{ color: C.accent }}>{n.toLocaleString("en-IN")}</b></>} value={n} min={100} max={20000} step={100} onChange={setN} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="OUTPUT CELLS (n²)" value={(n * n).toLocaleString("en-IN")} color={C.teal} />
        <Stat label="MACs (n³)" value={macs.toExponential(2)} color={C.orange} />
        <Stat label="ONE WORKER, IN ORDER" value={show} color={secs > 60 ? C.red : C.yellow} />
      </div>
      <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8 }}>Double n and the time goes up 8×. A single layer of a big model can be a matrix with a size in the thousands, and it's used again for every token.</div>
      <Insight color={C.red} title="Doing it one step at a time doesn't scale.">
        Making the single worker faster helps only a little (Unit 2.2 shows why clock speeds stopped rising). The real question is: do these
        steps actually <i>have</i> to happen one after another?
      </Insight>
    </div>
  );
}

// ── Section 2: Who waits for whom? ──
function DependWidget() {
  const [task, setTask] = useState("matmul");
  const [cell, setCell] = useState([1, 2]);
  const [day, setDay] = useState(3);
  const N = 4;
  const deposits = [500, -200, 300, -100, 400, 250];
  const bal = deposits.reduce((acc, d) => [...acc, (acc.length ? acc[acc.length - 1] : 1000) + d], []);
  return (
    <div>
      <Frame>
        Two jobs that look alike: both produce a list of answers using additions. Click an answer to see exactly what it needs before it can be
        computed.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Btn ghost={task !== "matmul"} onClick={() => setTask("matmul")}>🧮 Matrix multiply C = A × B</Btn>
        <Btn ghost={task !== "bank"} onClick={() => setTask("bank")} color={C.orange}>🏦 Running bank balance</Btn>
      </div>
      {task === "matmul" ? (
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          {["A", "B", "C"].map((m) => (
            <div key={m}>
              <div style={{ color: C.muted, fontSize: 11, textAlign: "center" }}>{m}</div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${N}, 28px)`, gap: 3 }}>
                {Array.from({ length: N * N }, (_, k) => {
                  const r = Math.floor(k / N), c = k % N;
                  const on = m === "A" ? r === cell[0] : m === "B" ? c === cell[1] : r === cell[0] && c === cell[1];
                  return <div key={k} onClick={() => m === "C" && setCell([r, c])} style={{ width: 28, height: 28, borderRadius: 4, cursor: m === "C" ? "pointer" : "default", background: on ? (m === "C" ? C.green : C.accent) + "55" : C.card, border: `1.5px solid ${on ? (m === "C" ? C.green : C.accent) : C.border}` }} />;
                })}
              </div>
            </div>
          ))}
          <div style={{ flex: 1, minWidth: 200, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
            C[{cell[0]}][{cell[1]}] needs <b style={{ color: C.accent }}>row {cell[0]} of A</b> and <b style={{ color: C.accent }}>column {cell[1]} of B</b>,
            and <b style={{ color: C.green }}>no other cell of C</b>. Click other C cells: none of them ever waits for another.
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 8px", fontFamily: "monospace", fontSize: 12, color: C.muted }}>start ₹1000</div>
            {bal.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: i <= day ? C.orange : C.border }}>→</span>
                <div onClick={() => setDay(i)} style={{ cursor: "pointer", background: i <= day ? C.orange + "33" : C.card, border: `1.5px solid ${i === day ? C.orange : C.border}`, borderRadius: 6, padding: "6px 8px", fontFamily: "monospace", fontSize: 12, color: C.text }}>
                  day {i + 1}<br />₹{b}
                </div>
              </div>
            ))}
          </div>
          <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginTop: 10 }}>
            Day {day + 1}'s balance needs day {day}'s balance{day > 0 ? `, which needs day ${day - 1}'s` : ""}… all the way back to the start. A <b style={{ color: C.orange }}>chain</b>:
            nobody can work on day {day + 1} until every earlier day is done.
          </div>
        </div>
      )}
      <Insight title="Independent outputs can all be computed at the same time. A chain can't.">
        Matrix multiplication, the core of AI (Unit 0.5), is the perfectly independent kind. That's the gift hidden inside AI's huge appetite.
      </Insight>
    </div>
  );
}

// ── Section 3: Hire more workers ──
const WCOL = [C.accent, C.green, C.orange, C.purple, C.teal, C.yellow, C.red, "#F778BA"];
function WorkersWidget() {
  const [w, setW] = useState(4);
  const [job, setJob] = useState("grid");
  const [t, setT] = useState(0);
  const timer = useRef(null);
  const JOBS = 64;
  const steps = job === "grid" ? Math.ceil(JOBS / w) : JOBS;
  useEffect(() => () => clearInterval(timer.current), []);
  const run = () => { clearInterval(timer.current); setT(0); timer.current = setInterval(() => setT((v) => { if (v >= steps) { clearInterval(timer.current); return v; } return v + 1; }), 120); };
  const doneAt = (k) => (job === "grid" ? Math.floor(k / w) + 1 : k + 1);
  return (
    <div>
      <Frame>
        64 pieces of work, and you can hire workers. For the <b style={{ color: C.green }}>grid</b> (independent cells), each worker grabs a cell.
        For the <b style={{ color: C.orange }}>chain</b>, step k must wait for step k − 1. Hire workers and press Run.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <Btn ghost={job !== "grid"} onClick={() => { setJob("grid"); setT(0); }} color={C.green}>Independent grid</Btn>
        <Btn ghost={job !== "chain"} onClick={() => { setJob("chain"); setT(0); }} color={C.orange}>Chain</Btn>
      </div>
      <Slider label={<>Workers = <b style={{ color: C.accent }}>{w}</b></>} value={w} min={1} max={64} onChange={(v) => { setW(v); setT(0); }} />
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 24px)", gap: 3 }}>
          {Array.from({ length: JOBS }, (_, k) => {
            const done = doneAt(k) <= t;
            const owner = job === "grid" ? k % w : 0;
            return <div key={k} style={{ width: 24, height: 24, borderRadius: 4, background: done ? WCOL[owner % 8] : C.card, border: `1px solid ${C.border}`, opacity: done ? 0.9 : 1 }} />;
          })}
        </div>
        <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 8 }}>
          <Btn onClick={run}>▶ Run</Btn>
          <Stat label="TIME STEPS NEEDED" value={steps} color={job === "grid" ? C.green : C.orange} />
          <Stat label="SPEED-UP vs 1 WORKER" value={`${(JOBS / steps).toFixed(1)}×`} color={C.purple} />
          <div style={{ color: C.muted, fontSize: 12 }}>{job === "chain" && w > 1 ? `${w - 1} workers stand idle: they have nothing they're allowed to do.` : job === "grid" ? "Colours show which worker did each cell." : ""}</div>
        </div>
      </div>
      <Insight color={C.green} title="For independent work, N workers ≈ N times faster. For a chain, extra workers do nothing.">
        Remember this picture: Module 2 builds a chip from thousands of workers. That only pays off because AI's work is the grid kind.
      </Insight>
    </div>
  );
}

// ── Section 4: Spot the parallelism in AI ──
const OPS = [
  { o: "Apply ReLU to every number in a layer's output", p: true, why: "Each number is changed on its own. Fully parallel." },
  { o: "Run 64 images of a batch through layer 1", p: true, why: "The images don't affect each other inside a layer. Parallel." },
  { o: "Compute layer 2 before layer 1 has finished", p: false, why: "Layer 2's input IS layer 1's output. Layers form a chain, but each layer inside is parallel." },
  { o: "Multiply two big matrices", p: true, why: "Every output cell is an independent dot product." },
  { o: "Start epoch 2 before epoch 1's weight updates are done", p: false, why: "Epoch 2 needs the weights produced by epoch 1. A chain." },
  { o: "A chatbot generating word 5 before word 4", p: false, why: "Each new word depends on the words before it. Generation is a chain, which is why answers appear word by word." },
  { o: "Add the bias to all 128 neurons of a layer", p: true, why: "128 separate additions with nothing shared. Parallel." },
  { o: "Compare 10 lakh predictions with the right answers", p: true, why: "Each comparison is separate. (Adding up the results afterwards can also be done in parallel, in a tree of pairs.)" },
];
function SpotWidget() {
  const [ans, setAns] = useState({});
  const right = OPS.filter((x, i) => ans[i] === x.p).length;
  return (
    <div>
      <Frame>Can each piece of work run at the same time as the others (parallel), or must it wait in line (chain)? Decide for each AI operation.</Frame>
      {OPS.map((x, i) => {
        const a = ans[i];
        return (
          <div key={i} style={{ background: C.card, border: `1px solid ${a === undefined ? C.border : a === x.p ? C.green : C.red}`, borderRadius: 8, padding: "9px 12px", marginBottom: 7 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220, color: C.text, fontSize: 13 }}>{x.o}</div>
              {[[true, "⚡ Parallel", C.green], [false, "⛓️ Chain", C.orange]].map(([v, l, c]) => (
                <button key={l} onClick={() => a === undefined && setAns((s) => ({ ...s, [i]: v }))} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${c}`, background: a === v ? c + "33" : "transparent", color: C.text, fontSize: 12, cursor: a === undefined ? "pointer" : "default" }}>{l}</button>
              ))}
            </div>
            {a !== undefined && <div style={{ marginTop: 5, fontSize: 12, color: a === x.p ? C.green : C.red }}>{a === x.p ? "✓ " : "✗ "}{x.why}</div>}
          </div>
        );
      })}
      {Object.keys(ans).length === OPS.length && (
        <Insight color={C.purple} title={`${right} / ${OPS.length}. Inside every step AI is massively parallel; between steps it's a chain.`}>
          So the winning machine does each step with thousands of workers at once and runs the steps in order. That's exactly a GPU working
          alongside a CPU.
        </Insight>
      )}
      <LabCard part="C" title="Loops vs vectorised code"
        what="Apply ReLU to 10 lakh numbers with a Python for-loop, then with one NumPy call; do the same for a running total. See which job speeds up and which doesn't."
        expect="NumPy's ReLU is far faster than the loop. np.cumsum is fast too (it's compiled code), but it still has to walk the chain one value after another, so it can't be shared out among many workers." />
    </div>
  );
}

const QUESTIONS = [
  { q: "To compute cell C[2][3] of C = A × B, you need…", options: ["All of C computed first", "Row 2 of A and column 3 of B", "Column 2 of A and row 3 of B", "C[2][2]"], answer: 1, explain: "Each output cell is the dot product of one row of A with one column of B. No other output cell is needed." },
  { q: "64 independent tasks, 16 workers, each task takes 1 time step. How many steps?", options: ["1", "4", "16", "64"], answer: 1, explain: "Each step, 16 tasks finish: 64 ÷ 16 = 4 steps." },
  { q: "A 64-step chain (each step needs the previous one) with 16 workers takes…", options: ["4 steps", "16 steps", "64 steps", "1 step"], answer: 2, explain: "Only one step can ever run at a time, so the extra workers stay idle: still 64 steps." },
  { q: "Which part of a neural network is a CHAIN?", options: ["The neurons within one layer", "The images within one batch", "The layers, one after another", "The cells of a matrix multiply"], answer: 2, explain: "Layer 2 needs layer 1's output. Inside each layer, though, everything is parallel." },
];
const RESULT = {
  perfect: "Perfect! You can see the parallelism hidden in AI.",
  good: "Good. Replay 'Hire More Workers' with the chain.",
  low: "Revisit 'Who Waits for Whom?': independent vs chained is the key idea for the next module.",
  done: "Unit 1.3 Complete!",
  body: "You can tell independent work from chained work, and you know that matrix multiplication is perfectly parallel.",
  next: "Next up: Unit 1.C — Capstone: The Compute Bill.",
  teaser: "Estimate what it really takes to train and run an AI model for your college, and measure your own CPU's speed.",
};

const UNIT_WORDS = [
  ["MAC", "Multiply-Accumulate", "One multiply plus one add.", "from Unit 0.3"],
  ["n³", "n cubed", "n × n × n. The number of MACs in an n × n matrix multiply.", "new here"],
  ["ReLU", "Rectified Linear Unit", "Negative → 0, positive stays. Applied to every number on its own.", "from Unit 0.3"],
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

export default function Unit1_3({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "One After Another" },
    { id: "s1", label: "Who Waits for Whom?" },
    { id: "s2", label: "Hire More Workers" },
    { id: "s3", label: "Spot the Parallelism" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🐢 One After Another — n³ steps for one worker</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔗 Who Waits for Whom? — independent vs chained</h3><DependWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>👷 Hire More Workers — when does it help?</h3><WorkersWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔍 Spot the Parallelism — inside AI</h3><SpotWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 1.3.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🧩</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 1 › UNIT 1.3</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Every Output Is Independent</div>
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
