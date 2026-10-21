import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab4_CPU_GPU_Teamwork.ipynb";

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

const TEXTBOOK = "Kirk & Hwu Ch 2 · Hamacher Ch 3 (Interrupts: the same 'start it and carry on' idea)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// ── Section 1: Need — the impossible timing ──
function NeedWidget() {
  const [synced, setSynced] = useState(false);
  return (
    <div>
      <Frame>
        A student times a 4096 × 4096 matrix multiply on the T4: 137 billion FLOPs. The stopwatch says <b style={{ color: C.red }}>0.03 ms</b>, which would be
        4,500 TFLOPS, about 70× the GPU's peak. Something is wrong. Toggle the fix.
      </Frame>
      <Btn onClick={() => setSynced((v) => !v)} color={synced ? C.green : C.red}>{synced ? "◀ Show the wrong timing" : "▶ Add synchronisation"}</Btn>
      <div style={{ marginTop: 12 }}>
        <Code color={synced ? C.green : C.red} title={synced ? "✅ CORRECT TIMING" : "❌ WRONG TIMING"}>{synced ? `torch.cuda.synchronize()          # wait for earlier GPU work
t0 = time.perf_counter()
c = a @ b                         # launch
torch.cuda.synchronize()          # WAIT until the GPU has finished
t1 = time.perf_counter()
print((t1 - t0) * 1000, "ms")     # ≈ 30 ms  →  ≈ 4.5 TFLOPS  ✓` : `t0 = time.perf_counter()
c = a @ b                         # launch
t1 = time.perf_counter()
print((t1 - t0) * 1000, "ms")     # 0.03 ms ?!`}</Code>
      </div>
      <Insight color={synced ? C.green : C.red} title={synced ? "Now the stopwatch waits for the GPU, and the number is believable." : "The stopwatch measured how long it took to GIVE the order, not to DO the work."}>
        A GPU launch is <b>asynchronous</b>: the CPU drops the job into the GPU's queue and moves straight on, without waiting. This unit explains the
        queue, and why it's a feature, not a bug.
      </Insight>
    </div>
  );
}

// ── Section 2: The command queue ──
const CMDS = ["copy x → GPU", "matmul", "relu", "matmul", "softmax", "copy result → CPU"];
function QueueWidget() {
  const [t, setT] = useState(0);
  const issued = Math.min(CMDS.length, t * 2);       // the CPU issues fast
  const done = Math.max(0, Math.min(CMDS.length, t - 1));  // the GPU finishes one per tick, after a delay
  const cpuWaiting = t >= 3 && done < CMDS.length;
  return (
    <div>
      <Frame>
        Like ordering at a busy restaurant: you hand over your order slip and go back to your table; the kitchen works through the slips
        in order. The CPU puts GPU commands into a queue (CUDA calls it a <b style={{ color: C.accent }}>stream</b>) and carries on. Step through time.
      </Frame>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: C.card, borderRadius: 10, padding: 10, border: `1.5px solid ${C.orange}` }}>
          <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>🧠 CPU (host)</div>
          {CMDS.map((c, i) => <div key={i} style={{ fontFamily: "monospace", fontSize: 11.5, color: i < issued ? C.text : C.border }}>{i < issued ? "✓ queued: " : "   "}{c}</div>)}
          <div style={{ fontFamily: "monospace", fontSize: 11.5, marginTop: 6, color: cpuWaiting ? C.red : t >= 3 ? C.green : C.border }}>{t < 3 ? "" : cpuWaiting ? "⏳ print(result) → must WAIT" : "✓ print(result)"}</div>
        </div>
        <div style={{ background: C.card, borderRadius: 10, padding: 10, border: `1.5px solid ${C.green}` }}>
          <div style={{ color: C.green, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>⚡ GPU queue (stream)</div>
          {CMDS.map((c, i) => <div key={i} style={{ fontFamily: "monospace", fontSize: 11.5, color: i < done ? C.green : i === done && i < issued ? C.yellow : i < issued ? C.text : C.border }}>{i < done ? "✓ done:    " : i === done && i < issued ? "▶ running: " : i < issued ? "  waiting: " : "   "}{c}</div>)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Btn onClick={() => setT((v) => Math.min(8, v + 1))}>Time ▶ ({t})</Btn>
        <Btn ghost onClick={() => setT(0)}>↺ Reset</Btn>
      </div>
      <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8, lineHeight: 1.6 }}>
        {t === 0 ? "Press Time." : t < 3 ? "The CPU races ahead, queuing commands much faster than the GPU runs them." : cpuWaiting ? "The CPU needs an actual VALUE (to print it), so it has to wait for the queue to finish: a synchronisation point." : "Everything finished; the CPU got its value."}
      </div>
      <Insight color={C.accent} title="Launches return immediately. The CPU only waits when it needs a result.">
        Like the interrupt-driven I/O in COA (Hamacher Ch 3): start the device, carry on with other work, and get notified when it's done,
        instead of standing over the device.
      </Insight>
    </div>
  );
}

