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

const TEXTBOOK = "D2L Ch 13 (Computational performance) · Hamacher Ch 1 (Performance)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


const fmt = (x) => {
  const u = [["", 1], [" thousand", 1e3], [" million", 1e6], [" billion", 1e9], [" trillion", 1e12], [" quadrillion", 1e15], [" quintillion", 1e18]];
  let k = 0; while (k < u.length - 1 && x >= u[k + 1][1]) k++;
  return `${(x / u[k][1]).toFixed(x / u[k][1] < 10 ? 1 : 0)}${u[k][0]}`;
};

// ── Section 1: The Mission ──
const TOOLS = [
  ["FLOPs per token ≈ 2 × parameters", "Unit 2.1"],
  ["A token is about ¾ of a word", "Unit 2.1"],
  ["time = work (FLOPs) ÷ speed (FLOPS)", "Unit 2.1"],
  ["Inference only: no backward pass needed to answer questions", "Unit 2.2"],
  ["Different students' questions are independent, so they can be answered in parallel", "Unit 2.3"],
];
function MissionWidget() {
  const [ticks, setTicks] = useState([]);
  return (
    <div>
      <Frame>
        Your principal wants a <b style={{ color: C.text }}>College Helpdesk Bot</b>: students ask about timetables, fees and exams, and an AI model
        answers. Before buying anything, she asks you: <i>how much computing does this need each day, which machine can handle it, and what will
        it cost?</i> Tick each tool once you've found where you learned it.
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
      <Insight color={C.green} title="An engineer's estimate needs no special software, just these five facts and a calculator.">
        Real AI teams do exactly this "back-of-the-envelope" maths before spending lakhs of rupees on hardware.
      </Insight>
    </div>
  );
}

