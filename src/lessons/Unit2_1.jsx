import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab02_AI_Is_Hungry.ipynb";

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

const TEXTBOOK = "Hamacher Ch 1 (Performance) · Stallings §2.4 (Basic measures of computer performance)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


const fmt = (x) => {
  if (x < 1e3) return x.toFixed(0);
  const u = [["", 1], ["thousand", 1e3], ["million", 1e6], ["billion", 1e9], ["trillion", 1e12], ["quadrillion", 1e15], ["quintillion", 1e18], ["sextillion", 1e21]];
  let k = 0; while (k < u.length - 1 && x >= u[k + 1][1]) k++;
  return `${(x / u[k][1]).toFixed(x / u[k][1] < 10 ? 1 : 0)} ${u[k][0]}`;
};

// ── Section 1: Need — guess the work ──
const TASKS = [
  { t: "Read ONE handwritten digit (your Lab 1 network)", macs: 1.0e5, note: "784×128 + 128×10 ≈ 1 lakh MACs." },
  { t: "Recognise ONE photo with ResNet-50 (a classic image model)", macs: 4.1e9, note: "About 4 billion MACs for a single 224 × 224 photo (approximate published figure)." },
  { t: "Generate ONE word (token) with a GPT-3-sized chatbot (175 billion parameters)", macs: 1.75e11, note: "Roughly one MAC per parameter for every token: about 175 billion." },
  { t: "TRAIN GPT-3 once, from scratch", macs: 1.6e23, note: "About 3 × 10²³ arithmetic operations (≈ 1.6 × 10²³ MACs), a published estimate." },
];
const GUESSES = [1e3, 1e6, 1e9, 1e12, 1e15, 1e18, 1e21, 1e24];
function NeedWidget() {
  const [g, setG] = useState({});
  return (
    <div>
      <Frame>
        Every AI answer is multiply-adds (MACs, from Unit 1.3). But how many? Guess the order of magnitude for each job, then check.
        Most people are off by a factor of a million.
      </Frame>
      {TASKS.map((x, i) => {
        const pick = g[i];
        const closest = GUESSES.reduce((a, b) => (Math.abs(Math.log10(b / x.macs)) < Math.abs(Math.log10(a / x.macs)) ? b : a));
        return (
          <div key={i} style={{ background: C.card, border: `1px solid ${pick ? (pick === closest ? C.green : C.yellow) : C.border}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
            <div style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{x.t}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {GUESSES.map((v) => (
                <button key={v} onClick={() => !pick && setG((s) => ({ ...s, [i]: v }))} style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11.5, fontFamily: "monospace", cursor: pick ? "default" : "pointer", border: `1px solid ${pick && v === closest ? C.green : pick === v ? C.yellow : C.border}`, background: pick && v === closest ? C.green + "22" : pick === v ? C.yellow + "22" : C.surface, color: C.text }}>10^{Math.log10(v)}</button>
              ))}
            </div>
            {pick && <div style={{ marginTop: 8, fontSize: 12.5, color: C.muted }}><b style={{ color: C.green }}>≈ {fmt(x.macs)} MACs.</b> {x.note} {pick !== closest && <span style={{ color: C.yellow }}>You were off by about 10^{Math.abs(Math.round(Math.log10(pick / x.macs)))}.</span>}</div>}
          </div>
        );
      })}
      {Object.keys(g).length === TASKS.length && (
        <Insight color={C.orange} title="From 1 lakh to 10²³: AI's appetite spans 18 powers of ten.">
          A digit is easy for anything. A chatbot word needs hundreds of billions of operations, and training one needs more operations than
          there are grains of sand on Earth (about 10¹⁹). This unit gives you the tools to count it yourself.
        </Insight>
      )}
    </div>
  );
}

// ── Section 2: FLOPs vs FLOPS ──
const PREFIX = [["kilo (K)", 3, "thousand"], ["mega (M)", 6, "million / 10 lakh"], ["giga (G)", 9, "billion / 100 crore"], ["tera (T)", 12, "trillion / 1 lakh crore"], ["peta (P)", 15, "quadrillion"], ["exa (E)", 18, "quintillion"]];
function FlopsWidget() {
  const [which, setWhich] = useState("ops");
  const [p, setP] = useState(3);
  return (
    <div>
      <Frame>
        Engineers count AI work in <b style={{ color: C.text }}>floating-point operations</b>: one multiply OR one add on decimal numbers.
        One MAC = <b style={{ color: C.accent }}>2 FLOPs</b>. Watch out for two words that look almost the same:
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Btn ghost={which !== "ops"} onClick={() => setWhich("ops")}>FLOPs (small s)</Btn>
        <Btn ghost={which !== "rate"} onClick={() => setWhich("rate")} color={C.purple}>FLOPS (capital S)</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `1.5px solid ${which === "ops" ? C.accent : C.border}`, opacity: which === "ops" ? 1 : 0.5 }}>
          <div style={{ color: C.accent, fontWeight: 700, fontSize: 13 }}>FLOPs = an amount of WORK</div>
          <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.7, marginTop: 4 }}>"This model needs 8 GFLOPs per photo." Like a distance: <b>how far</b> you must travel. It's a property of the job.</div>
        </div>
        <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `1.5px solid ${which === "rate" ? C.purple : C.border}`, opacity: which === "rate" ? 1 : 0.5 }}>
          <div style={{ color: C.purple, fontWeight: 700, fontSize: 13 }}>FLOPS = FLOPs per SECOND, a SPEED</div>
          <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.7, marginTop: 4 }}>"This GPU does 65 TFLOPS." Like km/h: <b>how fast</b> you can travel. It's a property of the hardware.</div>
        </div>
      </div>
      <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: C.yellow + "14", border: `1px solid ${C.yellow}55`, fontFamily: "monospace", fontSize: 13, color: C.text }}>
        time (seconds) = work (FLOPs) ÷ speed (FLOPS)     ← like  time = distance ÷ speed
      </div>
      <div style={{ marginTop: 16, background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>The prefixes you'll meet</div>
        <Slider label={<>prefix: <b style={{ color: C.accent }}>{PREFIX[p][0]}</b></>} value={p} min={0} max={5} onChange={setP} />
        <div style={{ fontFamily: "monospace", fontSize: 14, color: C.teal }}>1 {PREFIX[p][0].split(" ")[0]}FLOP = 10^{PREFIX[p][1]} = 1{"0".repeat(PREFIX[p][1])}</div>
        <div style={{ color: C.muted, fontSize: 12.5, marginTop: 4 }}>= one {PREFIX[p][2]}</div>
      </div>
      <Insight title="Work ÷ speed = time. Every 'how long will it take?' question in this course is this one division.">
        Count the FLOPs of the job, look up the FLOPS of the chip, divide. The rest of the course is about making that division come out small.
      </Insight>
    </div>
  );
}

// ── Section 3: Count a model's work ──
function CountWidget() {
  const [params, setParams] = useState(7);
  const [words, setWords] = useState(500);
  const P = params * 1e9;
  const perTok = 2 * P;
  const tokens = Math.round(words * 1.3);
  return (
    <div>
      <Frame>
        For a chatbot (a language model) there is a handy rule: generating <b style={{ color: C.text }}>one token costs about 2 FLOPs per parameter</b>,
        because every weight is used in one multiply-add. A token is roughly ¾ of a word. Pick a model size and an answer length.
      </Frame>
      <Slider label={<>Model size = <b style={{ color: C.accent }}>{params} billion</b> parameters {params === 7 ? "(a small open model you can run yourself)" : params >= 175 ? "(GPT-3 class)" : ""}</>} value={params} min={1} max={400} onChange={setParams} />
      <Slider label={<>Answer length = <b style={{ color: C.purple }}>{words}</b> words ≈ {tokens} tokens</>} value={words} min={10} max={3000} step={10} onChange={setWords} color={C.purple} />
      <div style={{ fontFamily: "monospace", fontSize: 13, color: C.text, lineHeight: 2, background: C.card, borderRadius: 10, padding: 12, border: `1px solid ${C.border}` }}>
        <div>FLOPs per token = 2 × {params} billion = <b style={{ color: C.accent }}>{fmt(perTok)}</b></div>
        <div>FLOPs for the answer = {fmt(perTok)} × {tokens} = <b style={{ color: C.orange }}>{fmt(perTok * tokens)}</b></div>
      </div>
      <Insight color={C.orange} title="One chatbot answer can easily be 10¹⁵ FLOPs, a quadrillion operations.">
        And a popular chatbot answers crores of questions a day. That's why AI companies buy chips by the lakh.
      </Insight>
    </div>
  );
}

// ── Section 4: How long on which machine? ──
const DEVICES = [
  { d: "You, with pen and paper", f: 0.1, tag: "1 operation every 10 s" },
  { d: "A single CPU core, plain Python loops", f: 3e7, tag: "≈ 30 MFLOPS (measured in Lab 2)" },
  { d: "A laptop CPU, all cores, NumPy", f: 2e11, tag: "≈ 0.2 TFLOPS (approx.)" },
  { d: "NVIDIA T4 GPU (free Colab), FP32", f: 8.1e12, tag: "8.1 TFLOPS peak" },
  { d: "NVIDIA T4 GPU, FP16 Tensor Cores", f: 6.5e13, tag: "65 TFLOPS peak" },
  { d: "NVIDIA H100 GPU, FP16 Tensor Cores", f: 9.9e14, tag: "≈ 990 TFLOPS peak" },
];
const JOBS = [
  { j: "Classify 10,000 digits (Lab 1 network)", f: 2 * 1e5 * 1e4 },
  { j: "Recognise 1,000 photos (ResNet-50)", f: 2 * 4.1e9 * 1e3 },
  { j: "A 500-word chatbot answer (7 B model)", f: 2 * 7e9 * 650 },
  { j: "Train GPT-3 once", f: 3.14e23 },
];
const human = (s) => s < 1e-3 ? `${(s * 1e6).toFixed(0)} µs` : s < 1 ? `${(s * 1e3).toFixed(0)} ms` : s < 120 ? `${s.toFixed(1)} s` : s < 7200 ? `${(s / 60).toFixed(0)} min` : s < 172800 ? `${(s / 3600).toFixed(0)} hours` : s < 3.15e7 * 2 ? `${(s / 86400).toFixed(0)} days` : `${fmt(s / 3.15e7)} years`;
function DeviceWidget() {
  const [j, setJ] = useState(2);
  return (
    <div>
      <Frame>
        Now do the division: <b style={{ color: C.text }}>time = FLOPs ÷ FLOPS</b>. Pick a job and compare machines. Speeds are approximate
        peak figures; real programs usually reach only a fraction of the peak.
      </Frame>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {JOBS.map((x, i) => <Btn key={i} ghost={i !== j} onClick={() => setJ(i)} color={C.orange}>{x.j}</Btn>)}
      </div>
      <div style={{ color: C.muted, fontSize: 12.5, marginBottom: 8 }}>Work: <b style={{ color: C.orange }}>{fmt(JOBS[j].f)} FLOPs</b></div>
      {DEVICES.map((d) => {
        const t = JOBS[j].f / d.f;
        const w = Math.max(2, Math.min(100, (Math.log10(t) + 6) * 6));
        return (
          <div key={d.d} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
              <span style={{ color: C.text }}>{d.d} <span style={{ color: C.muted }}>({d.tag})</span></span>
              <span style={{ color: t > 3600 ? C.red : t > 1 ? C.yellow : C.green, fontFamily: "monospace", fontWeight: 700 }}>{human(t)}</span>
            </div>
            <div style={{ height: 8, background: C.card, borderRadius: 4 }}><div style={{ width: `${w}%`, height: "100%", borderRadius: 4, background: t > 3600 ? C.red : t > 1 ? C.yellow : C.green }} /></div>
          </div>
        );
      })}
      <div style={{ color: C.muted, fontSize: 11.5 }}>Bar length is on a log scale: each step right = 10× longer.</div>
      <Insight color={C.green} title="Same job, same maths, from days to milliseconds, purely by changing the machine.">
        Notice the jumps: plain Python → NumPy → GPU → GPU Tensor Cores. Each is a different way of doing many multiply-adds at once.
        Modules 3–6 explain each jump.
      </Insight>
      <LabCard part="A" title="Count parameters and FLOPs of real models"
        what="Count the parameters of your Lab 1 network and of ResNet-18 using PyTorch, then estimate FLOPs per input with the 2 × MACs rule and the time it needs at your measured speed."
        expect="about 1 lakh parameters for the Lab 1 network and about 1.17 crore (11.7 million) for ResNet-18." />
    </div>
  );
}

const QUESTIONS = [
  { q: "A layer does 5 million multiply-accumulates (MACs). How many FLOPs is that?", options: ["2.5 million", "5 million", "10 million", "25 million"], answer: 2, explain: "Each MAC is one multiply plus one add, so 2 FLOPs. 5 million MACs = 10 million FLOPs." },
  { q: "'This GPU reaches 65 TFLOPS.' What does that number describe?", options: ["How much memory it has", "How much work a model needs", "How many floating-point operations it can do per second", "How many cores it has"], answer: 2, explain: "FLOPS with a capital S is a speed: operations per second. FLOPs (small s) is an amount of work." },
  { q: "A job needs 10¹² FLOPs. A machine delivers 10¹¹ FLOPS. Roughly how long does it take?", options: ["0.1 s", "1 s", "10 s", "100 s"], answer: 2, explain: "time = work ÷ speed = 10¹² ÷ 10¹¹ = 10 seconds." },
  { q: "Using '2 FLOPs per parameter per token', a 10-billion-parameter model generating 100 tokens needs about…", options: ["2 × 10¹⁰ FLOPs", "2 × 10¹² FLOPs", "10¹¹ FLOPs", "2 × 10⁹ FLOPs"], answer: 1, explain: "2 × 10¹⁰ FLOPs per token × 100 tokens = 2 × 10¹² FLOPs." },
];
const RESULT = {
  perfect: "Perfect! You can estimate the cost of any AI job.",
  good: "Good. Replay 'FLOPs vs FLOPS'; the s matters.",
  low: "Revisit 'FLOPs vs FLOPS' and 'How Long?': work ÷ speed = time is the key tool.",
  done: "Unit 2.1 Complete!",
  body: "You can count multiply-adds, convert to FLOPs, and estimate run time on any machine.",
  next: "Next up: Unit 2.2 — Training vs Inference, Epochs & Batches.",
  teaser: "Using a model is cheap. Teaching it is a lot more expensive. Find out exactly why.",
};

const UNIT_WORDS = [
  ["MAC", "Multiply-Accumulate", "One multiply + one add = 2 FLOPs.", "from Unit 1.3"],
  ["FLOP", "FLoating-point OPeration", "One add or one multiply on decimal (floating-point) numbers. FLOPs = an amount of work.", "new here"],
  ["FLOPS", "FLoating-point Operations Per Second", "A speed: how many FLOPs a chip can do each second.", "new here"],
  ["TFLOPS", "tera-FLOPS", "10¹² FLOPs per second, a lakh crore every second.", "new here"],
  ["GPT", "Generative Pre-trained Transformer", "The family of language models behind ChatGPT.", "new here"],
  ["FP32 / FP16", "32-bit / 16-bit floating point", "Number formats with more or fewer bits (IEEE 754, from COA). Unit 6.2 explains why fewer bits run faster.", "from COA"],
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

export default function Unit2_1({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "Guess the Work" },
    { id: "s1", label: "FLOPs vs FLOPS" },
    { id: "s2", label: "Count a Chatbot" },
    { id: "s3", label: "How Long?" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🤔 Guess the Work — how many multiply-adds?</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📏 FLOPs vs FLOPS — work vs speed</h3><FlopsWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>💬 Count a Chatbot — 2 FLOPs per parameter per token</h3><CountWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>⏱️ How Long? — time = work ÷ speed</h3><DeviceWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 2.1.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🧮</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 2 › UNIT 2.1</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Counting the Multiply-Adds</div>
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