// ── Section 3: Overlap is the payoff ──
function OverlapWidget() {
  const [mode, setMode] = useState("serial");
  const steps = 5, prep = 6, gpu = 8;
  const serial = steps * (prep + gpu);
  const overlap = prep + steps * Math.max(prep, gpu);
  const T = mode === "serial" ? serial : overlap;
  const X = (v) => (v / serial) * 100;
  return (
    <div>
      <Frame>
        Because launches don't wait, the CPU can prepare the <b style={{ color: C.orange }}>next batch</b> (load and decode images) while the GPU is still training on the
        <b style={{ color: C.green }}> current</b> one. Compare doing them one after the other with overlapping them.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Btn ghost={mode !== "serial"} onClick={() => setMode("serial")} color={C.red}>One after the other</Btn>
        <Btn ghost={mode !== "overlap"} onClick={() => setMode("overlap")} color={C.green}>Overlapped</Btn>
      </div>
      {["CPU", "GPU"].map((lane) => (
        <div key={lane} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 40, color: lane === "CPU" ? C.orange : C.green, fontSize: 12, fontWeight: 700 }}>{lane}</div>
          <div style={{ position: "relative", flex: 1, height: 26, background: C.card, borderRadius: 4 }}>
            {Array.from({ length: steps }, (_, k) => {
              const start = mode === "serial" ? k * (prep + gpu) + (lane === "GPU" ? prep : 0) : lane === "CPU" ? k * Math.max(prep, gpu) : prep + k * Math.max(prep, gpu);
              const len = lane === "CPU" ? prep : gpu;
              return <div key={k} style={{ position: "absolute", left: `${X(start)}%`, width: `${X(len)}%`, top: 2, bottom: 2, background: lane === "CPU" ? C.orange : C.green, borderRadius: 3, fontSize: 9.5, color: "#0D1117", display: "flex", alignItems: "center", justifyContent: "center" }}>{lane === "CPU" ? `prep ${k + 1}` : `train ${k + 1}`}</div>;
            })}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="TOTAL TIME (5 BATCHES)" value={`${T} units`} color={mode === "serial" ? C.red : C.green} />
        <Stat label="GPU BUSY" value={`${Math.round((steps * gpu / T) * 100)}%`} color={mode === "serial" ? C.red : C.green} />
      </div>
      <Insight color={C.green} title="Overlap turns 'prep + train' into 'whichever is slower'.">
        This is what PyTorch's DataLoader does with <code>num_workers</code> (CPU processes preparing batches in the background) and
        <code> pin_memory=True</code> + <code>.to("cuda", non_blocking=True)</code> (copies that run while the GPU computes). It's Amdahl's law (Unit 2.4)
        fought with parallelism.
      </Insight>
    </div>
  );
}

// ── Section 4: Hidden synchronisation points ──
const LOOP = [
  { l: "for images, labels in loader:", sync: false, why: "Fine: loading happens on CPU workers." },
  { l: "    images = images.to('cuda', non_blocking=True)", sync: false, why: "With pinned memory, this copy is queued and doesn't make the CPU wait." },
  { l: "    loss = loss_fn(model(images), labels)", sync: false, why: "Kernel launches: queued, no waiting." },
  { l: "    loss.backward(); opt.step(); opt.zero_grad()", sync: false, why: "More launches: queued." },
  { l: "    total += loss.item()", sync: true, why: "SYNC! .item() needs the actual number on the CPU, so the CPU waits for ALL queued GPU work, every iteration." },
  { l: "    if torch.isnan(loss):", sync: true, why: "SYNC! A Python 'if' needs a real True/False, so the GPU result must be fetched." },
  { l: "    print(loss)", sync: true, why: "SYNC! Printing a GPU tensor copies it to the CPU." },
  { l: "    preds.append(model(images).cpu())", sync: true, why: "SYNC! .cpu() is a copy out, and it must wait for the result." },
];
function HiddenSyncWidget() {
  const [pick, setPick] = useState({});
  const found = LOOP.filter((x, i) => pick[i] && x.sync).length;
  return (
    <div>
      <Frame>
        Some innocent-looking lines force the CPU to stop and wait for the GPU, which kills the overlap. Click every line you think causes a
        synchronisation in this training loop.
      </Frame>
      <pre style={{ margin: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, fontFamily: "monospace", fontSize: 11.5, lineHeight: 1.6 }}>
        {LOOP.map((x, i) => {
          const p = pick[i];
          return (
            <div key={i} onClick={() => setPick((s) => ({ ...s, [i]: true }))} style={{ cursor: "pointer", padding: "2px 6px", borderRadius: 4, color: C.text, background: p ? (x.sync ? C.red + "22" : C.green + "18") : "transparent", borderLeft: `3px solid ${p ? (x.sync ? C.red : C.green) : "transparent"}` }}>
              {x.l}
              {p && <div style={{ fontFamily: "'Segoe UI', sans-serif", fontSize: 11.5, color: x.sync ? C.red : C.green }}>{x.why}</div>}
            </div>
          );
        })}
      </pre>
      <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8 }}>Sync points found: {found} / 4</div>
      <Insight color={C.red} title="Anything that needs a GPU value on the CPU forces a wait: .item(), .cpu(), print, Python if on a tensor.">
        They're fine occasionally (say every 100 steps for logging), but harmful in every iteration. The standard fix: accumulate on the GPU, and fetch
        once at the end of the epoch.
      </Insight>
      <LabCard part="D" title="Wrong vs right timing, and the cost of .item()"
        what="Time a matrix multiply with and without torch.cuda.synchronize(), then train a small model for an epoch calling loss.item() every step vs only at the end, and compare."
        expect="an impossibly fast unsynchronised time, a realistic synchronised one, and the every-step .item() version measurably slower." />
    </div>
  );
}

