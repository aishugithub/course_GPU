import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab3_Inside_a_GPU.ipynb";

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

const TEXTBOOK = "Kirk & Hwu Ch 4 (Latency tolerance) · Hamacher §12.1 (Hardware multithreading)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// Discrete warp-scheduler simulation: each warp computes C cycles, then waits L cycles for memory, repeat.
function simulate(nWarps, C, L, T) {
  const ready = Array(nWarps).fill(0), left = Array(nWarps).fill(C);
  const grid = Array.from({ length: nWarps }, () => Array(T).fill(0)); // 0 idle/ready, 1 computing, 2 waiting
  let busy = 0, rr = 0;
  for (let t = 0; t < T; t++) {
    let issued = -1;
    for (let k = 0; k < nWarps; k++) { const w = (rr + k) % nWarps; if (ready[w] <= t) { issued = w; break; } }
    for (let w = 0; w < nWarps; w++) grid[w][t] = ready[w] > t ? 2 : 0;
    if (issued >= 0) {
      grid[issued][t] = 1; busy++; left[issued]--;
      if (left[issued] === 0) { ready[issued] = t + 1 + L; left[issued] = C; rr = (issued + 1) % nWarps; }
    }
  }
  return { grid, util: busy / T };
}

// ── Section 1: Need — one warp spends its life waiting ──
function NeedWidget() {
  const L = 400, Cc = 4;
  return (
    <div>
      <Frame>
        Reading from the GPU's main memory (GDDR6) takes roughly <b style={{ color: C.text }}>400–800 clock cycles</b>. A typical AI step does a few
        cycles of arithmetic, then needs the next data. If an SM ran just ONE warp, this is what its cores would do:
      </Frame>
      <div style={{ display: "flex", height: 30, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
        {Array.from({ length: 3 }, (_, k) => (
          <div key={k} style={{ display: "flex", flex: Cc + L }}>
            <div style={{ flex: Cc, background: C.green }} />
            <div style={{ flex: L, background: C.red + "44", display: "flex", alignItems: "center", justifyContent: "center", color: C.red, fontSize: 11 }}>waiting for memory…</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="CYCLES COMPUTING" value={`${Cc} of every ${Cc + L}`} color={C.green} />
        <Stat label="CORES BUSY" value={`${((Cc / (Cc + L)) * 100).toFixed(1)}%`} color={C.red} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <div style={{ background: C.card, borderRadius: 8, padding: 10, border: `1.5px solid ${C.orange}` }}><b style={{ color: C.orange, fontSize: 12.5 }}>CPU's answer</b><div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>Huge caches so the data is usually nearby, plus out-of-order execution to find other work in the same thread (COA).</div></div>
        <div style={{ background: C.card, borderRadius: 8, padding: 10, border: `1.5px solid ${C.green}` }}><b style={{ color: C.green, fontSize: 12.5 }}>GPU's answer</b><div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>Small caches. Instead, keep MANY warps ready, and when one waits, instantly run another. Next section.</div></div>
      </div>
      <Insight color={C.red} title="With one warp, the GPU's cores would sit idle 99% of the time.">
        Memory is slow compared with arithmetic, on every computer. The question is how a chip avoids waiting for it.
      </Insight>
    </div>
  );
}

// ── Section 2: Juggle many warps ──
function JuggleWidget() {
  const [n, setN] = useState(4);
  const [L, setL] = useState(40);
  const Cc = 4, T = 120;
  const { grid, util } = simulate(n, Cc, L, T);
  return (
    <div>
      <Frame>
        A tea master with one cup stands around while it brews. With 12 cups on the go, he's never idle: pour, add milk, serve, back to the first.
        The <b style={{ color: C.text }}>warp scheduler</b> does this every clock cycle: if the current warp is waiting for memory, it issues an instruction from
        another warp that's ready. Add warps and watch the core's busy time fill up. (Small numbers, so it fits on screen.)
      </Frame>
      <Slider label={<>Warps resident on the SM = <b style={{ color: C.green }}>{n}</b></>} value={n} min={1} max={16} onChange={setN} color={C.green} />
      <Slider label={<>Memory latency = <b style={{ color: C.red }}>{L}</b> cycles (compute = {Cc} cycles between loads)</>} value={L} min={8} max={80} step={4} onChange={setL} color={C.red} />
      <div style={{ background: C.card, borderRadius: 8, padding: 8, border: `1px solid ${C.border}` }}>
        {grid.map((row, w) => (
          <div key={w} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <div style={{ width: 52, color: C.muted, fontSize: 10, fontFamily: "monospace" }}>warp {w}</div>
            <div style={{ display: "flex", flex: 1, height: 9 }}>{row.map((v, t) => <div key={t} style={{ flex: 1, background: v === 1 ? C.green : v === 2 ? C.red + "55" : "transparent" }} />)}</div>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <div style={{ width: 52, color: C.text, fontSize: 10, fontFamily: "monospace" }}>core</div>
          <div style={{ display: "flex", flex: 1, height: 12 }}>{Array.from({ length: T }, (_, t) => <div key={t} style={{ flex: 1, background: grid.some((r) => r[t] === 1) ? C.green : C.border }} />)}</div>
        </div>
      </div>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 4 }}>■ green = computing · ■ red = waiting for memory · core row = is anyone using the core this cycle?</div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="CORE BUSY" value={`${(util * 100).toFixed(0)}%`} color={util > 0.9 ? C.green : util > 0.5 ? C.yellow : C.red} />
        <Stat label="WARPS NEEDED TO HIDE IT ≈ (C + L) / C" value={Math.ceil((Cc + L) / Cc)} color={C.purple} />
      </div>
      <Insight color={C.green} title="The GPU doesn't avoid the wait. It fills it with other warps' work.">
        With enough warps, someone is always ready to compute while others wait for memory. This is <b>latency hiding</b>, and it's why GPUs want
        thousands of threads, many more than there are cores.
      </Insight>
    </div>
  );
}

// ── Section 3: Why switching is free on a GPU ──
function SwitchWidget() {
  const [mode, setMode] = useState("gpu");
  return (
    <div>
      <Frame>
        When an operating system switches a CPU core from one thread to another, it must <b style={{ color: C.orange }}>save</b> all the old thread's registers to memory
        and <b style={{ color: C.orange }}>load</b> the new one's: thousands of cycles. A GPU switches warps <b style={{ color: C.green }}>every cycle for free</b>. How?
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Btn ghost={mode !== "cpu"} onClick={() => setMode("cpu")} color={C.orange}>CPU thread switch</Btn>
        <Btn ghost={mode !== "gpu"} onClick={() => setMode("gpu")} color={C.green}>GPU warp switch</Btn>
      </div>
      {mode === "cpu" ? (
        <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `1.5px solid ${C.orange}` }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 12.5, color: C.text }}>
            <div style={{ border: `1px solid ${C.orange}`, borderRadius: 6, padding: 8 }}>one register set<br /><span style={{ color: C.muted }}>(thread A's values)</span></div>
            <span style={{ color: C.orange }}>→ save to memory →</span>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: 8 }}>RAM</div>
            <span style={{ color: C.orange }}>→ load thread B →</span>
            <div style={{ border: `1px solid ${C.orange}`, borderRadius: 6, padding: 8 }}>same register set<br /><span style={{ color: C.muted }}>(now thread B's)</span></div>
          </div>
          <div style={{ color: C.muted, fontSize: 12.5, marginTop: 10 }}>A CPU core has registers for one or two threads (Hamacher §12.1: hardware multithreading usually keeps 2). Switching beyond that goes through memory: slow, so the OS does it only every few milliseconds.</div>
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `1.5px solid ${C.green}` }}>
          <div style={{ color: C.text, fontSize: 12.5, marginBottom: 6 }}>Register file of one SM: every resident warp has its OWN registers, all the time.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 3 }}>
            {Array.from({ length: 32 }, (_, i) => <div key={i} style={{ height: 22, borderRadius: 3, background: i === 5 ? C.green : C.teal + "33", border: `1px solid ${i === 5 ? C.green : C.teal + "66"}`, fontSize: 8.5, color: i === 5 ? "#0D1117" : C.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>w{i}</div>)}
          </div>
          <div style={{ color: C.muted, fontSize: 12.5, marginTop: 10 }}>Switching from warp 5 to warp 6 just means "read your operands from a different part of the register file": nothing is saved or loaded. That's why the register file is so big (256 KB per SM, Unit 3.1).</div>
        </div>
      )}
      <Insight color={C.teal} title="GPUs are hardware multithreading taken to the extreme.">
        Hamacher §12.1 describes CPUs that keep 2 threads' registers to switch quickly. An SM keeps up to 32 warps × 32 threads = 1,024 threads'
        registers on-chip, so it can switch every single cycle.
      </Insight>
    </div>
  );
}

// ── Section 4: Occupancy ──
function OccWidget() {
  const [regs, setRegs] = useState(32);
  const [Cc, setCc] = useState(20);
  const L = 400;
  const byRegs = Math.floor(65536 / (regs * 32));
  const warps = Math.min(32, byRegs);
  const occ = warps / 32;
  const util = Math.min(1, (warps * Cc) / (Cc + L));
  return (
    <div>
      <Frame>
        How many warps can live on an SM at once? On the T4, at most <b style={{ color: C.text }}>32 warps</b>, and they must all fit in the
        <b style={{ color: C.text }}> 65,536 registers</b>. A kernel that uses many registers per thread leaves room for fewer warps. The fraction of the 32
        slots in use is called <b style={{ color: C.purple }}>occupancy</b>.
      </Frame>
      <Slider label={<>Registers per thread = <b style={{ color: C.teal }}>{regs}</b></>} value={regs} min={16} max={255} onChange={setRegs} color={C.teal} />
      <Slider label={<>Arithmetic cycles between memory loads = <b style={{ color: C.green }}>{Cc}</b> (memory latency fixed at {L})</>} value={Cc} min={2} max={100} onChange={setCc} color={C.green} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(32, 1fr)", gap: 2 }}>
        {Array.from({ length: 32 }, (_, i) => <div key={i} style={{ height: 18, borderRadius: 2, background: i < warps ? C.purple : C.card, border: `1px solid ${C.border}` }} />)}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="WARPS THAT FIT" value={`${warps} / 32`} color={C.purple} />
        <Stat label="OCCUPANCY" value={`${(occ * 100).toFixed(0)}%`} color={C.purple} />
        <Stat label="CORE BUSY (MODEL)" value={`${(util * 100).toFixed(0)}%`} color={util > 0.9 ? C.green : util > 0.5 ? C.yellow : C.red} />
      </div>
      <Insight color={C.purple} title="More resident warps means more latency hiding, up to the point where the core is always busy.">
        Kernels with lots of arithmetic per memory load need fewer warps; memory-heavy kernels need many. Unit 5.3 turns this into a rule:
        compute-bound vs memory-bound.
      </Insight>
      <LabCard part="C" title="Watch latency hiding work"
        what="Run a simple memory-copy kernel while launching more and more threads, measure the bandwidth each time, and plot it."
        expect="bandwidth climbs steeply as threads are added, then levels off once there are enough warps to hide memory latency." />
    </div>
  );
}

const QUESTIONS = [
  { q: "How does a GPU mainly cope with slow memory?", options: ["Very large caches like a CPU", "Switching to another ready warp while one waits", "Running at a higher clock speed", "Avoiding memory completely"], answer: 1, explain: "Latency hiding: the warp scheduler issues work from other warps while some wait for memory." },
  { q: "Compute takes 4 cycles between loads, and memory latency is 60 cycles. About how many warps are needed to keep the core busy?", options: ["1", "4", "16", "64"], answer: 2, explain: "(C + L) / C = (4 + 60) / 4 = 16 warps." },
  { q: "Why can a GPU switch between warps every cycle for free?", options: ["It saves registers very fast", "Each resident warp keeps its own registers in the large register file, so nothing is saved or loaded", "Warps share one set of registers", "The CPU does the switching"], answer: 1, explain: "All resident warps' registers stay on-chip; switching just changes which warp's registers are used." },
  { q: "A kernel uses 128 registers per thread. On an SM with 65,536 registers, how many warps (of 32 threads) fit?", options: ["8", "16", "32", "64"], answer: 1, explain: "65,536 ÷ (128 × 32) = 16 warps, so occupancy is 16/32 = 50%." },
];
const RESULT = {
  perfect: "Perfect! You understand the GPU's secret weapon.",
  good: "Good. Replay 'Juggle the Warps' with long latencies.",
  low: "Revisit 'Juggle the Warps': many warps hide the wait.",
  done: "Unit 3.3 Complete!",
  body: "You can explain memory latency, latency hiding by warp switching, why it's free on a GPU, and occupancy.",
  next: "Next up: Unit 3.4 — GPU Memory & Bandwidth.",
  teaser: "65 TFLOPS is useless if the numbers can't arrive fast enough. Meet the GPU's memory hierarchy.",
};

const UNIT_WORDS = [
  ["latency", "waiting time", "How long one memory request takes to come back.", "from Unit 2.1"],
  ["GDDR6", "Graphics Double Data Rate 6", "The T4's main (global) memory.", "from Unit 3.1"],
  ["OS", "Operating System", "Windows, Linux, Android… It schedules threads on CPU cores.", "new here"],
  ["occupancy", "warps resident ÷ maximum warps", "How full an SM's warp slots are.", "new here"],
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

export default function Unit3_3({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "Waiting for Memory" },
    { id: "s1", label: "Juggle the Warps" },
    { id: "s2", label: "Free Switching" },
    { id: "s3", label: "Occupancy" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>⏳ Waiting for Memory — one warp's lonely life</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🫖 Juggle the Warps — the tea master's trick</h3><JuggleWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔁 Free Switching — why the register file is huge</h3><SwitchWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📊 Occupancy — how many warps fit?</h3><OccWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 3.3.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🫖</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 3 › UNIT 3.3</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Hiding Latency</div>
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
