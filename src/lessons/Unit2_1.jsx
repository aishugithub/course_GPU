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

const TEXTBOOK = "Stallings §2.2 (Multicore, MICs and GPGPUs) · H&P §4.4 (Graphics processing units) · Kirk & Hwu Ch 1";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// ── Section 1: Need — one professor or 1000 students? ──
function NeedWidget() {
  const [n, setN] = useState(10);
  const prof = n * 0.5;                       // 30 s per script, one after another
  const studs = Math.ceil(n / 1000) * 5;      // 5 min per script, 1000 in parallel
  const winner = prof < studs ? "prof" : prof > studs ? "studs" : "tie";
  const show = (m) => (m < 60 ? `${m.toFixed(1)} min` : `${(m / 60).toFixed(1)} hours`);
  return (
    <div>
      <Frame>
        Answer scripts must be marked. Option A: <b style={{ color: C.orange }}>one expert professor</b>, very fast at 30 seconds a script, but
        one at a time. Option B: <b style={{ color: C.green }}>1000 students</b>, slow at 5 minutes a script, but all marking together. Who
        finishes first? Drag the number of scripts.
      </Frame>
      <Slider label={<>Answer scripts = <b style={{ color: C.accent }}>{n.toLocaleString("en-IN")}</b></>} value={n} min={1} max={5000} onChange={setN} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `2px solid ${winner === "prof" ? C.green : C.border}` }}>
          <div style={{ fontSize: 30 }}>👩‍🏫</div>
          <div style={{ color: C.orange, fontWeight: 700, fontSize: 13 }}>ONE PROFESSOR (like a CPU core)</div>
          <div style={{ color: C.text, fontFamily: "monospace", fontSize: 18, marginTop: 6 }}>{show(prof)}</div>
          <div style={{ color: C.muted, fontSize: 12 }}>finishes ONE script in 30 s</div>
        </div>
        <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `2px solid ${winner === "studs" ? C.green : C.border}` }}>
          <div style={{ fontSize: 30 }}>🧑‍🎓🧑‍🎓🧑‍🎓</div>
          <div style={{ color: C.green, fontWeight: 700, fontSize: 13 }}>1000 STUDENTS (like GPU cores)</div>
          <div style={{ color: C.text, fontFamily: "monospace", fontSize: 18, marginTop: 6 }}>{show(studs)}</div>
          <div style={{ color: C.muted, fontSize: 12 }}>each takes 5 min for ONE script</div>
        </div>
      </div>
      <div style={{ marginTop: 10, color: winner === "prof" ? C.orange : C.green, fontWeight: 700, fontSize: 13 }}>
        {winner === "prof" ? "🏆 The professor wins: too few scripts to keep 1000 students busy." : winner === "studs" ? "🏆 The students win: sheer numbers beat individual speed." : "🤝 A tie!"}
      </div>
      <Insight title="Fast at one job, or fast at many jobs: two different kinds of 'fast'.">
        The professor is the better choice for a single urgent script. The crowd is the better choice for a mountain of them. Find the crossover
        on the slider (about 10 scripts). AI is always a mountain.
      </Insight>
    </div>
  );
}

// ── Section 2: Latency vs throughput, defined ──
function DefineWidget() {
  const [people, setPeople] = useState(4);
  const carTrips = Math.ceil(people / 4), busTrips = Math.ceil(people / 50);
  const carTime = carTrips * 3 * 2 - 3, busTime = busTrips * 4 * 2 - 4; // return trips except last
  return (
    <div>
      <Frame>
        Two words architects use. <b style={{ color: C.orange }}>Latency</b> is how long ONE job takes from start to finish.
        <b style={{ color: C.green }}> Throughput</b> is how many jobs finish per hour. Taking people from Chennai to Pondicherry: a car (4 seats,
        3 h) or a bus (50 seats, 4 h)? Choose how many people must travel.
      </Frame>
      <Slider label={<>People to move = <b style={{ color: C.accent }}>{people}</b></>} value={people} min={1} max={200} onChange={setPeople} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[["🚗 Car", C.orange, 3, 4 / 3, carTrips, carTime], ["🚌 Bus", C.green, 4, 50 / 4, busTrips, busTime]].map(([t, c, lat, thr, trips, total]) => (
          <div key={t} style={{ background: C.card, borderRadius: 10, padding: 14, border: `1.5px solid ${c}` }}>
            <div style={{ color: c, fontWeight: 700 }}>{t}</div>
            <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.8, marginTop: 4 }}>
              Latency: <b style={{ color: C.text }}>{lat} h</b> per person<br />
              Throughput: <b style={{ color: C.text }}>{thr.toFixed(1)} people / hour</b><br />
              Trips needed: <b style={{ color: C.text }}>{trips}</b> → everyone there in <b style={{ color: c }}>{total} h</b>
            </div>
          </div>
        ))}
      </div>
      <Insight color={C.purple} title="A CPU is built for low latency. A GPU is built for high throughput.">
        The car wins for one person, the bus for a crowd. A CPU core finishes your single task as fast as possible. A GPU accepts that each task is
        slower and finishes a huge number of them per second.
      </Insight>
    </div>
  );
}

