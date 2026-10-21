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

const TEXTBOOK = "D2L Ch 4 (Classification) and Ch 5 (Multilayer perceptrons)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// [hours, attendance %, passed]
const CLASS = [
  [0.5, 40, 0], [1.0, 65, 0], [1.5, 85, 0], [2.0, 95, 0], [2.5, 60, 0], [3.0, 45, 0], [3.0, 80, 1],
  [3.5, 70, 1], [4.0, 50, 1], [4.5, 35, 0], [5.0, 40, 1], [5.5, 75, 1], [6.0, 55, 1], [2.5, 92, 1],
  [1.0, 98, 0], [4.0, 90, 1], [2.0, 55, 0], [5.0, 25, 0], [3.5, 40, 0], [1.5, 50, 0],
];
const sig = (z) => 1 / (1 + Math.exp(-z));
function epochStep({ w1, w2, b }, lr) {
  let g1 = 0, g2 = 0, gb = 0, loss = 0, right = 0;
  for (const [h, a, y] of CLASS) {
    const x1 = h / 6, x2 = a / 100, p = sig(w1 * x1 + w2 * x2 + b);
    g1 += (p - y) * x1; g2 += (p - y) * x2; gb += p - y;
    loss += -(y * Math.log(p + 1e-9) + (1 - y) * Math.log(1 - p + 1e-9));
    if ((p >= 0.5 ? 1 : 0) === y) right++;
  }
  const n = CLASS.length;
  return { next: { w1: w1 - lr * g1 / n, w2: w2 - lr * g2 / n, b: b - lr * gb / n }, loss: loss / n, right };
}

// ── Section 1: The Mission ──
const TOOLS = [
  ["Students become numbers: hours / 6 and attendance / 100", "Unit 1.2"],
  ["A neuron with 2 weights + a bias, sigmoid activation", "Unit 1.3"],
  ["A loss that measures how wrong the predictions are", "Unit 1.4"],
  ["Gradient descent to nudge the weights, epoch after epoch", "Unit 1.4"],
  ["All 20 students at once: X @ w, a matrix multiply", "Unit 1.5"],
];
function MissionWidget() {
  const [ticks, setTicks] = useState([]);
  return (
    <div>
      <Frame>
        Your college wants an early-warning system: from a student's <b style={{ color: C.text }}>daily study hours</b> and
        <b style={{ color: C.text }}> attendance</b>, predict PASS or FAIL so that teachers can help in time. You have last year's records for
        20 students. Nobody gives you the rule; your model must learn it. Tick each tool once you've found where you learned it.
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
      <Insight color={C.green} title="Every piece is something you already know.">
        This capstone just connects them: numbers in → neuron → loss → gradient descent → a trained model. That chain is the whole of
        machine learning, at its smallest.
      </Insight>
    </div>
  );
}

