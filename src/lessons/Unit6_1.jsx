import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab06_Why_GPUs_Make_AI_Fast.ipynb";

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
      <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>🧪 TRY IT FOR REAL — LAB 6 · PART {part}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{what}</div>
      <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}><b style={{ color: C.green }}>You should see:</b> {expect}</div>
      <a href={LAB_URL} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", borderRadius: 8, background: C.orange, color: "#0D1117", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Open Lab 6 in Colab ↗</a>
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

const TEXTBOOK = "Kirk & Hwu Ch 5 (Tiling for reduced memory traffic) · Hamacher Ch 8 (Cache memories: locality)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// ── Section 1: Need — the naive kernel is starving ──
function NeedWidget() {
  const [n, setN] = useState(1024);
  const reads = 2 * n * n * n;                  // every thread reads a row of A and a column of B
  const bytes = reads * 4;
  const flops = 2 * n ** 3;
  const tMem = bytes / 320e9, tComp = flops / 8.1e12;
  return (
    <div>
      <Frame>
        The obvious GPU matrix multiply: one thread per output cell C[row][col], each reading a whole row of A and column of B from global memory
        (Unit 5.3's 2-D grid). Every number of A is fetched <b style={{ color: C.red }}>n times</b>, once by every thread that needs it. Count the traffic.
      </Frame>
      <Code color={C.red} title="❌ NAIVE KERNEL: everything from global memory">{`__global__ void matmul_naive(const float *A, const float *B, float *C, int n) {
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;
    if (row < n && col < n) {
        float sum = 0.0f;
        for (int k = 0; k < n; k++)
            sum += A[row * n + k] * B[k * n + col];   // 2 global reads per FMA
        C[row * n + col] = sum;
    }
}`}</Code>
      <Slider label={<>Matrix size n = <b style={{ color: C.accent }}>{n}</b></>} value={n} min={256} max={4096} step={256} onChange={setN} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="GLOBAL-MEMORY READS" value={`${(bytes / 1e9).toFixed(1)} GB`} color={C.red} />
        <Stat label="TIME FOR THAT TRAFFIC" value={`${(tMem * 1e3).toFixed(0)} ms`} color={C.red} />
        <Stat label="TIME FOR THE MATHS" value={`${(tComp * 1e3).toFixed(1)} ms`} color={C.green} />
      </div>
      <Insight color={C.red} title="Two global reads for every multiply-add: memory-bound by a factor of about 100.">
        This is Unit 4.4's 'feeding the beast' problem. (Caches soften it a little in practice, but not enough.) The cure is to fetch each number
        ONCE into fast shared memory and let many threads reuse it.
      </Insight>
    </div>
  );
}

// ── Section 2: The tiling idea ──
function IdeaWidget() {
  const [T, setT] = useState(16);
  const n = 4096;
  const reduce = T;
  const intensity = (T / 4).toFixed(1);                 // FLOPs per byte of global traffic ≈ 2·T / (2·4)
  const perf = Math.min(8.1e12, 320e9 * (T / 4));
  return (
    <div>
      <Frame>
        A study group needs the same 32 reference pages. Bad plan: every student walks to the library for every page. Good plan: fetch a stack of pages
        to the group's table <b style={{ color: C.teal }}>once</b>, and everyone reads them there. A GPU <b style={{ color: C.text }}>thread block</b> does the same: it loads a T × T
        <b style={{ color: C.teal }}> tile</b> of A and of B into <b style={{ color: C.teal }}>shared memory</b> (Unit 4.4), and all T × T threads reuse it. Choose the tile size.
      </Frame>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {[1, 2, 4, 8, 16, 32].map((v) => <Btn key={v} ghost={v !== T} onClick={() => setT(v)} color={C.teal}>T = {v}</Btn>)}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="GLOBAL READS CUT BY" value={`${reduce}×`} color={C.teal} />
        <Stat label="FLOPs PER BYTE FETCHED" value={intensity} color={C.purple} />
        <Stat label="SPEED LIMIT ON THE T4 (FP32)" value={`${(perf / 1e12).toFixed(2)} TFLOPS`} color={perf >= 8.1e12 ? C.green : C.yellow} />
      </div>
      <div style={{ height: 22, background: C.card, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}`, marginTop: 10 }}>
        <div style={{ width: `${(perf / 8.1e12) * 100}%`, height: "100%", background: perf >= 8.1e12 ? C.green : C.yellow }} />
      </div>
      <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8 }}>T = 1 is the naive kernel. A 16 × 16 or 32 × 32 tile is typical: it must fit in the 96 KB of shared memory per SM, and 32 × 32 = 1,024 is the maximum block size.</div>
      <Insight color={C.teal} title="Each number fetched from global memory is now used T times instead of once.">
        Tiling cuts global traffic by T× and moves the kernel much closer to the compute limit. Expert libraries finish the job with extra
        tricks (tiles in registers too). It's the same principle as the cache locality you studied in COA (Hamacher Ch 8),
        except that the programmer manages this 'cache' by hand.
      </Insight>
    </div>
  );
}

// ── Section 3: Trace the tiles ──
function TileTraceWidget() {
  const [p, setP] = useState(0);
  const N = 8, T = 4, phases = N / T;
  const tileCell = (m, r, c) => {
    // block computing C tile (0,1): rows 0-3, cols 4-7
    if (m === "C") return r < 4 && c >= 4 ? (p > 0 ? "acc" : "target") : null;
    if (p === 0) return null;
    const k = p - 1;
    if (m === "A") return r < 4 && Math.floor(c / T) === k ? "load" : r < 4 && Math.floor(c / T) < k ? "used" : null;
    if (m === "B") return c >= 4 && Math.floor(r / T) === k ? "load" : c >= 4 && Math.floor(r / T) < k ? "used" : null;
    return null;
  };
  const colr = { load: C.teal, used: C.border, acc: C.green, target: C.yellow };
  return (
    <div>
      <Frame>
        One thread block computes the 4 × 4 tile of C shown in yellow (8 × 8 matrices, tiles of 4). It walks along A's rows and B's columns in
        <b style={{ color: C.text }}> phases</b>: each phase loads one tile of A and one of B into shared memory, waits until everyone has loaded
        (<code>__syncthreads()</code>), then every thread does 4 multiply-adds from shared memory.
      </Frame>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
        {["A", "B", "C"].map((m) => (
          <div key={m}>
            <div style={{ color: C.muted, fontSize: 11, textAlign: "center" }}>{m}</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${N}, 18px)`, gap: 1.5 }}>
              {Array.from({ length: N * N }, (_, i) => {
                const r = Math.floor(i / N), c = i % N, s = tileCell(m, r, c);
                return <div key={i} style={{ width: 18, height: 18, borderRadius: 2, background: s ? colr[s] + (s === "used" ? "" : "88") : C.card, border: `1px solid ${(c % T === 0 && c) || (r % T === 0 && r) ? C.muted + "66" : C.border}` }} />;
              })}
            </div>
          </div>
        ))}
        <div style={{ minWidth: 150 }}>
          <div style={{ color: C.teal, fontSize: 11 }}>■ in shared memory now</div>
          <div style={{ color: C.muted, fontSize: 11 }}>■ already used</div>
          <div style={{ color: C.green, fontSize: 11 }}>■ C partial sums growing</div>
        </div>
      </div>
      <div style={{ marginTop: 10, minHeight: 38, color: C.text, fontSize: 13, lineHeight: 1.6 }}>
        {p === 0 ? "Start: the block's 16 threads each own one cell of C's yellow tile; their sums start at 0." : p < phases ? `Phase ${p}: load A tile (rows 0–3, cols ${(p - 1) * 4}–${p * 4 - 1}) and B tile (rows ${(p - 1) * 4}–${p * 4 - 1}, cols 4–7) into shared memory → __syncthreads() → 4 FMAs per thread from shared memory → __syncthreads().` : `Phase ${p}: the last pair of tiles. Each thread has now done all 8 FMAs and writes its finished C cell to global memory.`}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={() => setP((v) => Math.min(phases, v + 1))} color={C.teal}>Next phase ▶ ({p} / {phases})</Btn>
        <Btn ghost onClick={() => setP(0)}>↺ Reset</Btn>
      </div>
      <Insight color={C.green} title="Load a tile together, sync, compute from shared memory, sync, slide to the next tile.">
        Each element of A and B is read from global memory once per block instead of once per thread. For real 16 × 16 tiles that's 16× less traffic.
      </Insight>
    </div>
  );
}