// ── Section 3: Where the transistors go ──
const AREAS = {
  cpu: [
    { k: "ctrl", x: 10, y: 10, w: 160, h: 70, label: "Control: branch prediction, out-of-order", c: C.purple },
    { k: "alu", x: 180, y: 10, w: 70, h: 70, label: "ALUs", c: C.green },
    { k: "cache", x: 10, y: 90, w: 240, h: 90, label: "Big caches (L1, L2, L3)", c: C.teal },
  ],
  gpu: [
    { k: "ctrl", x: 10, y: 10, w: 240, h: 18, label: "Control (small)", c: C.purple },
    { k: "alu", x: 10, y: 34, w: 240, h: 120, label: "Thousands of simple ALUs", c: C.green },
    { k: "cache", x: 10, y: 160, w: 240, h: 20, label: "Small caches", c: C.teal },
  ],
};
const WHY = {
  ctrl: "Control logic makes ONE instruction stream run fast: predicting branches, running instructions out of order, all the pipeline tricks from COA. Great for latency, but it takes a lot of chip area.",
  alu: "ALUs (arithmetic logic units) do the actual multiply-adds. More ALUs means more arithmetic per second, which is throughput.",
  cache: "Caches keep data close so ONE core rarely waits for slow memory (COA Unit 4). A GPU keeps caches small and hides memory waits a different way (Unit 3.3).",
};
function DieWidget() {
  const [k, setK] = useState("alu");
  const Die = ({ which, title }) => (
    <div style={{ flex: 1, minWidth: 240 }}>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{title}</div>
      <svg viewBox="0 0 260 190" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        {AREAS[which].map((a) => (
          <g key={a.k} onClick={() => setK(a.k)} style={{ cursor: "pointer" }}>
            <rect x={a.x} y={a.y} width={a.w} height={a.h} rx="6" fill={a.c + (k === a.k ? "55" : "22")} stroke={a.c} strokeWidth={k === a.k ? 2.5 : 1} />
            {which === "gpu" && a.k === "alu" && Array.from({ length: 96 }, (_, i) => <rect key={i} x={16 + (i % 16) * 14.6} y={40 + Math.floor(i / 16) * 18.5} width="10" height="13" rx="2" fill={C.green} opacity="0.7" />)}
            <text x={a.x + a.w / 2} y={a.y + a.h / 2 + 4} fill={C.text} fontSize="10.5" textAnchor="middle" style={{ pointerEvents: "none" }}>{which === "gpu" && a.k === "alu" ? "" : a.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
  return (
    <div>
      <Frame>
        A chip has a fixed budget of transistors. A CPU and a GPU spend that budget very differently. Click the coloured regions of these
        simplified chip floor plans.
      </Frame>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Die which="cpu" title="CPU: a few powerful cores (one shown)" />
        <Die which="gpu" title="GPU: many simple cores" />
      </div>
      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{WHY[k]}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="TYPICAL LAPTOP CPU" value="8–16 cores" color={C.orange} />
        <Stat label="NVIDIA T4 (COLAB)" value="2,560 CUDA cores" color={C.green} />
      </div>
      <Insight color={C.green} title="The CPU spends transistors on making one thread fast; the GPU spends them on doing many things at once.">
        Neither is "better". They're tuned for different jobs, and that's why every AI computer has both.
      </Insight>
    </div>
  );
}

// ── Section 4: The race ──
function RaceWidget() {
  const [e, setE] = useState(3);
  const n = Math.round(10 ** e);
  const cpu = Math.ceil(n / 8) * 1;              // 8 fast cores, 1 time unit per item
  const gpu = 200 + Math.ceil(n / 2560) * 20;    // launch/transfer overhead, then 2560 slow cores (20 units per item)
  const pts = Array.from({ length: 41 }, (_, i) => 1 + i * 0.15);
  const X = (v) => 30 + ((v - 1) / 6) * 480, Y = (t) => 160 - Math.log10(Math.max(1, t)) / 6 * 150;
  return (
    <div>
      <Frame>
        A toy model of the race. The CPU has <b style={{ color: C.orange }}>8 fast cores</b> (1 time unit per item). The GPU has
        <b style={{ color: C.green }}> 2,560 slower cores</b> (20 units per item) and a fixed <b style={{ color: C.yellow }}>start-up cost of 200</b> to send work
        and data over. Drag the number of independent items.
      </Frame>
      <Slider label={<>Items = <b style={{ color: C.accent }}>{n.toLocaleString("en-IN")}</b></>} value={e} min={0} max={7} step={0.05} onChange={setE} />
      <svg viewBox="0 0 520 180" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <polyline fill="none" stroke={C.orange} strokeWidth="2.5" points={pts.map((v) => `${X(v)},${Y(Math.ceil(10 ** v / 8))}`).join(" ")} />
        <polyline fill="none" stroke={C.green} strokeWidth="2.5" points={pts.map((v) => `${X(v)},${Y(200 + Math.ceil(10 ** v / 2560) * 20)}`).join(" ")} />
        <line x1={X(Math.max(1, e))} y1="10" x2={X(Math.max(1, e))} y2="165" stroke={C.accent} strokeDasharray="4 3" />
        <text x="36" y="22" fill={C.orange} fontSize="11">CPU</text><text x="36" y="36" fill={C.green} fontSize="11">GPU</text>
        <text x="440" y="176" fill={C.muted} fontSize="10">items (log) →</text>
      </svg>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="CPU TIME" value={cpu.toLocaleString("en-IN")} color={C.orange} />
        <Stat label="GPU TIME" value={gpu.toLocaleString("en-IN")} color={C.green} />
        <Stat label="WINNER" value={cpu < gpu ? "CPU" : `GPU, ${(cpu / gpu).toFixed(1)}× faster`} color={cpu < gpu ? C.orange : C.green} />
      </div>
      <Insight color={C.yellow} title="Small jobs: the CPU wins. Big parallel jobs: the GPU wins by miles.">
        The GPU's start-up cost (sending data and work across, Module 4) means tiny jobs aren't worth it. In Lab 2 you'll find the real
        crossover on Colab's T4.
      </Insight>
      <LabCard part="A" title="Meet your GPU"
        what="Switch Colab to a T4 GPU, check that PyTorch can see it, read its name, memory and number of streaming multiprocessors, and run nvidia-smi, the GPU's 'task manager'."
        expect="'Tesla T4', about 15 GB of memory, 40 multiprocessors, and an nvidia-smi table." />
    </div>
  );
}

const QUESTIONS = [
  { q: "'Latency' means…", options: ["How many jobs finish per second", "How long one job takes from start to finish", "How much memory a job uses", "How many cores a chip has"], answer: 1, explain: "Latency = time for one job. Throughput = jobs completed per unit time." },
  { q: "A CPU devotes much of its chip area to…", options: ["Thousands of simple ALUs", "Control logic and large caches that make one thread fast", "Only memory", "Graphics output"], answer: 1, explain: "Branch prediction, out-of-order execution and big caches make one thread fast (low latency). That takes area away from raw ALUs." },
  { q: "For which job would a CPU likely beat a GPU?", options: ["Multiplying two 4000 × 4000 matrices", "Applying ReLU to 10 crore numbers", "Adding two numbers once", "Training an image model"], answer: 2, explain: "One tiny task can't use thousands of cores, and the GPU's start-up cost (sending the work over) dominates. The CPU finishes first." },
  { q: "Colab's T4 GPU has 2,560 CUDA cores; a laptop CPU has about 8. Yet each GPU core is…", options: ["Faster than a CPU core", "Slower and simpler than a CPU core", "Identical to a CPU core", "Not able to do arithmetic"], answer: 1, explain: "GPU cores are simple and individually slow. Their strength is numbers: high throughput, not low latency." },
];
const RESULT = {
  perfect: "Perfect! You know the two kinds of 'fast'.",
  good: "Good. Replay 'The Race' and find the crossover point.",
  low: "Revisit 'Latency vs Throughput': car vs bus is the key picture.",
  done: "Unit 2.1 Complete!",
  body: "You can explain latency vs throughput and why CPUs and GPUs spend their transistors so differently.",
  next: "Next up: Unit 2.2 — Why Clocks Stopped Getting Faster.",
  teaser: "Why not just make the CPU core faster and faster? Physics said no, around 2005.",
};

const UNIT_WORDS = [
  ["CPU", "Central Processing Unit", "The main processor: a few powerful cores, built for low latency.", "from COA"],
  ["GPU", "Graphics Processing Unit", "Built for graphics, now for AI: thousands of simple cores, built for throughput.", "new here"],
  ["ALU", "Arithmetic Logic Unit", "The part that actually does arithmetic.", "from COA"],
  ["CUDA core", "an NVIDIA GPU's basic arithmetic unit", "NVIDIA's name for one simple ALU lane. CUDA = Compute Unified Device Architecture.", "new here"],
  ["L1/L2/L3", "cache levels 1, 2, 3", "Small, fast memories near the core (COA Unit 4).", "from COA"],
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
    { id: "s0", label: "One Expert or 1000?" },
    { id: "s1", label: "Latency vs Throughput" },
    { id: "s2", label: "Where Transistors Go" },
    { id: "s3", label: "The Race" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>👩‍🏫 One Expert or a Thousand Students?</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🚗🚌 Latency vs Throughput — car or bus?</h3><DefineWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔬 Where the Transistors Go — CPU vs GPU chips</h3><DieWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🏁 The Race — when does the GPU win?</h3><RaceWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 2.1.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚔️</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 2 › UNIT 2.1</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Latency vs Throughput</div>
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
