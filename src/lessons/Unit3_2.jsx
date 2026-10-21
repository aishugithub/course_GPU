import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab03_CPU_vs_GPU.ipynb";

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
      <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>🧪 TRY IT FOR REAL — LAB 3 · PART {part}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{what}</div>
      <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}><b style={{ color: C.green }}>You should see:</b> {expect}</div>
      <a href={LAB_URL} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", borderRadius: 8, background: C.orange, color: "#0D1117", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Open Lab 3 in Colab ↗</a>
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

const TEXTBOOK = "H&P Ch 1 (Trends in power and energy) · Stallings §2.1 (Designing for performance)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// Approximate top desktop CPU clock (GHz) and transistor counts, for illustration
const CLOCK = [[1990, 0.033], [1993, 0.066], [1995, 0.133], [1997, 0.3], [1999, 0.6], [2000, 1.0], [2002, 2.8], [2004, 3.8], [2006, 3.0], [2008, 3.2], [2010, 3.5], [2013, 3.9], [2016, 4.2], [2019, 4.7], [2022, 5.5], [2025, 5.7]];
const TRANS = [[1990, 1.2e6], [1995, 5.5e6], [2000, 4.2e7], [2005, 2.3e8], [2010, 1.2e9], [2015, 5e9], [2020, 1.6e10], [2025, 1e11]];

// ── Section 1: Need — the curve that went flat ──
function NeedWidget() {
  const [yr, setYr] = useState(2004);
  const X = (y) => 40 + ((y - 1990) / 35) * 460, Y = (g) => 170 - (g / 6) * 150;
  const cur = CLOCK.filter((c) => c[0] <= yr).slice(-1)[0];
  const trend = 0.033 * Math.pow(2, (yr - 1990) / 2.2);
  return (
    <div>
      <Frame>
        For 15 years every new CPU had a faster clock: programs got quicker for free, just by buying a new computer. Drag through the years and
        watch what happened around 2005. (Approximate top desktop clock speeds.)
      </Frame>
      <Slider label={<>Year = <b style={{ color: C.accent }}>{yr}</b></>} value={yr} min={1990} max={2025} onChange={setYr} />
      <svg viewBox="0 0 520 190" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        {[0, 2, 4, 6].map((g) => <g key={g}><line x1="40" x2="510" y1={Y(g)} y2={Y(g)} stroke={C.border} /><text x="8" y={Y(g) + 4} fill={C.muted} fontSize="10">{g} GHz</text></g>)}
        <polyline fill="none" stroke={C.yellow} strokeDasharray="5 4" strokeWidth="1.5" points={Array.from({ length: 30 }, (_, i) => 1990 + i).filter((y) => 0.033 * Math.pow(2, (y - 1990) / 2.2) < 6.2).map((y) => `${X(y)},${Y(0.033 * Math.pow(2, (y - 1990) / 2.2))}`).join(" ")} />
        <polyline fill="none" stroke={C.accent} strokeWidth="2.5" points={CLOCK.filter((c) => c[0] <= yr).map(([y, g]) => `${X(y)},${Y(g)}`).join(" ")} />
        {[1990, 2000, 2010, 2020].map((y) => <text key={y} x={X(y)} y="185" fill={C.muted} fontSize="10" textAnchor="middle">{y}</text>)}
        <text x="300" y="30" fill={C.yellow} fontSize="10">- - if the old trend had continued</text>
      </svg>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label={`CLOCK IN ${yr}`} value={`≈ ${cur[1]} GHz`} color={C.accent} />
        <Stat label="OLD TREND WOULD PREDICT" value={trend > 100 ? `${(trend / 1000).toFixed(1)} THz 🤯` : `${trend.toFixed(1)} GHz`} color={C.yellow} />
      </div>
      {yr >= 2010 && (
        <Insight color={C.red} title="Since about 2005, clock speeds have hardly moved.">
          If the trend had continued, today's chips would run at over a thousand GHz. They run at around 5. Something stopped them, and it wasn't
          a lack of transistors.
        </Insight>
      )}
    </div>
  );
}