// ── Section 2: Build in Steps ──
const VERSIONS = [
  { tag: "v1", title: "Work for ONE answer", color: C.teal, why: "Start small: how many FLOPs does a single answer take? Model size × 2 × tokens.", code: `params = 7e9                 # a 7-billion-parameter model
words_per_answer = 200
tokens = words_per_answer / 0.75          # ≈ 267 tokens

flops_per_answer = 2 * params * tokens
print(f"{flops_per_answer:.2e} FLOPs per answer")   # ≈ 3.7e12` },
  { tag: "v2", title: "+ a whole day", color: C.yellow, why: "One answer is fine, but the college has thousands of students. Multiply by the number of questions per day.", code: `students = 5000
questions_each = 4
answers_per_day = students * questions_each      # 20,000

flops_per_day = flops_per_answer * answers_per_day
print(f"{flops_per_day:.2e} FLOPs per day")       # ≈ 7.5e16` },
  { tag: "v3", title: "+ machines, time & money", color: C.green, why: "Now divide by each machine's speed. Real programs reach only part of the peak, so include a utilisation factor. Then turn GPU-hours into rupees.", code: `machines = {                      # peak FLOPS (approximate)
    "laptop CPU": 0.2e12,
    "T4 GPU (FP16)": 65e12,
}
utilisation = 0.3                 # real code rarely hits peak
rupees_per_gpu_hour = 35          # assumed cloud price

for name, peak in machines.items():
    hours = flops_per_day / (peak * utilisation) / 3600
    print(f"{name:14s}: {hours:8.1f} hours of work per day")

t4_hours = flops_per_day / (65e12 * utilisation) / 3600
print(f"Cloud cost ≈ ₹{t4_hours * rupees_per_gpu_hour:.0f} per day")` },
];
function BuildWidget() {
  const [v, setV] = useState(0);
  const cur = VERSIONS[v];
  return (
    <div>
      <Frame>Grow the estimator one idea at a time. Each version adds ONE idea.</Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {VERSIONS.map((x, i) => <Btn key={x.tag} ghost={i !== v} onClick={() => setV(i)} color={x.color}>{x.tag}: {x.title}</Btn>)}
      </div>
      <div style={{ padding: "10px 14px", borderRadius: 8, background: cur.color + "14", border: `1px solid ${cur.color}55`, color: C.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
        <b style={{ color: cur.color }}>{cur.tag}: </b>{cur.why}
      </div>
      <Code color={cur.color}>{cur.code}</Code>
      <Insight title="One answer → one day → machines and money.">
        Each version answers a bigger question using the previous one. That's how estimates, and programs, should grow.
      </Insight>
    </div>
  );
}

// ── Section 3: Play It — the estimator ──
const MACH = [
  { m: "Laptop CPU (NumPy)", f: 2e11 },
  { m: "NVIDIA T4, FP32", f: 8.1e12 },
  { m: "NVIDIA T4, FP16 Tensor Cores", f: 6.5e13 },
  { m: "NVIDIA A100, FP16 Tensor Cores", f: 3.12e14 },
];
function PlayWidget() {
  const [students, setStudents] = useState(5000);
  const [q, setQ] = useState(4);
  const [words, setWords] = useState(200);
  const [params, setParams] = useState(7);
  const [util, setUtil] = useState(30);
  const [rate, setRate] = useState(35);
  const perDay = 2 * params * 1e9 * (words / 0.75) * students * q;
  return (
    <div>
      <Frame>Your estimator, live. Change the college and the model, and see whether each machine can keep up within 24 hours, and at what cost.</Frame>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Slider label={<>Students = <b style={{ color: C.teal }}>{students.toLocaleString("en-IN")}</b></>} value={students} min={500} max={50000} step={500} onChange={setStudents} color={C.teal} />
        <Slider label={<>Questions per student per day = <b style={{ color: C.teal }}>{q}</b></>} value={q} min={1} max={20} onChange={setQ} color={C.teal} />
        <Slider label={<>Words per answer = <b style={{ color: C.purple }}>{words}</b></>} value={words} min={20} max={1000} step={10} onChange={setWords} color={C.purple} />
        <Slider label={<>Model size = <b style={{ color: C.accent }}>{params} B</b> parameters</>} value={params} min={1} max={70} onChange={setParams} />
        <Slider label={<>Utilisation = <b style={{ color: C.yellow }}>{util}%</b> of peak</>} value={util} min={5} max={80} step={5} onChange={setUtil} color={C.yellow} />
        <Slider label={<>Cloud price = <b style={{ color: C.green }}>₹{rate}</b> per GPU-hour</>} value={rate} min={10} max={300} step={5} onChange={setRate} color={C.green} />
      </div>
      <Stat label="WORK PER DAY" value={`${fmt(perDay)} FLOPs`} color={C.orange} />
      <div style={{ marginTop: 10 }}>
        {MACH.map((x) => {
          const hrs = perDay / (x.f * util / 100) / 3600;
          const n = Math.ceil(hrs / 24);
          return (
            <div key={x.m} style={{ display: "flex", gap: 8, alignItems: "center", background: C.card, borderRadius: 8, padding: "8px 12px", marginBottom: 6, border: `1.5px solid ${hrs <= 24 ? C.green : C.red}` }}>
              <div style={{ flex: 1, color: C.text, fontSize: 13 }}>{x.m}</div>
              <div style={{ fontFamily: "monospace", fontSize: 12.5, color: hrs <= 24 ? C.green : C.red }}>{hrs < 1 ? `${(hrs * 60).toFixed(0)} min` : `${hrs.toFixed(1)} h`} of work/day</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: C.muted, minWidth: 120, textAlign: "right" }}>{hrs <= 24 ? "✓ 1 machine" : `needs ${n.toLocaleString("en-IN")} machines`}</div>
            </div>
          );
        })}
      </div>
      <Stat label="T4 CLOUD COST PER DAY (FP16)" value={`₹${Math.round(perDay / (6.5e13 * util / 100) / 3600 * rate).toLocaleString("en-IN")}`} color={C.green} />
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 6 }}>Speeds are approximate published peaks; the price is an assumption, so check current rates. Unit 6.3 shows why chatbot answers often run slower than this FLOPs estimate (memory speed becomes the limit).</div>
      <Insight color={C.green} title="The laptop CPU can't keep up with even a small college; a single GPU usually can.">
        Same arithmetic, same model. The difference is entirely how many operations the machine does per second. Module 3 opens up that
        difference: CPU vs GPU.
      </Insight>
    </div>
  );
}

