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

const TEXTBOOK = "Kirk & Hwu Ch 2–3 (Kernel functions and threading; multidimensional grids)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// ── Section 1: Need — a million threads need an address system ──
function NeedWidget() {
  const [n, setN] = useState(100000);
  const hall = 256;
  const halls = Math.ceil(n / hall);
  return (
    <div>
      <Frame>
        The university exam has <b style={{ color: C.text }}>{n.toLocaleString("en-IN")} students</b>, but each exam hall seats only 256. So students are split into halls;
        each has a <b style={{ color: C.purple }}>hall number</b> and a <b style={{ color: C.teal }}>seat number</b> inside the hall. A GPU launch works exactly the same way:
        a hardware block can hold at most 1,024 threads, so threads come in <b style={{ color: C.purple }}>blocks</b>, and all the blocks together form the <b style={{ color: C.accent }}>grid</b>.
      </Frame>
      <Slider label={<>Students (= elements = threads) = <b style={{ color: C.accent }}>{n.toLocaleString("en-IN")}</b></>} value={n} min={1000} max={1000000} step={1000} onChange={setN} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="SEATS PER HALL (blockDim)" value={hall} color={C.teal} />
        <Stat label="HALLS NEEDED (grid size)" value={halls.toLocaleString("en-IN")} color={C.purple} />
        <Stat label="EMPTY SEATS IN LAST HALL" value={halls * hall - n} color={C.yellow} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        {[["🏫 Exam hall", "🧱 Thread block", "a team of up to 1,024 threads that runs on ONE SM"], ["💺 Seat number in the hall", "🔢 threadIdx.x", "0 … blockDim.x − 1"], ["🏛️ Hall number", "🔢 blockIdx.x", "0 … gridDim.x − 1"], ["🎫 University roll number", "🌍 global index i", "unique for every thread"]].map(([a, b, c]) => (
          <div key={a} style={{ background: C.card, borderRadius: 8, padding: 8, border: `1px solid ${C.border}` }}>
            <div style={{ color: C.muted, fontSize: 12 }}>{a}</div>
            <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{b}</div>
            <div style={{ color: C.muted, fontSize: 11.5 }}>{c}</div>
          </div>
        ))}
      </div>
      <Insight color={C.purple} title="Grid of blocks, block of threads: a two-level address system.">
        Blocks are the unit the GPU hands to SMs (each block runs entirely on one SM); threads in a block can share 'shared memory' (Unit 3.4).
      </Insight>
    </div>
  );
}

