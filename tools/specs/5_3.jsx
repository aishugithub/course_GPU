//@@META
{"unit": "5.3", "module": 5, "title": "Kernels, Grids, Blocks, Threads", "icon": "🏟️", "lab": "Lab05_CPU_GPU_Teamwork.ipynb", "labNo": 5, "gpu": true}
//@@WIDGETS

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
        Blocks are the unit the GPU hands to SMs (each block runs entirely on one SM); threads in a block can share 'shared memory' (Unit 4.4).
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
        block. (Real kernels can be limited by registers too, Unit 4.3.)
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
        cell. Unit 6.1 tiles a matrix multiply exactly like this.
      </Insight>
      <LabCard part="C" title="Write and launch your first kernel"
        what="Write the ReLU kernel above in CuPy, launch it with block sizes 32, 100, 256 and 1024, check the answer against NumPy, and time each. Then remove the if (i < n) check on an array that isn't a multiple of the block size and see what happens."
        expect="correct results for every block size, similar times for 128–1024 with 32 slower, and trouble without the check." />
    </div>
  );
}
//@@SECTIONS
[["Exam Halls", "🏟️ Exam Halls — grids, blocks and threads", "NeedWidget"],
 ["The Index Formula", "🔢 The Index Formula — and the if (i &lt; n) check", "IndexWidget"],
 ["Block Size", "📏 Choosing the Block Size", "BlockSizeWidget"],
 ["2-D Grids", "🖼️ 2-D Grids — one thread per pixel", "Grid2DWidget"]]
//@@QUIZ
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
  done: "Unit 5.3 Complete!",
  body: "You can compute global thread indices, launch enough blocks safely, choose good block sizes, and write 2-D kernels.",
  next: "Next up: Unit 5.4 — Async Launch & Synchronization.",
  teaser: "Your GPU timing says 0.02 ms for a huge matrix multiply. Too good to be true? It is. Find out why.",
};
//@@WORDS
const UNIT_WORDS = [
  ["threadIdx", "thread index", "A thread's position inside its block (like a seat number).", "new here"],
  ["blockIdx", "block index", "The block's position in the grid (like a hall number).", "new here"],
  ["blockDim / gridDim", "block / grid dimensions", "How many threads per block / blocks per grid.", "new here"],
  ["<<<grid, block>>>", "CUDA launch syntax", "How many blocks, and how many threads in each.", "new here"],
  ["dim3", "a 3-number size in CUDA", "Used for 2-D and 3-D block and grid shapes.", "new here"],
];