// ── Section 4: The code — and the library that beats it ──
function CodeWidget() {
  const [v, setV] = useState("tiled");
  const KERNELS = {
    tiled: `#define T 16
__global__ void matmul_tiled(const float *A, const float *B, float *C, int n) {
    __shared__ float As[T][T], Bs[T][T];          // the group's table
    int row = blockIdx.y * T + threadIdx.y;
    int col = blockIdx.x * T + threadIdx.x;
    float sum = 0.0f;
    for (int p = 0; p < n / T; p++) {             // one phase per tile pair
        As[threadIdx.y][threadIdx.x] = A[row * n + p * T + threadIdx.x];
        Bs[threadIdx.y][threadIdx.x] = B[(p * T + threadIdx.y) * n + col];
        __syncthreads();                          // wait: tiles fully loaded
        for (int k = 0; k < T; k++)
            sum += As[threadIdx.y][k] * Bs[k][threadIdx.x];   // from shared memory
        __syncthreads();                          // wait: everyone finished reading
    }
    C[row * n + col] = sum;                       // (assumes n is a multiple of T)
}`,
    torch: `# PyTorch calls NVIDIA's cuBLAS library, written by NVIDIA engineers:
C = A @ B

# cuBLAS uses tiling AND much more: register tiles, double buffering,
# Tensor Cores for FP16, and kernels tuned for each GPU model.`,
  };
  return (
    <div>
      <Frame>
        Here's the tiled kernel (in the style of Kirk & Hwu Ch 5), next to what you'll actually write in AI code. Compare.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <Btn ghost={v !== "tiled"} onClick={() => setV("tiled")} color={C.teal}>⚙️ Tiled kernel (CUDA C)</Btn>
        <Btn ghost={v !== "torch"} onClick={() => setV("torch")}>🔥 PyTorch (cuBLAS)</Btn>
      </div>
      <Code color={v === "tiled" ? C.teal : C.accent}>{KERNELS[v]}</Code>
      <table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead><tr style={{ color: C.muted, textAlign: "left" }}><th style={{ padding: 6 }}>Version (n = 4096, T4, FP32)</th><th>Typical speed</th></tr></thead>
        <tbody style={{ color: C.text }}>
          {[["Naive kernel", "≈ 0.3–0.8 TFLOPS", C.red], ["Tiled kernel (T = 16)", "≈ 1–2 TFLOPS", C.yellow], ["cuBLAS via PyTorch", "≈ 4–5 TFLOPS", C.green], ["cuBLAS, FP16 Tensor Cores", "≈ 20–40 TFLOPS", C.green]].map(([a, b, c]) => (
            <tr key={a} style={{ borderTop: `1px solid ${C.border}` }}><td style={{ padding: 6 }}>{a}</td><td style={{ color: c, fontFamily: "monospace" }}>{b}</td></tr>
          ))}
        </tbody>
      </table>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 4 }}>Approximate ranges; you'll measure your own in the lab.</div>
      <Insight title="Understand tiling; use the library.">
        Writing your own matrix multiply teaches you why GPUs are fast. In real projects, the expert-tuned library is several times faster again,
        and PyTorch uses it automatically for every Linear layer.
      </Insight>
      <LabCard part="A" title="Naive vs tiled vs cuBLAS"
        what="Run the naive and tiled kernels above through CuPy for n = 1024 and 2048, check they agree with PyTorch, and compare their TFLOPS with torch's A @ B in FP32 and FP16."
        expect="tiled clearly faster than naive, cuBLAS faster again, and FP16 Tensor Cores fastest of all." />
    </div>
  );
}