// ── Section 2: Build in Steps ──
const VERSIONS = [
  { tag: "v1", title: "Forward pass only", color: C.teal, why: "First make the model produce SOME prediction. With all weights at 0, the sigmoid says 0.5 (\"no idea\") for everyone. That's a model, just an untrained one.", code: `import numpy as np
hours  = np.array([0.5, 1.0, 1.5, ...])   # 20 students
att    = np.array([40, 65, 85, ...])
passed = np.array([0, 0, 0, ...])

X = np.column_stack([hours / 6, att / 100])   # Unit 1.2: scale to 0..1
w = np.zeros(2); b = 0.0

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

p = sigmoid(X @ w + b)     # Units 1.3 + 1.5: 20 neurons-worth at once
print(p)                   # all 0.5 — the model knows nothing yet` },
  { tag: "v2", title: "+ measure the loss", color: C.yellow, why: "Before improving, we need a score for 'how wrong'. For YES/NO answers we use cross-entropy loss: it punishes a confident wrong answer very hard. At p = 0.5 for everyone, the loss is about 0.69.", code: `# ...v1 code...
loss = -np.mean(passed * np.log(p) + (1 - passed) * np.log(1 - p))
print(loss)                # 0.693 — the 'knows nothing' loss` },
  { tag: "v3", title: "+ the training loop", color: C.green, why: "Now the loop from Unit 1.4. For a sigmoid neuron with cross-entropy, the gradient works out to a neat formula: (prediction − answer) × input. Repeat 500 times and the weights find the rule.", code: `lr = 2.0
for epoch in range(500):
    p = sigmoid(X @ w + b)                      # 1. predict
    loss = -np.mean(passed*np.log(p) + (1-passed)*np.log(1-p))  # 2. loss
    grad_w = X.T @ (p - passed) / len(passed)   # 3. gradients
    grad_b = np.mean(p - passed)
    w -= lr * grad_w                            # 4. nudge
    b -= lr * grad_b
    if epoch % 100 == 0:
        print(epoch, round(loss, 3))

accuracy = np.mean((p >= 0.5) == passed)
print("accuracy:", accuracy)` },
];
function BuildWidget() {
  const [v, setV] = useState(0);
  const cur = VERSIONS[v];
  return (
    <div>
      <Frame>Real programmers grow a program one idea at a time. Click through the three versions; each adds ONE idea.</Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {VERSIONS.map((x, i) => <Btn key={x.tag} ghost={i !== v} onClick={() => setV(i)} color={x.color}>{x.tag}: {x.title}</Btn>)}
      </div>
      <div style={{ padding: "10px 14px", borderRadius: 8, background: cur.color + "14", border: `1px solid ${cur.color}55`, color: C.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
        <b style={{ color: cur.color }}>{cur.tag}: </b>{cur.why}
      </div>
      <Code color={cur.color}>{cur.code}</Code>
      <Insight title="Predict, measure, correct: three versions, three ideas.">
        Version 3 is a complete machine-learning program. It's under 20 lines, because the hard part is ideas, not code.
      </Insight>
    </div>
  );
}

// ── Section 3: Play It — train live ──
function PlayWidget() {
  const [m, setM] = useState({ w1: 0, w2: 0, b: 0 });
  const [hist, setHist] = useState([]);
  const [lr, setLr] = useState(2);
  const stat = epochStep(m, lr);
  const train = (k) => {
    let cur = m; const h = [];
    for (let i = 0; i < k; i++) { const r = epochStep(cur, lr); h.push(r.loss); cur = r.next; }
    setM(cur); setHist((p) => [...p, ...h].slice(-600));
  };
  const reset = () => { setM({ w1: 0, w2: 0, b: 0 }); setHist([]); };
  const PX = (h) => 30 + (h / 6.5) * 300, PY = (a) => 200 - ((a - 20) / 85) * 185;
  // decision boundary: w1*h/6 + w2*a/100 + b = 0 → a = -(w1*h/6 + b) * 100 / w2
  let line = null;
  if (Math.abs(m.w2) > 1e-6) {
    const aAt = (h) => -(m.w1 * h / 6 + m.b) * 100 / m.w2;
    line = [PX(0), PY(aAt(0)), PX(6.5), PY(aAt(6.5))];
  }
  const maxL = Math.max(0.7, ...hist);
  return (
    <div>
      <Frame>
        Press Train and watch gradient descent work. The blue line is where the model switches from FAIL to PASS. Each press runs epochs
        on all 20 students. Try a tiny learning rate, then a huge one.
      </Frame>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <svg viewBox="0 0 340 215" style={{ flex: 1.4, minWidth: 260, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
          <defs><clipPath id="plot"><rect x="30" y="10" width="300" height="190" /></clipPath></defs>
          <line x1="30" y1="200" x2="335" y2="200" stroke={C.border} /><line x1="30" y1="10" x2="30" y2="200" stroke={C.border} />
          <text x="300" y="212" fill={C.muted} fontSize="9">hours →</text><text x="2" y="14" fill={C.muted} fontSize="9">att%</text>
          {line && <line x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} stroke={C.accent} strokeWidth="2.5" clipPath="url(#plot)" />}
          {CLASS.map(([h, a, y], i) => {
            const p = sig(m.w1 * h / 6 + m.w2 * a / 100 + m.b), ok = (p >= 0.5 ? 1 : 0) === y;
            return <g key={i}><circle cx={PX(h)} cy={PY(a)} r="6" fill={y ? C.green : C.red} />{!ok && <circle cx={PX(h)} cy={PY(a)} r="9.5" fill="none" stroke={C.yellow} strokeWidth="1.5" />}</g>;
          })}
        </svg>
        <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 8 }}>
          <Stat label="EPOCHS RUN" value={hist.length} color={C.purple} />
          <Stat label="LOSS" value={stat.loss.toFixed(3)} color={C.yellow} />
          <Stat label="ACCURACY" value={`${stat.right} / 20`} color={stat.right >= 19 ? C.green : C.orange} />
          <div style={{ fontFamily: "monospace", fontSize: 11.5, color: C.muted }}>w₁={m.w1.toFixed(2)} w₂={m.w2.toFixed(2)} b={m.b.toFixed(2)}</div>
        </div>
      </div>
      <svg viewBox="0 0 340 60" style={{ width: "100%", marginTop: 8, background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
        <text x="6" y="12" fill={C.yellow} fontSize="9">loss over epochs</text>
        {hist.length > 1 && <polyline fill="none" stroke={C.yellow} strokeWidth="1.5" points={hist.map((l, i) => `${10 + (i / Math.max(1, hist.length - 1)) * 320},${55 - (Math.min(l, maxL) / maxL) * 40}`).join(" ")} />}
      </svg>
      <Slider label={<>learning rate = <b style={{ color: C.orange }}>{lr}</b></>} value={lr} min={0.1} max={30} step={0.1} onChange={setLr} color={C.orange} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Btn onClick={() => train(1)}>Train 1 epoch</Btn>
        <Btn onClick={() => train(50)} color={C.green}>Train 50 epochs</Btn>
        <Btn onClick={() => train(500)} color={C.purple}>Train 500</Btn>
        <Btn ghost onClick={reset}>↺ Reset</Btn>
      </div>
      <Insight color={C.green} title="You just watched a machine learn.">
        Nobody told it "hours + attendance". It found the boundary by itself, from data, by gradient descent. One student stays wrong
        however long you train: real data is messy (remember VIJAY and NISHA?). A good model is right most of the time, not always.
      </Insight>
    </div>
  );
}

// ── Section 4: Full code + the real lab ──
function CodeWidget() {
  return (
    <div>
      <Frame>
        Here is the complete program. It runs as-is in any Python with NumPy. In Lab 1 Part F you'll go one big step further: a real network
        recognising handwritten digits, trained with PyTorch, timed on the CPU.
      </Frame>
      <Code color={C.green} title="🧠 tiny_network.py — the whole capstone">{`import numpy as np

hours  = np.array([0.5,1.0,1.5,2.0,2.5,3.0,3.0,3.5,4.0,4.5,5.0,5.5,6.0,2.5,1.0,4.0,2.0,5.0,3.5,1.5])
att    = np.array([40, 65, 85, 95, 60, 45, 80, 70, 50, 35, 40, 75, 55, 92, 98, 90, 55, 25, 40, 50])
passed = np.array([0,  0,  0,  0,  0,  0,  1,  1,  1,  0,  1,  1,  1,  1,  0,  1,  0,  0,  0,  0])

X = np.column_stack([hours / 6, att / 100])
w, b, lr = np.zeros(2), 0.0, 2.0
sigmoid = lambda z: 1 / (1 + np.exp(-z))

for epoch in range(500):
    p = sigmoid(X @ w + b)
    loss = -np.mean(passed*np.log(p + 1e-9) + (1-passed)*np.log(1 - p + 1e-9))
    w -= lr * X.T @ (p - passed) / len(passed)
    b -= lr * np.mean(p - passed)
    if epoch % 100 == 0:
        print(f"epoch {epoch:3d}  loss {loss:.3f}")

print("weights:", w.round(2), "bias:", round(b, 2))
print("accuracy:", np.mean((p >= 0.5) == passed))
print("New student, 4 h & 85%:", "PASS" if sigmoid(np.array([4/6, 0.85]) @ w + b) >= 0.5 else "FAIL")`}</Code>
      <div style={{ marginTop: 12, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        <b style={{ color: C.text }}>Challenge upgrades:</b> (1) add a third feature, homework submitted (0/1); (2) print the loss every 10 epochs and
        plot it; (3) try lr = 0.1 and lr = 50 and explain what you see.
      </div>
      <LabCard part="F" title="Your first real AI: handwritten digits on the CPU"
        what="Load the 60,000-image MNIST dataset, build a 784 → 128 → 10 network in PyTorch, train it for 3 epochs on the CPU, and time each epoch. Write down the time: Module 2 asks where it all goes."
        expect="accuracy around 95–97%, and each epoch taking several seconds on Colab's CPU." />
      <Insight color={C.orange} title="Twenty students trained instantly. Sixty thousand images take seconds. A chatbot takes months.">
        It's the same multiply-add arithmetic at every scale. Module 2 counts exactly how much of it there is, and why an ordinary CPU starts to choke.
      </Insight>
    </div>
  );
}

const QUESTIONS = [
  { q: "Before any training (all weights 0), what does the sigmoid neuron predict for every student?", options: ["0", "1", "0.5", "It crashes"], answer: 2, explain: "z = 0 for everyone, and sigmoid(0) = 0.5: 'no idea'. Training moves the weights away from this." },
  { q: "Why divide hours by 6 and attendance by 100 before training?", options: ["To save memory", "To put both features on a similar 0–1 scale so that one doesn't dominate the steps", "Because PyTorch requires it", "To make the data private"], answer: 1, explain: "Unscaled, attendance (up to 100) would swamp hours (up to 6) and gradient descent would zig-zag. Scaling keeps the steps balanced." },
  { q: "Training stops improving at 19 / 20 correct. What's the best explanation?", options: ["The code has a bug", "One student doesn't follow the pattern; no straight line can fit everyone", "The learning rate must be 0", "It needs a GPU"], answer: 1, explain: "Real data is noisy. With one neuron the boundary is a straight line, and an 'unusual' student (only 4 hours and 50% attendance, yet passed) falls on the wrong side." },
  { q: "In the training loop, which line is the 'nudge' step?", options: ["p = sigmoid(X @ w + b)", "loss = -np.mean(...)", "w -= lr * grad_w", "print(epoch, loss)"], answer: 2, explain: "Predict → loss → gradient → nudge. w -= lr × gradient moves the weights a little downhill." },
];
const RESULT = {
  perfect: "Perfect! You can build and train a neural network from scratch.",
  good: "Good. Replay 'Play It' and try different learning rates.",
  low: "Revisit 'Build in Steps': predict, measure, correct is the whole story.",
  done: "Module 1 Complete! 🧠",
  body: "You know what AI really is: numbers in, multiply-adds, a loss, and gradient descent to learn the weights.",
  next: "Next up: Module 2 — Why Is AI So Hungry?",
  teaser: "Count the multiply-adds in a real model and discover why an ordinary CPU starts gasping for breath.",
};

const UNIT_WORDS = [
  ["BCE", "Binary Cross-Entropy", "The loss for YES/NO predictions. It punishes confident wrong answers hard.", "new here"],
  ["MNIST", "the handwritten-digit dataset", "60,000 training images of digits, 28 × 28 each.", "from Unit 1.2"],
  ["CPU", "Central Processing Unit", "The main processor of a computer, the one you studied in COA.", "from COA"],
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

export default function Unit1_C({ student, onUnitComplete }) {
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
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🎯 The Mission — an early-warning system for your college</h3><MissionWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🪜 Build in Steps — predict, measure, correct</h3><BuildWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>▶️ Play It — train the network live</h3><PlayWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📜 Full Code — and your first real AI</h3><CodeWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 1.C.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏆</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 1 › UNIT 1.C</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Capstone: Train a Tiny Network</div>
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
