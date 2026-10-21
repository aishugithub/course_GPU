import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab0_AI_Basics.ipynb";

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
      <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>🧪 TRY IT FOR REAL — LAB 0 · PART {part}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{what}</div>
      <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}><b style={{ color: C.green }}>You should see:</b> {expect}</div>
      <a href={LAB_URL} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", borderRadius: 8, background: C.orange, color: "#0D1117", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Open Lab 0 in Colab ↗</a>
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

const TEXTBOOK = "D2L §3.1–3.4 (Loss and minibatch stochastic gradient descent)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// Predict marks from study hours: marks = w × hours + 20  (bias fixed at 20 so there is ONE knob)
const DATA = [[1, 30], [2, 45], [3, 55], [4, 70], [5, 80]];
const lossAt = (w) => DATA.reduce((s, [h, m]) => s + (m - (w * h + 20)) ** 2, 0) / DATA.length;
const gradAt = (w) => 22 * w - 266; // d(loss)/dw for this data, worked out once
const BEST_W = 266 / 22;

// ── Section 1: Need — too many knobs to try them all ──
function NeedWidget() {
  const [k, setK] = useState(3);
  const tries = Math.pow(10, k);
  const secs = tries / 1e9;
  const human = secs < 1 ? "less than a second" : secs < 3600 ? `${secs.toFixed(0)} seconds` : secs < 86400 * 365 ? `${(secs / 86400).toFixed(0)} days` : `${(secs / (86400 * 365)).toExponential(1)} years`;
  return (
    <div>
      <Frame>
        In Unit 0.3 you tuned 3 knobs by hand. Could a computer just try every setting? Suppose each knob has only 10 possible positions,
        and the computer tests 100 crore (10⁹) settings every second. Drag the number of knobs.
      </Frame>
      <Slider label={<>Number of knobs (weights) = <b style={{ color: C.orange }}>{k}</b></>} value={k} min={1} max={60} onChange={setK} color={C.orange} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="SETTINGS TO TRY" value={`10^${k}`} color={C.orange} />
        <Stat label="TIME AT 10⁹ PER SECOND" value={human} color={k > 18 ? C.red : C.green} />
      </div>
      <div style={{ color: C.muted, fontSize: 12.5, marginTop: 10 }}>For comparison, the universe is about 1.4 × 10¹⁰ years old, and a small image model has around 10 lakh knobs.</div>
      {k >= 20 && (
        <Insight color={C.red} title="Trying every setting is hopeless beyond a handful of knobs.">
          We need a way to know which direction to turn each knob, so that every adjustment makes the model a little less wrong.
          That needs two things: a number that measures how wrong the model is, and a way to see which way is downhill.
        </Insight>
      )}
    </div>
  );
}