// ── Section 4: Full code + lab ──
function CodeWidget() {
  return (
    <div>
      <Frame>The complete estimator, runnable in any Python. In Lab 2 Part D you'll replace the guessed "laptop CPU" speed with one you measure yourself.</Frame>
      <Code color={C.green} title="🧾 compute_bill.py">{`params            = 7e9      # model size
students          = 5000
questions_each    = 4
words_per_answer  = 200
utilisation       = 0.3
rupees_per_hour   = 35       # assumption: check current cloud prices

tokens_per_answer = words_per_answer / 0.75
flops_per_day = 2 * params * tokens_per_answer * students * questions_each
print(f"Work per day: {flops_per_day:.2e} FLOPs")

machines = {"laptop CPU": 0.2e12, "T4 FP32": 8.1e12, "T4 FP16": 65e12, "A100 FP16": 312e12}
for name, peak in machines.items():
    hours = flops_per_day / (peak * utilisation) / 3600
    fits = "fits in a day" if hours <= 24 else f"needs {int(hours // 24) + 1} machines"
    print(f"{name:10s} {hours:10.1f} h/day   {fits}")

t4 = flops_per_day / (65e12 * utilisation) / 3600
print(f"T4 cloud cost: about ₹{t4 * rupees_per_hour:,.0f} per day")`}</Code>
      <div style={{ marginTop: 12, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        <b style={{ color: C.text }}>Challenge upgrades:</b> (1) add a peak hour, when 40% of the day's questions arrive in one hour: how many GPUs do you need then?
        (2) Add a one-time training cost using 6 × parameters × tokens (Unit 2.2).
      </div>
      <LabCard part="D" title="Measure your own CPU's speed"
        what="Time matrix multiplication in plain Python and in NumPy for growing sizes, plot time against n, and compute your machine's real GFLOPS = 2n³ ÷ time. Then put that number into the estimator."
        expect="plain Python reaching only tens of MFLOPS, NumPy reaching tens to hundreds of GFLOPS, and time growing about 8× when n doubles." />
      <Insight color={C.orange} title="Module 2 complete: you can now put a number on AI's hunger.">
        Next you'll meet the machine built to feed it.
      </Insight>
    </div>
  );
}

const QUESTIONS = [
  { q: "A 7-billion-parameter model writes a 300-token answer. About how many FLOPs is that?", options: ["2.1 × 10⁹", "4.2 × 10¹²", "2.1 × 10¹²", "7 × 10⁹"], answer: 1, explain: "2 × 7 × 10⁹ × 300 = 4.2 × 10¹² FLOPs." },
  { q: "A machine's peak is 10 TFLOPS but your program reaches 30% of it. What speed should you use in the estimate?", options: ["10 TFLOPS", "3 TFLOPS", "30 TFLOPS", "0.3 TFLOPS"], answer: 1, explain: "Effective speed = peak × utilisation = 10 × 0.3 = 3 TFLOPS." },
  { q: "The bot needs 48 GPU-hours of work every day. How many GPUs must run round the clock?", options: ["1", "2", "24", "48"], answer: 1, explain: "Each GPU gives 24 hours a day: 48 ÷ 24 = 2 GPUs. This only works because different students' questions are independent and can run in parallel." },
  { q: "Why doesn't the helpdesk estimate include a backward pass?", options: ["It's too small to matter", "Answering questions is inference; the backward pass is only needed for training", "GPUs skip it automatically", "Chatbots have no layers"], answer: 1, explain: "Using a trained model is forward-only (Unit 2.2). Backward passes and updates belong to training." },
];
const RESULT = {
  perfect: "Perfect! You can size an AI deployment like an engineer.",
  good: "Good. Replay 'Play It' and push the sliders to extremes.",
  low: "Revisit 'Build in Steps': one answer → one day → machines.",
  done: "Module 2 Complete! 🍔",
  body: "You can count AI's work, separate training from inference, spot the parallelism, and estimate time and cost on real machines.",
  next: "Next up: Module 3 — CPU vs GPU.",
  teaser: "Why does a chip with thousands of 'slow' cores beat a CPU with a few fast ones? Time to race them.",
};

const UNIT_WORDS = [
  ["FLOPS", "FLoating-point Operations Per Second", "A machine's speed.", "from Unit 2.1"],
  ["A100", "NVIDIA A100", "A data-centre GPU, much bigger than Colab's T4.", "new here"],
  ["GPU-hour", "one GPU used for one hour", "How cloud companies charge for GPUs.", "new here"],
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

export default function Unit2_C({ student, onUnitComplete }) {
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
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🎯 The Mission — the College Helpdesk Bot</h3><MissionWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🪜 Build in Steps — one answer → one day → money</h3><BuildWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>▶️ Play It — your compute estimator</h3><PlayWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📜 Full Code — and measure your own CPU</h3><CodeWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 2.C.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏆</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 2 › UNIT 2.C</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Capstone: The Compute Bill</div>
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
