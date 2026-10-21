import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab04_Inside_a_GPU.ipynb";

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

const TEXTBOOK = "Kirk & Hwu Ch 4 (Warps and SIMD hardware; control divergence) · H&P §4.4";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


const PATTERNS = {
  allPos: { name: "All positive", f: () => 1 },
  allNeg: { name: "All negative", f: () => 0 },
  half: { name: "First 16 / last 16", f: (i) => (i < 16 ? 1 : 0) },
  alt: { name: "Alternating", f: (i) => i % 2 },
  rand: { name: "Random", f: (i) => [1, 0, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1][i] },
};

// ── Section 1: Need — a marching band with an if-statement ──
function NeedWidget() {
  const [p, setP] = useState("alt");
  const lanes = Array.from({ length: 32 }, (_, i) => PATTERNS[p].f(i));
  const anyT = lanes.some((v) => v), anyF = lanes.some((v) => !v);
  const passes = (anyT ? 1 : 0) + (anyF ? 1 : 0);
  return (
    <div>
      <Frame>
        A warp is like a <b style={{ color: C.text }}>marching band of 32</b>: one drum major (the warp scheduler) calls one step, and everyone does it
        together. Now the kernel says <code style={{ color: C.accent }}>if (x[i] &gt; 0) path A else path B</code>. What if band members disagree? Choose
        what data the 32 threads see.
      </Frame>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {Object.entries(PATTERNS).map(([k, v]) => <Btn key={k} ghost={k !== p} onClick={() => setP(k)}>{v.name}</Btn>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(16, 1fr)", gap: 3 }}>
        {lanes.map((v, i) => <div key={i} style={{ height: 26, borderRadius: 4, background: v ? C.green : C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#0D1117", fontWeight: 700 }}>{v ? "A" : "B"}</div>)}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <Stat label="PATHS THE WARP MUST RUN" value={passes === 1 ? "1 (all agree)" : "2 (A, then B)"} color={passes === 1 ? C.green : C.red} />
        <Stat label="TIME vs NO BRANCH" value={`${passes}×`} color={passes === 1 ? C.green : C.red} />
      </div>
      <Insight color={C.red} title="When threads in one warp disagree, the warp runs BOTH paths, one after the other.">
        The band can't march two ways at once. So first the A-players march while the B-players stand still, then the reverse. This is called
        <b> branch divergence</b>. Notice that "First 16 / last 16" diverges too: what matters is disagreement inside a warp.
      </Insight>
    </div>
  );
}

// ── Section 2: Trace a diverging warp ──
const VALS = [3, -1, 4, -2, 5, -6, 2, -7];
const STEPS = [
  { t: "All 8 lanes (of the warp's 32) evaluate the condition x > 0 together.", active: () => true, phase: "cond" },
  { t: "Path A (y = x × 2): only lanes where x > 0 are switched on. The others are masked off and sit idle.", active: (v) => v > 0, phase: "A" },
  { t: "Path B (y = 0): now the other lanes run, and the A lanes sit idle.", active: (v) => v <= 0, phase: "B" },
  { t: "The paths re-join (reconverge). Every lane is active again for the next instruction.", active: () => true, phase: "join" },
];
function TraceWidget() {
  const [s, setS] = useState(0);
  const st = STEPS[s];
  const busy = VALS.filter((v) => st.active(v)).length;
  const y = VALS.map((v, i) => (s >= 1 && v > 0 ? v * 2 : s >= 2 && v <= 0 ? 0 : null));
  return (
    <div>
      <Frame>Step through one warp running the if/else. Grey lanes are <b style={{ color: C.text }}>masked off</b>: switched on but doing nothing.</Frame>
      <Code color={C.accent}>{`if (x[i] > 0)
    y[i] = x[i] * 2;     // path A
else
    y[i] = 0;            // path B`}</Code>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6, marginTop: 12 }}>
        {VALS.map((v, i) => {
          const on = st.active(v);
          const col = st.phase === "A" ? C.green : st.phase === "B" ? C.orange : C.accent;
          return (
            <div key={i} style={{ background: on ? col + "33" : C.card, border: `1.5px solid ${on ? col : C.border}`, borderRadius: 8, padding: 6, textAlign: "center", fontFamily: "monospace", fontSize: 11, opacity: on ? 1 : 0.45 }}>
              <div style={{ color: C.muted }}>lane {i}</div>
              <div style={{ color: C.text }}>x = {v}</div>
              <div style={{ color: y[i] === null ? C.border : C.teal }}>y = {y[i] === null ? "?" : y[i]}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, minHeight: 40, color: C.text, fontSize: 13, lineHeight: 1.6 }}>{st.t}</div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Btn onClick={() => setS((v) => Math.min(3, v + 1))}>Step ▶ ({s + 1} / 4)</Btn>
        <Btn ghost onClick={() => setS(0)}>↺ Reset</Btn>
        <Stat label="LANES DOING USEFUL WORK" value={`${busy} / 8`} color={busy === 8 ? C.green : C.yellow} />
      </div>
      <Insight color={C.yellow} title="During each branch, half the warp is idle. That's wasted hardware.">
        It still gives the right answer, because each lane only commits the result of its own path. It just takes longer.
      </Insight>
    </div>
  );
}

// ── Section 3: What does divergence cost? ──
function CostWidget() {
  const [a, setA] = useState(20);
  const [b, setB] = useState(20);
  const [layout, setLayout] = useState("warp");
  // 64 threads = 2 warps; half take A
  const warpPath = layout === "warp" ? [[true], [false]] : [[true, false], [true, false]];
  const time = warpPath.reduce((s, w) => s + (w.includes(true) ? a : 0) + (w.includes(false) ? b : 0), 0);
  const ideal = a + b;
  return (
    <div>
      <Frame>
        64 threads (2 warps). Half must take path A (costs <b style={{ color: C.green }}>a</b> cycles), half path B (costs <b style={{ color: C.orange }}>b</b> cycles).
        The question is HOW the halves are arranged: by warp, or mixed inside each warp? (The 2 warps take turns on one scheduler here.)
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <Btn ghost={layout !== "warp"} onClick={() => setLayout("warp")} color={C.green}>Warp 0 = all A, warp 1 = all B</Btn>
        <Btn ghost={layout !== "mixed"} onClick={() => setLayout("mixed")} color={C.red}>Mixed (even/odd threads)</Btn>
      </div>
      <Slider label={<>Path A cost a = <b style={{ color: C.green }}>{a}</b> cycles</>} value={a} min={1} max={100} onChange={setA} color={C.green} />
      <Slider label={<>Path B cost b = <b style={{ color: C.orange }}>{b}</b> cycles</>} value={b} min={1} max={100} onChange={setB} color={C.orange} />
      {warpPath.map((w, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 60, color: C.muted, fontSize: 12 }}>warp {i}</div>
          <div style={{ display: "flex", flex: 1, height: 22 }}>
            {w.includes(true) && <div style={{ width: `${(a / 200) * 100}%`, background: C.green, borderRadius: 3 }} />}
            {w.includes(false) && <div style={{ width: `${(b / 200) * 100}%`, background: C.orange, borderRadius: 3, marginLeft: 2 }} />}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
        <Stat label="TOTAL CYCLES" value={time} color={layout === "warp" ? C.green : C.red} />
        <Stat label="vs NO DIVERGENCE" value={`${(time / ideal).toFixed(1)}×`} color={layout === "warp" ? C.green : C.red} />
      </div>
      <Insight color={C.purple} title="Same threads, same work: arrange them so each warp agrees, and divergence disappears.">
        Branches aren't bad in themselves. Branches that split a warp are. And the more expensive the two paths, the more it hurts.
      </Insight>
    </div>
  );
}

// ── Section 4: Fixing divergence ──
function FixWidget() {
  const [fix, setFix] = useState("branchfree");
  const FIXES = {
    branchfree: { t: "Replace the branch with arithmetic", c: C.green, before: `if (x[i] > 0)
    y[i] = x[i];
else
    y[i] = 0;`, after: `y[i] = fmaxf(x[i], 0.0f);   // ReLU, no branch at all`, note: "Every lane runs the same single instruction. This is how ReLU is written inside PyTorch's GPU kernels." },
    select: { t: "Compute both, then pick", c: C.teal, before: `if (mask[i])
    y[i] = a[i] * 2;
else
    y[i] = b[i] + 1;`, after: `float pa = a[i] * 2;
float pb = b[i] + 1;
y[i] = mask[i] ? pa : pb;   // a 'select', not a jump`, note: "When both paths are cheap, doing both and selecting is faster than diverging. Compilers often do this automatically." },
    group: { t: "Group the data so warps agree", c: C.purple, before: `// pixels of two kinds mixed together:
// sky, road, sky, road, sky, road …`, after: `// sort first so a whole warp sees one kind:
// sky ×32, sky ×32, …, road ×32, road ×32`, note: "If similar items sit next to each other, each warp takes one path. This works when the paths are expensive and can't be removed." },
  };
  const f = FIXES[fix];
  return (
    <div>
      <Frame>Three standard ways to avoid divergence. Pick one to see a before/after.</Frame>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {Object.entries(FIXES).map(([k, v]) => <Btn key={k} ghost={k !== fix} onClick={() => setFix(k)} color={v.c}>{v.t}</Btn>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Code color={C.red} title="❌ DIVERGES">{f.before}</Code>
        <Code color={f.c} title="✅ WARP-FRIENDLY">{f.after}</Code>
      </div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginTop: 10 }}>{f.note}</div>
      <Insight title="Good news: PyTorch's built-in operations are already written this way.">
        You'll meet divergence when you write your own kernels (Module 5), and it's the reason AI's regular "same thing to every number"
        operations suit GPUs so well.
      </Insight>
      <LabCard part="B" title="Measure branch divergence for real"
        what="Run a tiny CUDA kernel (through CuPy) with an expensive if/else, first with the branch decided by (thread index ÷ 32), so warps agree, then by (thread index % 2), so every warp splits. Time both."
        expect="the even/odd version takes roughly twice as long, even though the total work is the same." />
    </div>
  );
}

const QUESTIONS = [
  { q: "In one warp, 31 threads take the if-path and 1 thread takes the else-path. What happens?", options: ["The 1 thread is skipped", "The warp runs both paths one after the other, idling lanes as needed", "The warp splits into two warps permanently", "It crashes"], answer: 1, explain: "Any disagreement inside a warp forces both paths to run in sequence, with inactive lanes masked off. Even one odd thread out costs a whole extra path." },
  { q: "Which condition causes NO divergence for 64 threads in 2 warps?", options: ["if (i % 2 == 0)", "if (i < 32)", "if (i % 3 == 0)", "if (x[i] > 0) with random data"], answer: 1, explain: "i < 32 is true for exactly warp 0 and false for exactly warp 1, so each warp agrees internally." },
  { q: "Why is ReLU written as fmaxf(x, 0) in GPU kernels instead of an if/else?", options: ["fmaxf is more accurate", "It avoids branching, so all 32 lanes run the same instruction", "if/else is not allowed in CUDA", "It uses less memory"], answer: 1, explain: "A branch-free instruction keeps the whole warp busy, with no divergence possible." },
  { q: "Divergence matters most when…", options: ["Both paths are tiny", "Both paths are expensive and threads in the same warp disagree", "All threads agree", "The GPU has many SMs"], answer: 1, explain: "The cost is running both paths in sequence, so it hurts when the paths are long and warps are mixed." },
];
const RESULT = {
  perfect: "Perfect! You think like a GPU programmer.",
  good: "Good. Replay 'The Cost' and switch between the two layouts.",
  low: "Revisit 'The Marching Band': lock-step is the key idea.",
  done: "Unit 4.2 Complete!",
  body: "You can explain warp lock-step execution, branch divergence and its cost, and three ways to avoid it.",
  next: "Next up: Unit 4.3 — Hiding Latency.",
  teaser: "GPU memory takes hundreds of cycles to answer. So why aren't the cores always waiting?",
};

const UNIT_WORDS = [
  ["warp", "a group of 32 threads", "They share one instruction stream and move in lock-step.", "from Unit 3.3"],
  ["mask", "active mask", "Which lanes of a warp are switched on for the current instruction.", "new here"],
  ["fmaxf", "floating-point maximum (CUDA C)", "Returns the larger of two floats, with no branch.", "new here"],
  ["CuPy", "a NumPy-like library for NVIDIA GPUs", "Lets Python run small CUDA kernels, used in the lab.", "new here"],
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

export default function Unit4_2({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "The Marching Band" },
    { id: "s1", label: "Trace a Warp" },
    { id: "s2", label: "The Cost" },
    { id: "s3", label: "Fixes" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🥁 The Marching Band — when 32 threads disagree</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔀 Trace a Diverging Warp — masks and idle lanes</h3><TraceWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>⏱️ The Cost — arrangement is everything</h3><CostWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🛠️ Fixing Divergence — three standard tricks</h3><FixWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 4.2.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔀</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 4 › UNIT 4.2</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Warps & Branch Divergence</div>
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