// ── Section 2: Loss = how wrong, as one number ──
function LossWidget() {
  const [w, setW] = useState(6);
  const X = (h) => 40 + h * 85, Y = (m) => 200 - m * 1.8;
  const L = lossAt(w);
  const LX = (v) => 20 + v * 9, LY = (v) => 170 - Math.min(v, 900) * 0.17;
  return (
    <div>
      <Frame>
        Our model predicts exam marks: <code style={{ color: C.accent }}>marks = w × hours + 20</code>. The dots are 5 real students.
        Each red bar is one prediction's error. The <b style={{ color: C.yellow }}>loss</b> squares every error and averages them, giving one
        number for "how wrong". Find the w that makes the loss smallest.
      </Frame>
      <Slider label={<>w = <b style={{ color: C.accent }}>{w}</b></>} value={w} min={0} max={25} step={0.5} onChange={setW} />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <svg viewBox="0 0 500 215" style={{ flex: 2, minWidth: 280, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
          <line x1="40" y1="200" x2="490" y2="200" stroke={C.border} /><line x1="40" y1="10" x2="40" y2="200" stroke={C.border} />
          {[1, 2, 3, 4, 5].map((h) => <text key={h} x={X(h)} y="212" fill={C.muted} fontSize="10" textAnchor="middle">{h} h</text>)}
          <text x="6" y="20" fill={C.muted} fontSize="10">marks</text>
          <line x1={X(0)} y1={Y(20)} x2={X(5.3)} y2={Y(w * 5.3 + 20)} stroke={C.accent} strokeWidth="2.5" />
          {DATA.map(([h, m]) => (
            <g key={h}>
              <line x1={X(h)} y1={Y(m)} x2={X(h)} y2={Y(w * h + 20)} stroke={C.red} strokeWidth="2" />
              <circle cx={X(h)} cy={Y(m)} r="6" fill={C.green} />
            </g>
          ))}
        </svg>
        <svg viewBox="0 0 250 185" style={{ flex: 1, minWidth: 180, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
          <text x="10" y="16" fill={C.yellow} fontSize="11">loss for every w</text>
          <polyline fill="none" stroke={C.yellow} strokeWidth="2" points={Array.from({ length: 51 }, (_, i) => i * 0.5).map((v) => `${LX(v)},${LY(lossAt(v))}`).join(" ")} />
          <circle cx={LX(w)} cy={LY(L)} r="6" fill={C.accent} />
          <text x="20" y="182" fill={C.muted} fontSize="10">w = 0</text><text x="200" y="182" fill={C.muted} fontSize="10">w = 25</text>
        </svg>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="LOSS (MEAN SQUARED ERROR)" value={L.toFixed(1)} color={L < 5 ? C.green : C.yellow} />
        <Stat label="BEST POSSIBLE" value={`${lossAt(BEST_W).toFixed(1)} at w ≈ ${BEST_W.toFixed(2)}`} color={C.purple} />
      </div>
      <Insight color={C.yellow} title="Loss turns 'how wrong is my model?' into a single number to push down.">
        Plotted against w, the loss makes a valley. Training means finding the bottom of that valley. Why square the errors?
        So that being 10 too high and 10 too low both count as wrong, and big misses count extra.
      </Insight>
    </div>
  );
}

// ── Section 3: Gradient descent ──
function DescentWidget() {
  const [lr, setLr] = useState(0.02);
  const [path, setPath] = useState([0]);
  const w = path[path.length - 1];
  const step = () => setPath((p) => [...p, p[p.length - 1] - lr * gradAt(p[p.length - 1])]);
  const LX = (v) => 30 + (Math.max(-8, Math.min(32, v)) + 8) * 12.5, LY = (v) => 200 - Math.min(v, 1200) * 0.15;
  const blown = Math.abs(w) > 40;
  return (
    <div>
      <Frame>
        Stand on the loss valley in thick fog: you can't see the bottom, but you can feel which way the ground slopes. The slope is
        called the <b style={{ color: C.accent }}>gradient</b>. Each step: <code style={{ color: C.text }}>w ← w − learning_rate × gradient</code>.
        Set a learning rate, press Step, and watch the ball.
      </Frame>
      <Slider label={<>learning rate = <b style={{ color: C.orange }}>{lr}</b> {lr <= 0.01 ? "(tiny steps)" : lr <= 0.05 ? "(sensible)" : lr < 0.09 ? "(big steps, zig-zag)" : "(too big!)"}</>} value={lr} min={0.005} max={0.1} step={0.005} onChange={(v) => { setLr(v); setPath([0]); }} color={C.orange} />
      <svg viewBox="0 0 530 215" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <polyline fill="none" stroke={C.yellow} strokeWidth="2" points={Array.from({ length: 81 }, (_, i) => -8 + i * 0.5).map((v) => `${LX(v)},${LY(lossAt(v))}`).join(" ")} />
        {path.slice(1).map((v, i) => <line key={i} x1={LX(path[i])} y1={LY(lossAt(path[i]))} x2={LX(v)} y2={LY(lossAt(v))} stroke={C.accent} strokeWidth="1.5" strokeDasharray="4 3" />)}
        {path.map((v, i) => <circle key={i} cx={LX(v)} cy={LY(lossAt(v))} r={i === path.length - 1 ? 8 : 3} fill={i === path.length - 1 ? C.accent : C.accent + "88"} />)}
        <line x1={LX(BEST_W)} y1="200" x2={LX(BEST_W)} y2="190" stroke={C.green} strokeWidth="3" /><text x={LX(BEST_W)} y="212" fill={C.green} fontSize="10" textAnchor="middle">bottom</text>
      </svg>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Btn onClick={step} disabled={blown}>Step ▶ ({path.length - 1})</Btn>
        <Btn ghost onClick={() => setPath([0])}>↺ Reset</Btn>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="w NOW" value={blown ? "💥 blew up" : w.toFixed(3)} color={blown ? C.red : C.accent} />
        <Stat label="GRADIENT (SLOPE)" value={blown ? "—" : gradAt(w).toFixed(2)} color={C.orange} />
        <Stat label="LOSS" value={blown ? "∞" : lossAt(w).toFixed(2)} color={C.yellow} />
      </div>
      <Insight color={C.orange} title="The learning rate is the size of each step, and it's a balancing act.">
        Too small and training crawls. Too big and you overshoot the bottom, zig-zag, or fly off completely (try 0.1). Picking it
        well is one of the everyday jobs of an AI engineer.
      </Insight>
    </div>
  );
}

// ── Section 4: The training loop, traced ──
const TRACE = (() => {
  const rows = []; let w = 0;
  for (let e = 0; e < 8; e++) { const g = gradAt(w); rows.push({ e, w, loss: lossAt(w), g }); w = w - 0.02 * g; }
  return rows;
})();
const LOOP = ["w = 0.0", "lr = 0.02", "for epoch in range(8):", "    pred = w * hours + 20", "    loss = mean((marks - pred) ** 2)", "    grad = slope of loss at w", "    w = w - lr * grad"];
function LoopWidget() {
  const [i, setI] = useState(0);
  const r = TRACE[i];
  return (
    <div>
      <Frame>
        Put it all together and you get the training loop, the same four steps every AI model repeats millions of times. Step through
        8 rounds (each full pass over the data is called an <b style={{ color: C.text }}>epoch</b>).
      </Frame>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 12 }}>
        <pre style={{ margin: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, fontFamily: "monospace", fontSize: 12, lineHeight: 1.8, color: C.text }}>
          {LOOP.map((l, k) => <div key={k} style={{ background: k >= 3 ? C.accent + "14" : "transparent", borderLeft: `3px solid ${k >= 3 ? C.accent : "transparent"}`, paddingLeft: 6 }}>{l}</div>)}
        </pre>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Stat label="EPOCH" value={r.e} color={C.purple} />
          <Stat label="w" value={r.w.toFixed(3)} color={C.teal} />
          <Stat label="LOSS" value={r.loss.toFixed(2)} color={C.yellow} />
          <Stat label="GRADIENT" value={r.g.toFixed(2)} color={C.orange} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Btn onClick={() => setI((v) => Math.min(TRACE.length - 1, v + 1))}>Next epoch ▶ ({i + 1} / {TRACE.length})</Btn>
        <Btn ghost onClick={() => setI(0)}>↺ Reset</Btn>
      </div>
      <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8 }}>{i === 0 ? "w starts at 0: a terrible model with a huge loss and a steep slope." : i < 4 ? "Big slope → big correction. The loss drops fast." : "Near the bottom the slope flattens, so the steps shrink by themselves."}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
        <Code color={C.orange} title="✍️ BY HAND (1 knob)">{`grad = 22*w - 266   # worked out
w = w - lr * grad`}</Code>
        <Code color={C.accent} title="🔥 PYTORCH (any number of knobs)">{`loss.backward()   # all gradients
optimizer.step()  # update every w`}</Code>
      </div>
      <Insight color={C.purple} title="Predict → measure loss → find gradients → nudge the weights. Repeat.">
        Real networks run exactly this loop, but with billions of weights. PyTorch's <code>loss.backward()</code> (called
        <b> backpropagation</b>) finds every gradient automatically. It's the same multiply-add arithmetic again, only far more of it.
      </Insight>
      <LabCard part="D" title="Gradient descent from scratch"
        what="Code the loop above in plain Python for the 5 students, print w and the loss every epoch, then try learning rates 0.005, 0.02, 0.08 and 0.1."
        expect="w settles near 12.09 with lr = 0.02; it crawls at 0.005, zig-zags at 0.08, and blows up at 0.1." />
    </div>
  );
}