// ── Section 2: The power wall ──
function PowerWidget() {
  const [f, setF] = useState(3);
  const V = 0.6 + 0.15 * f;                  // a faster clock needs a higher voltage (simplified)
  const P = 4 * V * V * f;                   // dynamic power ∝ C·V²·f   (C chosen so 3 GHz ≈ 1.1² × 3 × 4 ≈ 13 → scaled below)
  const watts = P * 8;
  const state = watts < 130 ? ["😎 Cool with a normal fan", C.green] : watts < 250 ? ["🥵 Needs a huge cooler", C.yellow] : ["🔥 Melts. No practical cooling.", C.red];
  return (
    <div>
      <Frame>
        Every time a transistor switches, it uses a little energy. The power a chip burns is roughly
        <b style={{ color: C.text }}> P ∝ C · V² · f</b>: capacitance × voltage² × frequency. The catch: running at a higher frequency needs a higher
        voltage too. Turn up the clock.
      </Frame>
      <Slider label={<>Clock frequency = <b style={{ color: C.accent }}>{f} GHz</b></>} value={f} min={1} max={10} step={0.5} onChange={setF} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="VOLTAGE NEEDED (SIMPLIFIED)" value={`${V.toFixed(2)} V`} color={C.purple} />
        <Stat label="POWER (ILLUSTRATIVE)" value={`${watts.toFixed(0)} W`} color={state[1]} />
      </div>
      <div style={{ marginTop: 12, height: 24, background: C.card, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
        <div style={{ width: `${Math.min(100, watts / 5)}%`, height: "100%", background: `linear-gradient(90deg, ${C.green}, ${C.yellow}, ${C.red})` }} />
      </div>
      <div style={{ marginTop: 8, color: state[1], fontWeight: 700, fontSize: 13 }}>{state[0]}</div>
      <div style={{ color: C.muted, fontSize: 12.5, marginTop: 6 }}>Double the clock and the power more than doubles, because V goes up as well and it's squared. All that power leaves the chip as heat through a surface the size of a fingernail.</div>
      <Insight color={C.red} title="This is the 'power wall': chips got too hot to clock faster.">
        Around 4 GHz, the heat per square centimetre of a CPU was already getting close to that of a hot plate. Cooling, not transistors,
        became the limit.
      </Insight>
    </div>
  );
}

// ── Section 3: Transistors kept coming — how to spend them? ──
const SPEND = [
  { k: "cache", t: "Even bigger caches", res: "Helps a little: the core waits for memory less often. But a cache can't do arithmetic.", gain: 1.2, c: C.teal },
  { k: "smart", t: "Even smarter control for one core", res: "Diminishing returns: the clever tricks (deeper pipelines, more prediction) were already squeezed dry, and they cost power.", gain: 1.1, c: C.purple },
  { k: "cores", t: "More cores on one chip", res: "Big win IF the software has parallel work: 8 cores can do 8 things at once. This is the 'multicore' era (Hamacher Ch 12).", gain: 6, c: C.orange },
  { k: "many", t: "Thousands of tiny, simple cores", res: "Huge win for perfectly parallel work like matrix multiplies: the GPU approach.", gain: 50, c: C.green },
];
function SpendWidget() {
  const [k, setK] = useState(null);
  const yr = 2025;
  const X = (y) => 40 + ((y - 1990) / 35) * 460, Y = (t) => 150 - (Math.log10(t) - 6) / 5.2 * 130;
  const s = SPEND.find((x) => x.k === k);
  return (
    <div>
      <Frame>
        Clock speeds stalled, but transistor counts kept doubling about every two years (Moore's law). Chip designers suddenly had billions of
        spare transistors. You're the chip architect: how would you spend them?
      </Frame>
      <svg viewBox="0 0 520 170" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <polyline fill="none" stroke={C.green} strokeWidth="2.5" points={TRANS.map(([y, t]) => `${X(y)},${Y(t)}`).join(" ")} />
        {TRANS.map(([y, t]) => <circle key={y} cx={X(y)} cy={Y(t)} r="3.5" fill={C.green} />)}
        {[1990, 2000, 2010, 2020].map((y) => <text key={y} x={X(y)} y="166" fill={C.muted} fontSize="10" textAnchor="middle">{y}</text>)}
        <text x="44" y="18" fill={C.green} fontSize="11">transistors per chip (log scale): 1 million → 100 billion (approx.)</text>
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
        {SPEND.map((x) => <Btn key={x.k} ghost={k !== x.k} onClick={() => setK(x.k)} color={x.c}>{x.t}</Btn>)}
      </div>
      {s && (
        <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: s.c + "14", border: `1px solid ${s.c}55` }}>
          <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{s.res}</div>
          <div style={{ marginTop: 6, fontFamily: "monospace", color: s.c, fontSize: 13 }}>speed-up on AI-style parallel work: ≈ {s.gain}× (illustrative)</div>
        </div>
      )}
      <Insight color={C.green} title="The industry went wide instead of fast.">
        CPUs became multicore. GPUs, already built from many simple cores for graphics, turned out to be ideal for AI's matrix multiplies.
      </Insight>
    </div>
  );
}

// ── Section 4: Many slow cores beat one fast core on power ──
function ManyWidget() {
  const [n, setN] = useState(1);
  const f = 4 / n;                                   // share 4 GHz-worth of work across n cores
  const V = 0.6 + 0.15 * f;
  const P1 = V * V * f;                              // per core, relative
  const total = n * P1;
  const base = (0.6 + 0.6) ** 2 * 4;
  return (
    <div>
      <Frame>
        Here's why going wide works. Take a job that needs "4 GHz worth" of work per second. Split it over n cores, each running at 4/n GHz, so
        the total work done is the same. Each slower core can also use a lower voltage. Watch the total power.
      </Frame>
      <Slider label={<>Cores = <b style={{ color: C.green }}>{n}</b>, each at <b style={{ color: C.accent }}>{f.toFixed(2)} GHz</b></>} value={n} min={1} max={64} onChange={setN} color={C.green} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 10 }}>
        {Array.from({ length: n }, (_, i) => <div key={i} style={{ width: 16, height: 16, borderRadius: 3, background: C.green, opacity: 0.4 + 0.6 * Math.min(1, f / 4) }} />)}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="TOTAL WORK DONE" value="same (4 GHz-worth)" color={C.accent} />
        <Stat label="TOTAL POWER vs 1 FAST CORE" value={`${((total / base) * 100).toFixed(0)}%`} color={total / base < 0.5 ? C.green : C.yellow} />
      </div>
      <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Simplified model: power ∝ V² × f, with voltage dropping as frequency drops (down to a minimum). Real chips differ, but the trend is real.</div>
      <Insight color={C.green} title="Many slow cores do the same work for a fraction of the power, as long as the work is parallel.">
        That's the GPU bargain: thousands of modest cores at about 1–2 GHz. And from Unit 2.3 you know AI's work is exactly the parallel kind.
      </Insight>
      <LabCard part="B" title="Read your GPU's clock and power"
        what="Ask nvidia-smi for the T4's clock speed, power draw and power limit, and compare them with a typical CPU's clock speed."
        expect="a GPU clock of roughly 0.6–1.6 GHz (slower than a CPU core!) and a power limit of about 70 W." />
    </div>
  );
}