const QUESTIONS = [
  { q: "Why did timing c = a @ b without synchronisation give an impossibly small number?", options: ["The GPU cached the result", "The launch returns immediately; the timer stopped before the GPU finished", "Matrix multiplication is free", "The CPU did the work"], answer: 1, explain: "GPU launches are asynchronous. You must call torch.cuda.synchronize() before reading the clock." },
  { q: "Which line forces the CPU to wait for the GPU?", options: ["y = model(x)", "loss.backward()", "value = loss.item()", "x = x.to('cuda', non_blocking=True)"], answer: 2, explain: ".item() returns a Python number, which requires the GPU's result to be finished and copied over." },
  { q: "CPU prep takes 6 ms per batch and GPU training 8 ms. Overlapped, 100 batches take about…", options: ["1,400 ms", "800 ms", "600 ms", "200 ms"], answer: 1, explain: "Overlapped, each step costs max(6, 8) = 8 ms: about 800 ms (plus one initial prep), instead of 1,400 ms in sequence." },
  { q: "The asynchronous GPU queue is most like which COA idea?", options: ["Polling a device in a loop", "Interrupt-driven I/O: start the device, carry on, get notified when it's done", "Microprogrammed control", "Direct-mapped cache"], answer: 1, explain: "Like interrupt-driven I/O, the CPU doesn't stand and wait. It issues work and continues, synchronising only when it needs the result." },
];
const RESULT = {
  perfect: "Perfect! You won't be fooled by GPU timings.",
  good: "Good. Replay 'Hidden Sync Points' and find all four.",
  low: "Revisit 'The Command Queue': launch and carry on, wait only when needed.",
  done: "Unit 4.4 Complete!",
  body: "You can explain asynchronous launches, streams, synchronisation, overlap, and hidden sync points.",
  next: "Next up: Unit 4.C — Capstone: Where Did the Time Go?",
  teaser: "A team's GPU training is mysteriously slow. Profile it, find the culprits, fix them.",
};

const UNIT_WORDS = [
  ["async", "asynchronous", "Doesn't wait for the work to finish before returning.", "new here"],
  ["stream", "a CUDA command queue", "GPU commands in one stream run in order; the CPU keeps going.", "new here"],
  ["sync", "synchronise", "Make the CPU wait until the GPU's queued work is finished.", "new here"],
  ["non_blocking", "a PyTorch copy option", "Lets a copy from pinned memory run without making the CPU wait.", "new here"],
  ["DataLoader", "PyTorch's batch loader", "Prepares batches, optionally with background CPU workers.", "from Unit 2.4"],
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

export default function Unit4_4({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "The Impossible Timing" },
    { id: "s1", label: "The Command Queue" },
    { id: "s2", label: "Overlap" },
    { id: "s3", label: "Hidden Sync Points" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>⏱️ The Impossible Timing — 70× faster than peak?</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📬 The Command Queue — launch and carry on</h3><QueueWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔀 Overlap — prepare the next batch while the GPU trains</h3><OverlapWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🕵️ Hidden Sync Points — lines that make the CPU wait</h3><HiddenSyncWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 4.4.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📬</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 4 › UNIT 4.4</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Async Launch & Synchronization</div>
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