const QUESTIONS = [
  { q: "A model predicts 50 and 70; the true answers are 40 and 70. What is the mean squared error?", options: ["5", "10", "50", "100"], answer: 2, explain: "Errors are 10 and 0. Squared: 100 and 0. Mean = (100 + 0) / 2 = 50." },
  { q: "The gradient at the current w is +8. Which way should gradient descent move w?", options: ["Increase w", "Decrease w", "Leave it, since 8 is fine", "Set w to 8"], answer: 1, explain: "w ← w − lr × gradient. A positive slope means the loss rises as w grows, so move w down." },
  { q: "During training, the loss jumps up and down and gets bigger every epoch. What is the most likely cause?", options: ["Learning rate too small", "Learning rate too big", "Too few students in the data", "The activation function"], answer: 1, explain: "A step that's too large overshoots the valley floor each time and climbs higher on the other side. You saw this at lr = 0.1." },
  { q: "What does PyTorch's loss.backward() do?", options: ["Undoes the last step", "Computes the gradient for every weight", "Prints the loss", "Moves the data to the GPU"], answer: 1, explain: "backward() runs backpropagation, which finds the slope of the loss with respect to every weight. The optimizer then uses those slopes to nudge the weights." },
];
const RESULT = {
  perfect: "Perfect! You understand how a machine learns.",
  good: "Good. Replay 'Roll Downhill' with different learning rates.",
  low: "Revisit 'Loss' and 'Roll Downhill': measuring wrongness and then stepping downhill is the core idea.",
  done: "Unit 0.4 Complete!",
  body: "You can explain loss, gradients, the learning rate and the training loop: the engine of all of AI.",
  next: "Next up: Unit 0.5 — Layers = Matrix Multiplication.",
  teaser: "One neuron draws one straight line. Stack them in layers, and the arithmetic turns into one big matrix multiply.",
};

const UNIT_WORDS = [
  ["MSE", "Mean Squared Error", "Square each error, then average. The most common loss for predicting numbers.", "new here"],
  ["lr", "learning rate", "How big a step gradient descent takes each time.", "new here"],
  ["MAC", "Multiply-Accumulate", "Multiply, then add to a running total.", "from Unit 0.3"],
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

export default function Unit0_4({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "Too Many Knobs" },
    { id: "s1", label: "Loss" },
    { id: "s2", label: "Roll Downhill" },
    { id: "s3", label: "The Training Loop" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🎛️ Too Many Knobs — why not just try everything?</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📏 Loss — one number for 'how wrong'</h3><LossWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>⛰️ Gradient Descent — feel the slope, take a step</h3><DescentWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔁 The Training Loop — the four steps of learning</h3><LoopWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 0.4.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⛰️</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 0 › UNIT 0.4</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Learning = Reducing Error</div>
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
