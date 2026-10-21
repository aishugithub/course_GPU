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

const TEXTBOOK = "Hamacher §12.2 and §12.2.1 (Vector processing; GPUs) · H&P §4.2–4.4 · Mano Ch 9 (Vector and array processors)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// ── Section 1: Flynn's taxonomy ──
const FLYNN = {
  SISD: { full: "Single Instruction, Single Data", ex: "The processor you studied in COA: one instruction stream working on one piece of data at a time.", c: C.muted },
  SIMD: { full: "Single Instruction, Multiple Data", ex: "ONE instruction applied to MANY data items at once: CPU vector units (Hamacher §12.2) and, underneath, GPUs. This is the AI-friendly box.", c: C.green },
  MISD: { full: "Multiple Instruction, Single Data", ex: "Several instruction streams on the same data. Very rare: used mainly for fault-tolerant systems that run the same input through different checks.", c: C.muted },
  MIMD: { full: "Multiple Instruction, Multiple Data", ex: "Independent processors, each with its own program and data: multicore CPUs, clusters of computers.", c: C.orange },
};
function FlynnWidget() {
  const [k, setK] = useState("SIMD");
  const cell = (key) => (
    <div onClick={() => setK(key)} style={{ cursor: "pointer", background: k === key ? FLYNN[key].c + "33" : C.card, border: `2px solid ${k === key ? FLYNN[key].c : C.border}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
      <div style={{ color: C.text, fontWeight: 700, fontSize: 18, fontFamily: "monospace" }}>{key}</div>
      <div style={{ color: C.muted, fontSize: 11 }}>{FLYNN[key].full}</div>
    </div>
  );
  return (
    <div>
      <Frame>
        In 1966 Michael Flynn sorted computers by two questions: how many <b style={{ color: C.text }}>instruction</b> streams, and how many
        <b style={{ color: C.text }}> data</b> streams? Click each box.
      </Frame>
      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 8, alignItems: "center" }}>
        <div /><div style={{ color: C.muted, fontSize: 12, textAlign: "center" }}>Single Data</div><div style={{ color: C.muted, fontSize: 12, textAlign: "center" }}>Multiple Data</div>
        <div style={{ color: C.muted, fontSize: 12 }}>Single Instruction</div>{cell("SISD")}{cell("SIMD")}
        <div style={{ color: C.muted, fontSize: 12 }}>Multiple Instruction</div>{cell("MISD")}{cell("MIMD")}
      </div>
      <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: FLYNN[k].c + "14", border: `1px solid ${FLYNN[k].c}55`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        <b style={{ color: C.text }}>{k}: {FLYNN[k].full}.</b> {FLYNN[k].ex}
      </div>
      <Insight color={C.green} title="AI's work is 'do the same thing to lots of numbers', which is exactly SIMD.">
        Apply ReLU to a million numbers, multiply every row by the same weights: one instruction, many data. That's the box GPUs live in.
      </Insight>
    </div>
  );
}

// ── Section 2: SIMD lanes — Hamacher's vectorised loop ──
function SimdWidget() {
  const N = 16;
  const [L, setL] = useState(4);
  const [step, setStep] = useState(0);
  const passes = Math.ceil(N / L);
  const doneUpTo = step * L;
  return (
    <div>
      <Frame>
        Hamacher §12.2 uses this example: C[i] = A[i] + B[i] for N elements. A normal loop handles ONE element per pass. A
        <b style={{ color: C.green }}> vector instruction</b> works on L elements at once using L parallel ALU lanes. Choose the vector length, then
        step through.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {[1, 4, 8, 16].map((v) => <Btn key={v} ghost={v !== L} onClick={() => { setL(v); setStep(0); }} color={C.green}>L = {v}{v === 1 ? " (scalar)" : ""}</Btn>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${N}, 1fr)`, gap: 3 }}>
        {Array.from({ length: N }, (_, i) => {
          const done = i < doneUpTo, now = i >= doneUpTo - L && i < doneUpTo;
          return (
            <div key={i} style={{ textAlign: "center", borderRadius: 4, padding: "4px 0", background: now ? C.green + "55" : done ? C.green + "22" : C.card, border: `1px solid ${now ? C.green : C.border}`, fontFamily: "monospace", fontSize: 10.5, color: C.text }}>
              {i}<br />{done ? "✓" : "·"}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Btn onClick={() => setStep((s) => Math.min(passes, s + 1))} color={C.green}>One pass ▶ ({step} / {passes})</Btn>
        <Btn ghost onClick={() => setStep(0)}>↺ Reset</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
        <Code color={C.orange} title="⚙️ SCALAR LOOP: 9 instructions × N passes">{`LOOP: Load     R6, (R2)     ; R6 ← [A[i]]
      Load     R7, (R3)     ; R7 ← [B[i]]
      Add      R8, R6, R7
      Store    R8, (R4)     ; C[i] ← [R8]
      Add      R2, R2, #4
      Add      R3, R3, #4
      Add      R4, R4, #4
      Subtract R5, R5, #1
      Branch_if_[R5]>0  LOOP`}</Code>
        <Code color={C.green} title={`➗ VECTOR LOOP: 9 instructions × N/L passes`}>{`LOOP: VectorLoad  V0, (R2)   ; L elements of A
      VectorLoad  V1, (R3)   ; L elements of B
      VectorAdd   V2, V0, V1 ; L adds at once
      VectorStore V2, (R4)
      Add      R2, R2, #4L
      Add      R3, R3, #4L
      Add      R4, R4, #4L
      Subtract R5, R5, #L
      Branch_if_[R5]>0  LOOP`}</Code>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="INSTRUCTIONS, SCALAR" value={`9 × ${N} = ${9 * N}`} color={C.orange} />
        <Stat label={`INSTRUCTIONS, L = ${L}`} value={`9 × ${passes} = ${9 * passes}`} color={C.green} />
      </div>
      <Insight color={C.green} title="One vector instruction does L additions, so the loop runs N/L times instead of N.">
        This is SIMD inside a CPU. Your laptop's CPU has vector units with 8 or 16 lanes, which is part of why NumPy beat plain Python by
        hundreds of times in Lab 1.
      </Insight>
    </div>
  );
}

// ── Section 3: SIMT — write for one thread, run thousands ──
const KLINES = ["__global__ void add(float *A, float *B, float *C) {", "    int i = blockIdx.x * blockDim.x + threadIdx.x;", "    C[i] = A[i] + B[i];", "}", "", "add<<<N / 256, 256>>>(A, B, C);   // launch N threads"];
const AV = [3, 1, 4, 1, 5, 9, 2, 6], BV = [2, 7, 1, 8, 2, 8, 1, 8];
function SimtWidget() {
  const [s, setS] = useState(0);
  const line = [5, 1, 2, 3][s];
  return (
    <div>
      <Frame>
        A GPU flips the idea around. You write the code for <b style={{ color: C.text }}>ONE</b> element, called a <b style={{ color: C.accent }}>kernel</b>,
        and launch it on thousands of <b style={{ color: C.accent }}>threads</b>. Every thread runs the same instructions, but each has its own
        number i and its own registers. NVIDIA calls this <b style={{ color: C.green }}>SIMT</b>: Single Instruction, Multiple Threads. Step through with 8 threads.
      </Frame>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <Code color={C.orange} title="🐢 CPU: one loop, one element after another">{`for i in range(N):
    C[i] = A[i] + B[i]`}</Code>
        <pre style={{ margin: 0, background: C.card, border: `1.5px solid ${C.accent}`, borderRadius: 10, padding: 12, fontFamily: "monospace", fontSize: 11, lineHeight: 1.7, color: C.text, whiteSpace: "pre-wrap" }}>
          <div style={{ color: C.accent, fontWeight: 700, fontSize: 12, marginBottom: 6, fontFamily: "'Segoe UI', sans-serif" }}>⚡ GPU: a kernel, run by N threads (CUDA C)</div>
          {KLINES.map((l, k) => <div key={k} style={{ background: k === line ? C.accent + "22" : "transparent", borderLeft: `3px solid ${k === line ? C.accent : "transparent"}`, paddingLeft: 4 }}>{l || " "}</div>)}
        </pre>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 5 }}>
        {AV.map((a, i) => (
          <div key={i} style={{ background: C.card, border: `1.5px solid ${s >= 1 ? C.teal : C.border}`, borderRadius: 8, padding: 6, fontFamily: "monospace", fontSize: 10.5, color: C.muted, textAlign: "center" }}>
            <div style={{ color: C.text, fontWeight: 700 }}>thread {i}</div>
            <div style={{ color: s >= 2 ? C.teal : C.border }}>i = {s >= 2 ? i : "?"}</div>
            <div style={{ color: s >= 3 ? C.green : C.border }}>C = {s >= 3 ? a + BV[i] : "?"}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, minHeight: 36, color: C.text, fontSize: 13, lineHeight: 1.6 }}>
        {["The CPU launches the kernel with N threads (here 8 of them; really thousands).", "All threads start the same instruction at the same time.", "Each thread works out ITS OWN index i from its built-in IDs: same instruction, different data.", "Each thread adds its own pair. All 8 additions happen in one step. No loop!"][s]}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={() => setS((v) => Math.min(3, v + 1))}>Step ▶ ({s + 1} / 4)</Btn>
        <Btn ghost onClick={() => setS(0)}>↺ Reset</Btn>
      </div>
      <Insight title="SIMD: you write one wide instruction. SIMT: you write a normal program for one thread, and the GPU runs thousands of copies.">
        The loop disappears: it's replaced by "how many threads to launch". You'll write this exact kernel yourself in Module 4.
      </Insight>
    </div>
  );
}

// ── Section 4: Warps — SIMT on SIMD hardware ──
function WarpWidget() {
  const [n, setN] = useState(10000);
  const warps = Math.ceil(n / 32);
  const sms = 40;
  return (
    <div>
      <Frame>
        Underneath, the GPU really is SIMD hardware. It groups threads into bundles of <b style={{ color: C.purple }}>32 called warps</b>; the 32
        threads of a warp share one instruction unit and move in lock-step. Warps are spread across the GPU's
        <b style={{ color: C.text }}> streaming multiprocessors</b> (the T4 has 40). Choose how many elements to process.
      </Frame>
      <Slider label={<>Elements (one thread each) = <b style={{ color: C.accent }}>{n.toLocaleString("en-IN")}</b></>} value={n} min={32} max={1000000} step={32} onChange={setN} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="THREADS" value={n.toLocaleString("en-IN")} color={C.accent} />
        <Stat label="WARPS (÷ 32)" value={warps.toLocaleString("en-IN")} color={C.purple} />
        <Stat label="WARPS PER SM (40 SMs)" value={(warps / sms).toFixed(1)} color={C.green} />
      </div>
      <table style={{ width: "100%", marginTop: 14, borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead><tr style={{ color: C.muted, textAlign: "left" }}><th style={{ padding: 6 }}></th><th>CPU SIMD</th><th>GPU SIMT</th></tr></thead>
        <tbody style={{ color: C.text }}>
          {[["You write", "wide vector instructions (or the compiler does)", "an ordinary program for ONE thread"], ["Width", "4–16 lanes", "32 threads per warp × thousands of warps"], ["Each lane has", "a slot in a vector register", "its own registers and its own index"], ["Good for", "short bursts inside a CPU program", "huge, regular, independent work, like AI"]].map((r) => (
            <tr key={r[0]} style={{ borderTop: `1px solid ${C.border}` }}><td style={{ padding: 6, color: C.muted }}>{r[0]}</td><td style={{ color: C.orange }}>{r[1]}</td><td style={{ color: C.green }}>{r[2]}</td></tr>
          ))}
        </tbody>
      </table>
      <Insight color={C.purple} title="A warp of 32 threads is the GPU's real unit of execution.">
        Remember "32". It explains a lot in Module 3: why if/else inside a kernel can be slow, and why GPUs like jobs with thousands of threads.
      </Insight>
      <LabCard part="C" title="Vector add: CPU vs GPU"
        what="Add two arrays of growing size, first with NumPy on the CPU, then with PyTorch on the GPU, timing both correctly (with torch.cuda.synchronize)."
        expect="the CPU wins for small arrays and the GPU wins clearly for arrays of millions of elements." />
    </div>
  );
}

const QUESTIONS = [
  { q: "A multicore CPU running different programs on each core is which Flynn class?", options: ["SISD", "SIMD", "MISD", "MIMD"], answer: 3, explain: "Multiple independent instruction streams on multiple data streams: MIMD." },
  { q: "Hamacher's loop has 9 instructions per pass. With N = 64 and vector length L = 8, how many instructions run?", options: ["9", "72", "576", "64"], answer: 1, explain: "The vectorised loop runs N/L = 8 passes × 9 instructions = 72, compared with 9 × 64 = 576 for the scalar loop." },
  { q: "In a CUDA kernel, how does each thread know which element to work on?", options: ["It reads a loop counter", "It computes its own index from built-in IDs (blockIdx, threadIdx)", "The CPU tells each thread separately", "It picks one at random"], answer: 1, explain: "i = blockIdx.x * blockDim.x + threadIdx.x gives every thread a unique index: same code, different data." },
  { q: "How many threads are in one warp on NVIDIA GPUs?", options: ["8", "16", "32", "1024"], answer: 2, explain: "A warp is 32 threads that share one instruction unit and execute in lock-step." },
];
const RESULT = {
  perfect: "Perfect! You understand how GPUs run code.",
  good: "Good. Replay 'SIMT Threads' and watch each thread find its own i.",
  low: "Revisit 'SIMD Lanes' then 'SIMT Threads': one instruction, many data is the heart of it.",
  done: "Unit 2.3 Complete!",
  body: "You can place machines in Flynn's taxonomy, explain vectorisation (Hamacher §12.2), and describe SIMT threads and warps.",
  next: "Next up: Unit 2.4 — Amdahl's Law.",
  teaser: "The GPU makes the matrix multiply 100× faster, but the whole program only 3× faster. Why?",
};

const UNIT_WORDS = [
  ["SISD / SIMD / MISD / MIMD", "Flynn's four classes", "Single or Multiple Instruction streams × Single or Multiple Data streams.", "new here"],
  ["SIMT", "Single Instruction, Multiple Threads", "NVIDIA's model: one program, thousands of threads, each with its own data.", "new here"],
  ["L", "vector length", "How many elements one vector instruction handles at once (Hamacher §12.2).", "new here"],
  ["SM", "Streaming Multiprocessor", "One of the GPU's 'mini-processors'; the T4 has 40. Unit 3.1 opens one up.", "new here"],
  ["RTN", "Register Transfer Notation", "R6 ← [A[i]] means 'load the value at A[i] into R6'.", "from COA"],
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

export default function Unit2_3({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "Flynn's Taxonomy" },
    { id: "s1", label: "SIMD Lanes" },
    { id: "s2", label: "SIMT Threads" },
    { id: "s3", label: "Warps" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🗂️ Flynn's Taxonomy — SISD, SIMD, MISD, MIMD</h3><FlynnWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>➗ SIMD — one instruction, many lanes (Hamacher §12.2)</h3><SimdWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🧵 SIMT — write for one thread, run thousands</h3><SimtWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📦 Warps — 32 threads in lock-step</h3><WarpWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 2.3.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>➗</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 2 › UNIT 2.3</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>SIMD → SIMT</div>
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
