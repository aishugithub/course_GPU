import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab2_CPU_vs_GPU.ipynb";

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
      <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>🧪 TRY IT FOR REAL — LAB 2 · PART {part}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{what}</div>
      <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}><b style={{ color: C.green }}>You should see:</b> {expect}</div>
      <a href={LAB_URL} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", borderRadius: 8, background: C.orange, color: "#0D1117", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Open Lab 2 in Colab ↗</a>
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

const TEXTBOOK = "Hamacher §12.7 (Performance modelling) · Stallings §2.3 (Amdahl's law) · H&P Ch 1 (Amdahl's law)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


const speedup = (p, s) => 1 / ((1 - p) + p / s);

// ── Section 1: Need — 100× faster part, 3× faster whole ──
function NeedWidget() {
  const [gpu, setGpu] = useState(false);
  const load = 30, mm = 70;
  const mmNew = gpu ? mm / 100 : mm;
  const total = load + mmNew;
  return (
    <div>
      <Frame>
        One training step takes 100 ms on the CPU: <b style={{ color: C.orange }}>30 ms</b> loading and preparing the next batch of images (plain
        Python), and <b style={{ color: C.accent }}>70 ms</b> of matrix multiplies. A GPU makes matrix multiplies <b style={{ color: C.green }}>100× faster</b>.
        Move them to the GPU and predict the new total first.
      </Frame>
      <Btn onClick={() => setGpu((v) => !v)} color={C.green}>{gpu ? "◀ Back to CPU only" : "Move the matrix multiplies to the GPU (100×) ▶"}</Btn>
      <div style={{ display: "flex", height: 44, marginTop: 14, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
        <div style={{ width: `${load}%`, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", color: "#0D1117", fontSize: 12, fontWeight: 700 }}>load 30 ms</div>
        <div style={{ width: `${mmNew}%`, minWidth: 4, background: gpu ? C.green : C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#0D1117", fontSize: 12, fontWeight: 700, transition: "width 0.6s" }}>{gpu ? "" : "matmul 70 ms"}</div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <Stat label="STEP TIME" value={`${total.toFixed(1)} ms`} color={gpu ? C.green : C.text} />
        <Stat label="OVERALL SPEED-UP" value={`${(100 / total).toFixed(2)}×`} color={C.purple} />
      </div>
      {gpu && (
        <Insight color={C.red} title="The matrix part got 100× faster, but the whole step only about 3.3× faster.">
          The 30 ms of loading didn't change, and now it's almost all the time that's left. However fast the GPU gets, this step can never take less
          than 30 ms. That's Amdahl's law.
        </Insight>
      )}
    </div>
  );
}

// ── Section 2: The law ──
function LawWidget() {
  const [p, setP] = useState(0.9);
  const [s, setS] = useState(10);
  const S = speedup(p, s);
  const cap = 1 / (1 - p);
  const X = (v) => 40 + (Math.log10(v) / 3) * 460, Y = (v) => 170 - (Math.min(v, 22) / 22) * 155;
  return (
    <div>
      <Frame>
        Gene Amdahl (1967): if a fraction <b style={{ color: C.accent }}>p</b> of a program's time can be sped up by a factor
        <b style={{ color: C.green }}> s</b>, and the rest can't, the overall speed-up is:
      </Frame>
      <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 17, color: C.text, background: C.card, borderRadius: 10, padding: 12, border: `1px solid ${C.border}` }}>
        S = 1 / ( (1 − <span style={{ color: C.accent }}>p</span>) + <span style={{ color: C.accent }}>p</span> / <span style={{ color: C.green }}>s</span> )
      </div>
      <Slider label={<>Parallel fraction p = <b style={{ color: C.accent }}>{Math.round(p * 100)}%</b></>} value={p} min={0} max={0.99} step={0.01} onChange={setP} />
      <Slider label={<>Speed-up of that part s = <b style={{ color: C.green }}>{s}×</b></>} value={s} min={1} max={1000} onChange={setS} color={C.green} />
      <div style={{ fontFamily: "monospace", fontSize: 13, color: C.yellow, marginBottom: 8 }}>
        S = 1 / ({(1 - p).toFixed(2)} + {p.toFixed(2)} / {s}) = <b>{S.toFixed(2)}×</b>
      </div>
      <svg viewBox="0 0 520 185" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <line x1="40" x2="500" y1={Y(cap)} y2={Y(cap)} stroke={C.red} strokeDasharray="5 4" />
        <text x="44" y={Y(cap) - 5} fill={C.red} fontSize="10">ceiling = 1 / (1 − p) = {cap.toFixed(1)}×</text>
        <polyline fill="none" stroke={C.purple} strokeWidth="2.5" points={Array.from({ length: 61 }, (_, i) => 10 ** (i * 0.05)).map((v) => `${X(v)},${Y(speedup(p, v))}`).join(" ")} />
        <circle cx={X(s)} cy={Y(S)} r="6" fill={C.yellow} />
        {[1, 10, 100, 1000].map((v) => <text key={v} x={X(v)} y="182" fill={C.muted} fontSize="10" textAnchor="middle">s = {v}</text>)}
      </svg>
      <Insight color={C.purple} title="The part you can't speed up sets a hard ceiling: 1 / (1 − p).">
        With p = 90%, even an infinitely fast GPU gives at most 10×. To get big speed-ups, p must be very close to 100%: almost all the time
        must be spent in parallel work.
      </Insight>
    </div>
  );
}

// ── Section 3: The dosa kitchen ──
function KitchenWidget() {
  const [cooks, setCooks] = useState(1);
  const grind = 60;                     // one grinder: can't be shared
  const dosas = 100 * 3;                // 100 dosas × 3 min each, one tawa per cook
  const total = grind + dosas / cooks;
  return (
    <div>
      <Frame>
        A wedding needs 100 dosas. First the batter must be ground: <b style={{ color: C.orange }}>60 minutes in the only grinder</b> (one machine,
        no sharing). Then each dosa takes <b style={{ color: C.green }}>3 minutes on a tawa</b>, and every extra cook brings a tawa. Hire cooks.
      </Frame>
      <Slider label={<>Cooks = <b style={{ color: C.green }}>{cooks}</b></>} value={cooks} min={1} max={100} onChange={setCooks} color={C.green} />
      <div style={{ display: "flex", height: 40, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
        <div style={{ width: `${(grind / 360) * 100}%`, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", color: "#0D1117", fontSize: 11.5, fontWeight: 700 }}>grind 60</div>
        <div style={{ width: `${(dosas / cooks / 360) * 100}%`, minWidth: 3, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", color: "#0D1117", fontSize: 11.5, fontWeight: 700 }}>{cooks < 4 ? `dosas ${(dosas / cooks).toFixed(0)}` : ""}</div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="TOTAL TIME" value={`${total.toFixed(0)} min`} color={C.text} />
        <Stat label="SPEED-UP vs 1 COOK" value={`${(360 / total).toFixed(2)}×`} color={C.purple} />
        <Stat label="BEST POSSIBLE" value="6× (360 ÷ 60)" color={C.red} />
      </div>
      <Insight color={C.orange} title="Hiring the 100th cook barely helps: the grinder is the bottleneck.">
        In AI the "grinder" is often the CPU-side work: reading files, decoding images, Python code between GPU calls. A fast GPU waiting for
        slow data is a very expensive idle machine.
      </Insight>
    </div>
  );
}

// ── Section 4: What should you optimise? ──
const PARTS = [
  { k: "load", t: "Read images from disk", pct: 20, c: C.orange },
  { k: "prep", t: "Decode & resize (CPU)", pct: 15, c: C.yellow },
  { k: "copy", t: "Copy to GPU", pct: 10, c: C.teal },
  { k: "compute", t: "Forward + backward", pct: 50, c: C.green },
  { k: "log", t: "Logging & saving", pct: 5, c: C.purple },
];
function OptimiseWidget() {
  const [pick, setPick] = useState(null);
  const res = (k) => 1 / PARTS.reduce((s, x) => s + (x.k === k ? x.pct / 10 : x.pct) / 100, 0);
  return (
    <div>
      <Frame>
        Your training step is split up as below. Your budget buys <b style={{ color: C.text }}>ONE 10× upgrade</b> for ONE part. Which part gives the
        biggest overall speed-up? Pick one, then try the others.
      </Frame>
      <div style={{ display: "flex", height: 40, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 10 }}>
        {PARTS.map((x) => <div key={x.k} style={{ width: `${pick === x.k ? x.pct / 10 : x.pct}%`, minWidth: 3, background: x.c, transition: "width 0.5s" }} title={x.t} />)}
      </div>
      {PARTS.map((x) => (
        <div key={x.k} onClick={() => setPick(x.k)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 8, marginBottom: 5, cursor: "pointer", background: pick === x.k ? x.c + "22" : C.card, border: `1.5px solid ${pick === x.k ? x.c : C.border}` }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: x.c }} />
          <div style={{ flex: 1, color: C.text, fontSize: 13 }}>{x.t}</div>
          <div style={{ color: C.muted, fontFamily: "monospace", fontSize: 12 }}>{x.pct}% of time</div>
          {pick && <div style={{ fontFamily: "monospace", fontSize: 12, color: x.k === "compute" ? C.green : C.muted, minWidth: 70, textAlign: "right" }}>→ {res(x.k).toFixed(2)}×</div>}
        </div>
      ))}
      {pick && (
        <Insight color={C.green} title="Speed up the biggest part first, and remember that the small parts become the new bottleneck.">
          10× on compute gives 1.82×; 10× on logging gives only 1.05×. After upgrading compute, loading (20%) and decoding (15%) become most of
          the remaining time. That's why real AI code uses several CPU workers to load data in parallel (PyTorch's DataLoader
          <code> num_workers</code>).
        </Insight>
      )}
      <LabCard part="D" title="Amdahl's law on a real GPU"
        what="Build a fake training loop with a slow CPU part (Python preprocessing) and a GPU matrix multiply, time each part, then predict the speed-up with Amdahl's law and compare it with what you measure."
        expect="your Amdahl prediction lands close to the measured speed-up, and the CPU part sets the ceiling." />
    </div>
  );
}

const QUESTIONS = [
  { q: "80% of a program can be sped up 4×. What is the overall speed-up?", options: ["4×", "3.2×", "2.5×", "1.8×"], answer: 2, explain: "S = 1 / (0.2 + 0.8/4) = 1 / (0.2 + 0.2) = 1 / 0.4 = 2.5×." },
  { q: "95% of a program is parallel. With an infinitely fast GPU, the best possible speed-up is…", options: ["95×", "20×", "100×", "Infinite"], answer: 1, explain: "Ceiling = 1 / (1 − p) = 1 / 0.05 = 20×. The serial 5% never shrinks." },
  { q: "A GPU training job shows the GPU busy only 30% of the time. What is the most likely bottleneck?", options: ["The GPU is too slow", "CPU-side data loading and preprocessing", "Too much GPU memory", "The learning rate"], answer: 1, explain: "The GPU sits waiting for data. Speed up the input pipeline (for example with more DataLoader workers) before buying a faster GPU." },
  { q: "Which part should you optimise first?", options: ["The smallest part", "The part that takes the largest share of the time", "The part that's easiest to explain", "Whichever runs on the CPU"], answer: 1, explain: "Amdahl says the gain is limited by the fraction you improve. Start with the biggest slice of time." },
];
const RESULT = {
  perfect: "Perfect! You can predict real-world speed-ups.",
  good: "Good. Replay 'The Law' and drag p close to 100%.",
  low: "Revisit 'The Dosa Kitchen': the part you can't parallelise decides everything.",
  done: "Unit 2.4 Complete!",
  body: "You can apply Amdahl's law, find the ceiling 1 / (1 − p), and choose what to optimise.",
  next: "Next up: Unit 2.C — Capstone: CPU or GPU?",
  teaser: "Put it all together: for any job, decide where it should run, then prove it on a real GPU.",
};

const UNIT_WORDS = [
  ["p", "parallel fraction", "The share of a program's time that can be sped up.", "new here"],
  ["s", "speed-up of the parallel part", "How many times faster that part gets (for example on a GPU).", "new here"],
  ["S", "overall speed-up", "Old total time ÷ new total time.", "new here"],
  ["num_workers", "a DataLoader setting", "How many CPU processes load data in parallel in PyTorch.", "new here"],
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

export default function Unit2_4({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "100× but only 3×?" },
    { id: "s1", label: "The Law" },
    { id: "s2", label: "The Dosa Kitchen" },
    { id: "s3", label: "What to Optimise?" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🤨 100× Faster, But Only 3× Overall?</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>⚖️ Amdahl's Law — S = 1 / ((1 − p) + p/s)</h3><LawWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🥞 The Dosa Kitchen — the grinder is the bottleneck</h3><KitchenWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🎯 What Should You Optimise?</h3><OptimiseWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 2.4.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚖️</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 2 › UNIT 2.4</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Amdahl's Law</div>
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