const QUESTIONS = [
  { q: "In the naive matrix-multiply kernel, how many global-memory reads does each multiply-add need?", options: ["0", "1", "2", "n"], answer: 2, explain: "One element of A and one of B, both from global memory: 2 reads (8 bytes) for 2 FLOPs. Badly memory-bound." },
  { q: "With 16 × 16 tiles in shared memory, global-memory traffic is reduced by about…", options: ["2×", "16×", "256×", "Not at all"], answer: 1, explain: "Each element loaded into a tile is reused by 16 threads instead of being fetched 16 separate times." },
  { q: "Why is __syncthreads() needed after loading a tile?", options: ["To free memory", "So no thread starts computing before the whole tile is loaded by its teammates", "To launch the next kernel", "To copy data to the CPU"], answer: 1, explain: "Each thread loads one element; all of them must finish before anyone reads the tile." },
  { q: "In a real AI project, how should you do matrix multiplication on the GPU?", options: ["Write a naive kernel", "Write a tiled kernel", "Use the library (PyTorch → cuBLAS)", "Use the CPU"], answer: 2, explain: "cuBLAS is far more optimised than hand-written kernels; PyTorch calls it automatically." },
];
const RESULT = {
  perfect: "Perfect! You know the core trick behind fast GPU maths.",
  good: "Good. Replay 'Trace the Tiles' phase by phase.",
  low: "Revisit 'The Tiling Idea': fetch once into shared memory, reuse many times.",
  done: "Unit 6.1 Complete!",
  body: "You can explain why naive matrix multiply is memory-bound, how tiling with shared memory fixes it, and why libraries win.",
  next: "Next up: Unit 6.2 — Precision: FP32 → FP16/BF16 → INT8.",
  teaser: "Fewer bits per number: half the memory, double the speed, and Tensor Cores switched on. Does AI even notice?",
};

const UNIT_WORDS = [
  ["tile", "a small square block of a matrix", "Loaded into shared memory and reused by a thread block.", "new here"],
  ["__shared__", "CUDA's shared-memory keyword", "Declares an array in the SM's fast shared memory (Unit 4.4).", "new here"],
  ["__syncthreads()", "block barrier", "Every thread in the block waits here until all have arrived.", "new here"],
  ["cuBLAS", "CUDA Basic Linear Algebra Subprograms", "NVIDIA's highly tuned matrix library, used by PyTorch.", "new here"],
  ["FMA", "Fused Multiply-Add", "a × b + c in one instruction.", "from Unit 4.1"],
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

export default function Unit6_1({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "The Starving Kernel" },
    { id: "s1", label: "The Tiling Idea" },
    { id: "s2", label: "Trace the Tiles" },
    { id: "s3", label: "Code & cuBLAS" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🍽️ The Starving Kernel — naive matrix multiply</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📚 The Tiling Idea — fetch once, reuse many times</h3><IdeaWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🧩 Trace the Tiles — phase by phase</h3><TileTraceWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>⚙️ The Code — and the library that beats it</h3><CodeWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 6.1.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🧩</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 6 › UNIT 6.1</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Parallel Matrix Multiply & Tiling</div>
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