// ── Section 2: The index formula ──
function IndexWidget() {
  const [bd, setBd] = useState(4);
  const [n, setN] = useState(10);
  const [guard, setGuard] = useState(true);
  const blocks = Math.ceil(n / bd);
  const [pick, setPick] = useState([1, 2]);
  const i = pick[0] * bd + pick[1];
  const overflow = blocks * bd > n;
  return (
    <div>
      <Frame>
        Every thread computes its own element with <code style={{ color: C.accent }}>i = blockIdx.x × blockDim.x + threadIdx.x</code> (hall × seats per hall + seat). Click any
        thread. Then make n not a multiple of the block size, and switch off the safety check.
      </Frame>
      <Slider label={<>Threads per block (blockDim.x) = <b style={{ color: C.teal }}>{bd}</b></>} value={bd} min={2} max={8} onChange={(v) => { setBd(v); setPick([0, 0]); }} color={C.teal} />
      <Slider label={<>Array length n = <b style={{ color: C.accent }}>{n}</b></>} value={n} min={4} max={30} onChange={(v) => { setN(v); setPick([0, 0]); }} />
      <label style={{ color: C.muted, fontSize: 12.5, cursor: "pointer" }}><input type="checkbox" checked={guard} onChange={(e) => setGuard(e.target.checked)} /> Include the safety check <code>if (i &lt; n)</code></label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {Array.from({ length: blocks }, (_, b) => (
          <div key={b} style={{ border: `1.5px dashed ${C.purple}`, borderRadius: 8, padding: 5 }}>
            <div style={{ color: C.purple, fontSize: 10, marginBottom: 3 }}>block {b}</div>
            <div style={{ display: "flex", gap: 3 }}>
              {Array.from({ length: bd }, (_, t) => {
                const gi = b * bd + t, out = gi >= n, sel = pick[0] === b && pick[1] === t;
                return <div key={t} onClick={() => setPick([b, t])} style={{ width: 26, height: 26, borderRadius: 4, cursor: "pointer", background: out ? (guard ? C.card : C.red + "55") : C.green + "44", border: `1.5px solid ${sel ? C.yellow : out ? (guard ? C.border : C.red) : C.green}`, fontSize: 9.5, color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}>{gi}</div>;
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 13, color: C.yellow, marginTop: 10 }}>
        i = blockIdx.x × blockDim.x + threadIdx.x = {pick[0]} × {bd} + {pick[1]} = <b>{i}</b> {i >= n ? (guard ? "→ i ≥ n, so this thread does nothing ✓" : "→ writes PAST THE END of the array ✗") : `→ handles element ${i}`}
      </div>
      {!guard && overflow && (
        <pre style={{ marginTop: 8, background: "#2a1214", border: `1px solid ${C.red}`, borderRadius: 8, padding: 10, color: C.red, fontFamily: "monospace", fontSize: 11.5, whiteSpace: "pre-wrap" }}>
{`CUDA error: an illegal memory access was encountered
(or worse: no error at all, just silently corrupted data)`}
        </pre>
      )}
      <Code color={C.accent} title="⚡ THE STANDARD KERNEL PATTERN">{`__global__ void relu(const float *x, float *y, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n)                         // the safety check
        y[i] = fmaxf(x[i], 0.0f);
}
// launch: enough blocks to cover n, rounding UP
relu<<<(n + 255) / 256, 256>>>(x, y, n);`}</Code>
      <Insight color={C.yellow} title="Round the number of blocks UP, then let the extra threads do nothing with if (i < n).">
        Forgetting the check is the classic beginner bug: the last block's extra threads write past the end of the array.
      </Insight>
    </div>
  );
}

// ── Section 3: Choosing the block size ──
function BlockSizeWidget() {
  const [bs, setBs] = useState(256);
  const warpsPerBlock = Math.ceil(bs / 32);
  const blocksPerSM = Math.min(16, Math.floor(32 / warpsPerBlock));    // T4: ≤ 16 blocks and ≤ 32 warps per SM
  const warps = blocksPerSM * warpsPerBlock;
  const wasted = warpsPerBlock * 32 - bs;
  return (
    <div>
      <Frame>
        How many threads per block? Rules for the T4: at most <b style={{ color: C.text }}>1,024</b> threads per block, at most <b style={{ color: C.text }}>16 blocks</b> and
        <b style={{ color: C.text }}> 32 warps</b> per SM. Blocks are made of whole warps, so a block of 100 threads still uses 4 warps (128 lanes). Try different sizes.
      </Frame>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {[32, 64, 100, 128, 256, 512, 1024].map((v) => <Btn key={v} ghost={v !== bs} onClick={() => setBs(v)}>{v}</Btn>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(32, 1fr)", gap: 2 }}>
        {Array.from({ length: 32 }, (_, w) => <div key={w} style={{ height: 20, borderRadius: 2, background: w < warps ? C.purple : C.card, border: `1px solid ${C.border}`, opacity: w < warps ? 0.5 + 0.5 * ((Math.floor(w / warpsPerBlock)) % 2) : 1 }} />)}
      </div>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 4 }}>The 32 warp slots of one SM; alternating shades = different blocks.</div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="WARPS PER BLOCK" value={warpsPerBlock} color={C.purple} />
        <Stat label="BLOCKS PER SM" value={blocksPerSM} color={C.teal} />
        <Stat label="OCCUPANCY" value={`${Math.round((warps / 32) * 100)}%`} color={warps === 32 ? C.green : C.yellow} />
        <Stat label="IDLE LANES PER BLOCK" value={wasted} color={wasted ? C.red : C.green} />
      </div>
      <Insight color={C.green} title="Use a multiple of 32, typically 128–512. 256 is the common default.">
        Too small (32) hits the 16-blocks-per-SM limit, so half the warp slots stay empty. A non-multiple of 32 (100) wastes lanes in every
        block. (Real kernels can be limited by registers too, Unit 3.3.)
      </Insight>
    </div>
  );
}

// ── Section 4: 2-D grids for images and matrices ──
function Grid2DWidget() {
  const [b, setB] = useState([1, 2]);
  const [t, setT] = useState([2, 1]);
  const BD = 4, W = 16, H = 12;
  const col = b[0] * BD + t[0], row = b[1] * BD + t[1];
  return (
    <div>
      <Frame>
        Images and matrices are 2-D, so CUDA lets blocks and grids be 2-D too: each thread gets an <b style={{ color: C.teal }}>x</b> and a <b style={{ color: C.purple }}>y</b>.
        Here a 16 × 12 image is covered by 4 × 4 blocks. Click any pixel to see which block and thread own it.
      </Frame>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${W}, 1fr)`, gap: 1, maxWidth: 480 }}>
        {Array.from({ length: W * H }, (_, k) => {
          const x = k % W, y = Math.floor(k / W);
          const bx = Math.floor(x / BD), by = Math.floor(y / BD);
          const inBlock = bx === b[0] && by === b[1];
          const sel = x === col && y === row;
          return <div key={k} onClick={() => { setB([bx, by]); setT([x % BD, y % BD]); }} style={{ aspectRatio: "1", cursor: "pointer", background: sel ? C.yellow : inBlock ? C.accent + "66" : (bx + by) % 2 ? C.card : C.surface, border: `1px solid ${C.border}` }} />;
        })}
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 12.5, color: C.text, marginTop: 10, lineHeight: 1.8 }}>
        blockIdx = ({b[0]}, {b[1]}) · threadIdx = ({t[0]}, {t[1]}) · blockDim = (4, 4)<br />
        <span style={{ color: C.teal }}>col = blockIdx.x × 4 + threadIdx.x = {col}</span> · <span style={{ color: C.purple }}>row = blockIdx.y × 4 + threadIdx.y = {row}</span>
      </div>
      <Code color={C.accent} title="⚡ A 2-D KERNEL: BRIGHTEN EVERY PIXEL">{`__global__ void brighten(float *img, int width, int height, float amount) {
    int col = blockIdx.x * blockDim.x + threadIdx.x;
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    if (col < width && row < height)
        img[row * width + col] += amount;     // row-major, like COA's memory layout
}
dim3 block(16, 16);
dim3 grid((width + 15) / 16, (height + 15) / 16);
brighten<<<grid, block>>>(img, width, height, 0.2f);`}</Code>
      <Insight title="One thread per pixel, organised in 2-D tiles.">
        The same idea scales to a 4K photo (about 83 lakh pixels → 83 lakh threads) and to matrix multiplies, where each thread computes one output
        cell. Unit 5.1 tiles a matrix multiply exactly like this.
      </Insight>
      <LabCard part="C" title="Write and launch your first kernel"
        what="Write the ReLU kernel above in CuPy, launch it with block sizes 32, 100, 256 and 1024, check the answer against NumPy, and time each. Then remove the if (i < n) check on an array that isn't a multiple of the block size and see what happens."
        expect="correct results for every block size, similar times for 128–1024 with 32 slower, and trouble without the check." />
    </div>
  );
}

const QUESTIONS = [
  { q: "blockDim.x = 256, blockIdx.x = 3, threadIdx.x = 10. What is the thread's global index i?", options: ["269", "778", "2,570", "13"], answer: 1, explain: "i = 3 × 256 + 10 = 778." },
  { q: "n = 1,000 elements, 256 threads per block. How many blocks should you launch?", options: ["3", "4", "1,000", "256"], answer: 1, explain: "(1000 + 255) / 256 = 4 (round up). 1,024 threads, of which 24 do nothing thanks to if (i < n)." },
  { q: "Why is a block size of 100 a poor choice?", options: ["It's above the maximum", "Blocks use whole warps of 32, so 100 threads occupy 128 lanes and waste 28", "Blocks must be powers of 10", "It causes divergence"], answer: 1, explain: "4 warps × 32 = 128 lanes for 100 threads, wasting 28 lanes in every block. Use multiples of 32." },
  { q: "In a 2-D kernel, which line gives the pixel's row?", options: ["row = threadIdx.x", "row = blockIdx.y * blockDim.y + threadIdx.y", "row = blockIdx.x + blockIdx.y", "row = gridDim.y"], answer: 1, explain: "Same formula as 1-D, in the y direction: block number × block height + position inside the block." },
];
const RESULT = {
  perfect: "Perfect! You can organise millions of GPU threads.",
  good: "Good. Replay 'The Index Formula' and switch off the safety check.",
  low: "Revisit 'Exam Halls': hall number × seats + seat = roll number.",
  done: "Unit 4.3 Complete!",
  body: "You can compute global thread indices, launch enough blocks safely, choose good block sizes, and write 2-D kernels.",
  next: "Next up: Unit 4.4 — Async Launch & Synchronization.",
  teaser: "Your GPU timing says 0.02 ms for a huge matrix multiply. Too good to be true? It is. Find out why.",
};

const UNIT_WORDS = [
  ["threadIdx", "thread index", "A thread's position inside its block (like a seat number).", "new here"],
  ["blockIdx", "block index", "The block's position in the grid (like a hall number).", "new here"],
  ["blockDim / gridDim", "block / grid dimensions", "How many threads per block / blocks per grid.", "new here"],
  ["<<<grid, block>>>", "CUDA launch syntax", "How many blocks, and how many threads in each.", "new here"],
  ["dim3", "a 3-number size in CUDA", "Used for 2-D and 3-D block and grid shapes.", "new here"],
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

export default function Unit4_3({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "Exam Halls" },
    { id: "s1", label: "The Index Formula" },
    { id: "s2", label: "Block Size" },
    { id: "s3", label: "2-D Grids" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🏟️ Exam Halls — grids, blocks and threads</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔢 The Index Formula — and the if (i &lt; n) check</h3><IndexWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📏 Choosing the Block Size</h3><BlockSizeWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🖼️ 2-D Grids — one thread per pixel</h3><Grid2DWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 4.3.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏟️</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 4 › UNIT 4.3</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Kernels, Grids, Blocks, Threads</div>
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