const QUESTIONS = [
  { q: "Why did CPU clock speeds stop rising around 2005?", options: ["Transistors stopped getting smaller", "Power and heat rose too steeply with frequency (the power wall)", "Programs didn't need more speed", "Intel ran out of silicon"], answer: 1, explain: "Dynamic power ∝ C·V²·f, and a higher f needs a higher V. The heat became impossible to remove from a small chip." },
  { q: "In P ∝ C·V²·f, doubling the voltage V (keeping everything else fixed) makes power…", options: ["Double", "Four times larger", "Halve", "Unchanged"], answer: 1, explain: "V is squared: (2V)² = 4V²." },
  { q: "After clocks stalled, what did chip designers mostly do with the extra transistors?", options: ["Left them unused", "Put more cores on each chip", "Made bigger clocks", "Removed caches"], answer: 1, explain: "Multicore CPUs, and GPUs with thousands of simple cores: going wide instead of fast." },
  { q: "Spreading the same work over many slower cores saves power because…", options: ["Slow cores do no work", "Lower frequency allows lower voltage, and power falls faster than speed", "Cores share one power supply", "GPUs don't use electricity"], answer: 1, explain: "With V able to drop as f drops, total power falls well below a single fast core's, for the same total work (if the work is parallel)." },
];
const RESULT = {
  perfect: "Perfect! You know why the whole industry went parallel.",
  good: "Good. Replay 'The Power Wall' and push the clock to 10 GHz.",
  low: "Revisit 'The Flat Line' and 'The Power Wall': the reason GPUs matter starts there.",
  done: "Unit 3.2 Complete!",
  body: "You can explain the power wall, P ∝ C·V²·f, and why many slow cores are the energy-efficient way to get throughput.",
  next: "Next up: Unit 3.3 — SIMD → SIMT.",
  teaser: "One instruction, many data. From the CPU's vector units to the GPU's thousands of threads.",
};

const UNIT_WORDS = [
  ["GHz", "gigahertz", "10⁹ clock ticks per second.", "from COA"],
  ["P ∝ C·V²·f", "dynamic power", "Power grows with capacitance (C), voltage squared (V²) and frequency (f). ∝ means 'proportional to'.", "new here"],
  ["W", "watt", "Unit of power. A phone charger uses about 20 W; a big CPU 100–250 W.", "new here"],
  ["Moore's law", "Gordon Moore's observation (1965)", "Transistors per chip double roughly every two years.", "new here"],
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

export default function Unit3_2({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "The Flat Line" },
    { id: "s1", label: "The Power Wall" },
    { id: "s2", label: "Spend the Transistors" },
    { id: "s3", label: "Many Slow > One Fast" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📉 The Flat Line — what happened in 2005?</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔥 The Power Wall — P ∝ C·V²·f</h3><PowerWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🧮 Spend the Transistors — you're the architect</h3><SpendWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🐜 Many Slow Cores Beat One Fast Core</h3><ManyWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 3.2.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔥</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 3 › UNIT 3.2</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Why Clocks Stopped Getting Faster</div>
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
