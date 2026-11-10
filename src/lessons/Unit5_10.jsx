import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#F1EEE6", surface: "#FFFFFF", card: "#FAF8F3",
  accent: "#1F5FAD", accentGlow: "#16294A",
  green: "#1F7A4D", yellow: "#A86B12", purple: "#6D4BC4",
  red: "#B0322F", orange: "#C2651A", teal: "#0E7C86",
  text: "#16294A", muted: "#40506A", border: "#E7E0D2",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/SideTrails_GPUs_Beyond_AI.ipynb";

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
      <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>🥾 SIDE TRAIL (OPTIONAL) — GPUS BEYOND AI SIDE TRAILS · PART {part}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{what}</div>
      <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}><b style={{ color: C.green }}>You should see:</b> {expect}</div>
      <a href={LAB_URL} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", borderRadius: 8, background: C.orange, color: "#FFFFFF", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Open GPUs Beyond AI Side Trails in Colab ↗</a>
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

const BOOK_SECTION = "Appendix G (a Side Trail from Section 5.C)";
const TEXTBOOK = "Hwu, Kirk & El Hajj Ch 2–3, Ch 17–18";
const TEXTBOOK_KEY = "Hwu, Kirk & El Hajj = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 6e · Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Stallings = Computer Organization and Architecture, 11e";


// ── Section 1: One pattern, two questions ──
const JOBS = [
  { t: "Brighten every pixel of a 12-megapixel photo", out: "one pixel", gpu: true, why: "Each new pixel needs only its own old value: 1.2 crore independent outputs. This is the brighten kernel from Lesson 4.3." },
  { t: "Colour every pixel of a 3-D game scene, 60 times a second", out: "one pixel (one ray)", gpu: true, why: "Each ray needs only the scene, never another pixel. About 20 lakh rays per full-HD frame." },
  { t: "Keep a running bank balance through 1,000 transactions", out: "the balance after each transaction", gpu: false, why: "Each balance needs the previous one, so the outputs form a chain. One worker has to go step by step (Amdahl's serial part, Lesson 2.8)." },
  { t: "Work out tomorrow's temperature in every cell of a weather grid (one time step)", out: "one grid cell", gpu: true, why: "Each cell's next value needs only its neighbours' CURRENT values, so all cells of one step can be computed at once." },
  { t: "Run that weather model forward by 1,000 time steps", out: "the whole grid at each step", gpu: false, why: "Trick question! Step 2 needs step 1, so the STEPS can't run at the same time. The GPU still helps: it does each step's millions of cells in parallel, one step after another." },
  { t: "Price a share option by simulating 1 lakh random futures", out: "one random price path", gpu: true, why: "Each path uses its own random numbers, so the paths are independent. Average them at the end. This is Monte Carlo." },
  { t: "Match 1 crore short DNA reads against a genome", out: "the best match for one read", gpu: true, why: "Each read is matched on its own, so there are crores of independent outputs." },
  { t: "Read one small text file and print it", out: "one line of text", gpu: false, why: "Too little work: copying it to the GPU and launching a kernel would cost more than just doing it (Lesson 2.C)." },
];
function PatternWidget() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState(null);
  const [score, setScore] = useState(0);
  const j = JOBS[i];
  const choose = (g) => { if (pick !== null) return; setPick(g); if (g === j.gpu) setScore((s) => s + 1); };
  const next = () => { setPick(null); setI((v) => (v + 1) % JOBS.length); if (i === JOBS.length - 1) setScore(0); };
  return (
    <div>
      <Frame>
        In AI, one thread computes one cell of a matrix multiply (Lesson 2.3). Nothing about that is special to AI. Any job made of <b style={{ color: C.text }}>lakhs
        of small outputs that don't depend on each other</b> has the same shape. For each job, ask: <b style={{ color: C.accent }}>what is one output?</b> and
        <b style={{ color: C.accent }}> are the outputs independent?</b> Then decide.
      </Frame>
      <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ color: C.muted, fontSize: 11, letterSpacing: 1 }}>JOB {i + 1} OF {JOBS.length} · SCORE {score}</div>
        <div style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: "6px 0 10px" }}>{j.t}</div>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 12 }}>One output = <b style={{ color: C.teal }}>{j.out}</b></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn color={C.green} ghost={pick !== null && pick !== true} onClick={() => choose(true)}>⚡ GPU job: independent outputs</Btn>
          <Btn color={C.orange} ghost={pick !== null && pick !== false} onClick={() => choose(false)}>🐢 Not a GPU job (as it stands)</Btn>
        </div>
        {pick !== null && (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: (pick === j.gpu ? C.green : C.red) + "18", border: `1px solid ${(pick === j.gpu ? C.green : C.red)}55`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
            <b style={{ color: pick === j.gpu ? C.green : C.red }}>{pick === j.gpu ? "✓ Right." : "✗ Not quite."}</b> {j.why}
          </div>
        )}
        {pick !== null && <div style={{ marginTop: 10 }}><Btn onClick={next}>{i === JOBS.length - 1 ? "↺ Start again" : "Next job →"}</Btn></div>}
      </div>
      <Insight title="A GPU is not an AI machine. It is a machine for many independent outputs.">
        One thread per output, kept fed by a fast memory: graphics, simulation, finance, medical imaging and genomics all have that shape.
        GPUs were in fact built for one of them, drawing pictures, long before anyone trained a neural network on one.
      </Insight>
    </div>
  );
}

// ── Section 2: a real ray tracer, one "thread" per pixel ──
const SPH = [
  { c: [0, -1001, -3], r: 1000, col: [0.8, 0.8, 0.8], n: "the floor" },
  { c: [0, -0.2, -3.5], r: 0.8, col: [0.9, 0.2, 0.2], n: "the red sphere" },
  { c: [-1.7, -0.4, -4], r: 0.6, col: [0.2, 0.8, 0.3], n: "the green sphere" },
  { c: [1.6, -0.5, -3], r: 0.5, col: [0.2, 0.4, 0.9], n: "the blue sphere" },
];
const RW = 160, RH = 90, FOV = 0.6;
function lightDir(deg) {
  const a = (deg * Math.PI) / 180, v = [Math.cos(a), 1, Math.sin(a)], l = Math.hypot(...v);
  return v.map((x) => x / l);
}
function tracePixel(col, row, L, shadows) {
  let dx = (2 * (col + 0.5) / RW - 1) * (RW / RH) * FOV, dy = (1 - 2 * (row + 0.5) / RH) * FOV, dz = -1;
  const n = Math.hypot(dx, dy, dz); dx /= n; dy /= n; dz /= n;
  let best = 1e30, hit = -1;
  SPH.forEach((s, k) => {
    const ox = -s.c[0], oy = -s.c[1], oz = -s.c[2];
    const b = ox * dx + oy * dy + oz * dz, cc = ox * ox + oy * oy + oz * oz - s.r * s.r, disc = b * b - cc;
    if (disc > 0) { const t = -b - Math.sqrt(disc); if (t > 1e-3 && t < best) { best = t; hit = k; } }
  });
  if (hit < 0) { const k = 0.5 * (dy + 1); return { rgb: [1 - 0.5 * k, 1 - 0.3 * k, 1], hit, dir: [dx, dy, dz] }; }
  const s = SPH[hit], p = [best * dx, best * dy, best * dz], nn = p.map((v, k) => (v - s.c[k]) / s.r);
  let diff = Math.max(nn[0] * L[0] + nn[1] * L[1] + nn[2] * L[2], 0), facing = diff, blocker = null;
  if (shadows && diff > 0) {
    const q = p.map((v, k) => v + 1e-3 * nn[k]);
    for (const o of SPH) {
      const ox = q[0] - o.c[0], oy = q[1] - o.c[1], oz = q[2] - o.c[2];
      const b = ox * L[0] + oy * L[1] + oz * L[2], cc = ox * ox + oy * oy + oz * oz - o.r * o.r, disc = b * b - cc;
      if (disc > 0 && -b - Math.sqrt(disc) > 1e-3) { diff = 0; blocker = o.n; break; }
    }
  }
  const light = 0.15 + 0.85 * diff;
  return { rgb: s.col.map((v) => v * light), hit, dist: best, facing, light, blocker, dir: [dx, dy, dz] };
}
function RayWidget() {
  const canvas = useRef(null);
  const [deg, setDeg] = useState(50);
  const [shadows, setShadows] = useState(false);
  const [px, setPx] = useState([80, 45]);
  const [ms, setMs] = useState(null);
  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const ctx = cv.getContext("2d"), img = ctx.createImageData(RW, RH), L = lightDir(deg);
    const t0 = performance.now();
    for (let row = 0; row < RH; row++) for (let col = 0; col < RW; col++) {
      const { rgb } = tracePixel(col, row, L, shadows), k = 4 * (row * RW + col);
      img.data[k] = Math.min(255, rgb[0] * 255); img.data[k + 1] = Math.min(255, rgb[1] * 255); img.data[k + 2] = Math.min(255, rgb[2] * 255); img.data[k + 3] = 255;
    }
    setMs(performance.now() - t0);
    ctx.putImageData(img, 0, 0);
    ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 1; ctx.strokeRect(px[0] - 1.5, px[1] - 1.5, 4, 4);
  }, [deg, shadows, px]);
  const click = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPx([Math.min(RW - 1, Math.floor(((e.clientX - r.left) / r.width) * RW)), Math.min(RH - 1, Math.floor(((e.clientY - r.top) / r.height) * RH))]);
  };
  const info = tracePixel(px[0], px[1], lightDir(deg), shadows);
  const f = (v) => v.toFixed(2);
  return (
    <div>
      <Frame>
        A <b style={{ color: C.text }}>ray tracer</b> draws a 3-D scene the way light works, backwards. For each pixel: send a ray from the camera through it,
        find the <b style={{ color: C.text }}>nearest</b> sphere it hits, and colour that point by how directly it faces the light. The picture below is a real
        ray tracer, running in your browser. <b style={{ color: C.accent }}>Click any pixel</b> to see what its thread does.
      </Frame>
      <canvas ref={canvas} width={RW} height={RH} onClick={click} style={{ width: "100%", imageRendering: "pixelated", borderRadius: 10, border: `1px solid ${C.border}`, cursor: "crosshair" }} />
      <Slider label={<>Light direction: <b style={{ color: C.yellow }}>{deg}°</b> round the scene</>} value={deg} min={0} max={359} onChange={setDeg} color={C.yellow} />
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <Btn color={C.purple} ghost={!shadows} onClick={() => setShadows((v) => !v)}>{shadows ? "🌑 Shadows ON (a 2nd ray per pixel)" : "Shadows OFF"}</Btn>
        {ms !== null && <span style={{ color: C.muted, fontSize: 12 }}>Your browser drew all {(RW * RH).toLocaleString("en-IN")} pixels one after another in <b style={{ color: C.orange }}>{ms.toFixed(1)} ms</b>, on one CPU core.</span>}
      </div>
      <div style={{ background: C.card, border: `1.5px solid ${C.teal}`, borderRadius: 10, padding: 14, fontSize: 13, color: C.muted, lineHeight: 1.8 }}>
        <div style={{ color: C.teal, fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>THE THREAD FOR PIXEL (column {px[0]}, row {px[1]})</div>
        <div>① Ray direction: ({f(info.dir[0])}, {f(info.dir[1])}, {f(info.dir[2])}). It tests all {SPH.length} spheres.</div>
        {info.hit < 0 ? <div>② It hits nothing, so the pixel shows the <b style={{ color: C.accent }}>sky</b>.</div> : (<>
          <div>② Nearest hit: <b style={{ color: C.text }}>{SPH[info.hit].n}</b>, {f(info.dist)} units away.</div>
          <div>③ How directly the surface faces the light: <b style={{ color: C.yellow }}>{Math.round(info.facing * 100)}%</b>{shadows && (info.blocker ? <> · shadow ray <b style={{ color: C.red }}>blocked by {info.blocker}</b></> : info.facing > 0 ? <> · shadow ray <b style={{ color: C.green }}>reaches the light</b></> : null)}.</div>
          <div>④ Brightness = 15% everywhere + 85% × direct light = <b style={{ color: C.text }}>{Math.round(info.light * 100)}%</b> of its colour.</div>
        </>)}
        <div style={{ marginTop: 4 }}>It never looked at any other pixel. <b style={{ color: C.green }}>That is why every pixel can have its own GPU thread.</b></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10, marginTop: 14 }}>
        <Code color={C.yellow} title="🐍 ONE CPU WORKER: a loop over every pixel">{`for row in range(H):
    for col in range(W):
        img[row, col] = trace_pixel(col, row, W, H)`}</Code>
        <Code color={C.green} title="⚡ CUDA KERNEL: each thread finds ITS pixel">{`int col = blockIdx.x * blockDim.x + threadIdx.x;
int row = blockIdx.y * blockDim.y + threadIdx.y;
if (col >= W || row >= H) return;
// ...then the same steps as trace_pixel`}</Code>
      </div>
      <Insight title="The kernel is the same function as trace_pixel. Only the first lines change.">
        The two loops disappear: the 2-D grid of blocks and threads from Lesson 4.3 hands each thread its own (row, col), and lakhs of pixels are traced at the same time.
      </Insight>
      <LabCard part="B" title="Shadows and a moving light"
        what="Time a full-HD frame with and without shadows (a second ray per lit pixel), then swing the light round the scene for 60 frames and count the frames per second."
        expect="shadows costing only a little more per frame, and hundreds of full-HD frames per second with shadows, far more than the 60 a game needs." />
    </div>
  );
}

// ── Section 3: the race (our run, RTX 4050 laptop GPU) ──
const SIZES = [
  { n: "640 × 360", px: 230400, np: 72, gpu: 0.02, x: 3532 },
  { n: "1280 × 720 (HD)", px: 921600, np: 284, gpu: 0.07, x: 4150 },
  { n: "1920 × 1080 (full HD)", px: 2073600, np: 601, gpu: 0.15, x: 4031 },
  { n: "3840 × 2160 (4K)", px: 8294400, np: 2377, gpu: 1.03, x: 2305 },
];
const PY_US = 2.1;   // plain Python: µs per pixel in our run
function RaceWidget() {
  const [k, setK] = useState(2);
  const s = SIZES[k];
  const rows = [
    { n: "Plain Python, one pixel at a time", ms: (s.px * PY_US) / 1000, c: C.red, est: true },
    { n: "NumPy, all pixels as arrays (CPU)", ms: s.np, c: C.orange },
    { n: "CUDA kernel, one thread per pixel (GPU)", ms: s.gpu, c: C.green },
  ];
  const lg = (v) => Math.log10(v), lo = lg(0.01), hi = lg(20000);
  const w = (v) => Math.max(2, ((lg(v) - lo) / (hi - lo)) * 100);
  return (
    <div>
      <Frame>
        A game shows 60 frames a second, so each frame gets <b style={{ color: C.text }}>16.7 ms</b>. Pick a picture size and compare three ways of tracing it.
        The times are from our run of the GPUs Beyond AI notebook on an RTX 4050 laptop GPU (the Python times are scaled up from a small picture). On Colab's T4 the numbers differ, but the story doesn't.
      </Frame>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {SIZES.map((z, i) => <Btn key={i} ghost={i !== k} onClick={() => setK(i)}>{z.n}</Btn>)}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <Stat label="RAYS PER FRAME" value={s.px.toLocaleString("en-IN")} />
        <Stat label="RAYS PER SECOND AT 60 FPS" value={(s.px * 60).toLocaleString("en-IN")} color={C.purple} />
      </div>
      <div style={{ position: "relative", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 14px 8px" }}>
        {rows.map((r, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 4 }}>
              <span>{r.n}</span>
              <span style={{ color: r.ms <= 16.7 ? C.green : C.red, fontFamily: "monospace" }}>{r.est ? "≈ " : ""}{r.ms >= 100 ? r.ms.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : r.ms.toFixed(2)} ms · {1000 / r.ms < 10 ? (1000 / r.ms).toFixed(1) : Math.round(1000 / r.ms).toLocaleString("en-IN")} frames/s</span>
            </div>
            <div style={{ height: 14, background: C.surface, borderRadius: 4, position: "relative" }}>
              <div style={{ width: `${w(r.ms)}%`, height: "100%", background: r.c, borderRadius: 4, transition: "width 0.4s" }} />
              <div style={{ position: "absolute", left: `${w(16.7)}%`, top: -3, bottom: -3, borderLeft: `2px dashed ${C.yellow}` }} />
            </div>
          </div>
        ))}
        <div style={{ color: C.yellow, fontSize: 11 }}>┆ dashed line = 16.7 ms (60 frames per second) · bars on a log scale</div>
      </div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginTop: 10 }}>
        GPU vs NumPy at this size: <b style={{ color: C.green }}>{s.x.toLocaleString("en-IN")}× faster</b>. Be honest about the race: NumPy writes every
        in-between result to memory as a whole array, so it is memory-bound; a hand-written multi-core C version would close part of the gap. The GPU still wins by a wide margin.
      </div>
      <Insight color={C.purple} title="Real games test rays against millions of triangles, so NVIDIA added RT cores just for that test.">
        It's the same story as Tensor Cores (Lesson 3.1): when one calculation dominates, the hardware grows a unit for it. The T4 has 40 RT cores, one per SM.
        Ray tracing is used in game engines, film and animation, architecture and AR/VR.
      </Insight>
      <LabCard part="A" title="A ray tracer, one thread per pixel"
        what="Trace one pixel in plain Python, then every pixel with NumPy on the CPU and with a CUDA kernel on the GPU (the same function, one thread per pixel). Race them at four picture sizes."
        expect="the GPU picture matching the CPU's, and the GPU kernel hundreds to thousands of times faster than NumPy, at well over 60 frames per second in full HD." />
    </div>
  );
}

// ── Section 4: Monte Carlo, the other fields, and careers ──
const FIELDS = [
  { t: "🌦️ Simulation", out: "one grid cell or atom, at one time step", why: "each cell's next value needs only its neighbours' current values", who: "weather and climate, aircraft and car design (fluid flow), drug design (molecules), national supercomputing centres" },
  { t: "🩻 Medical imaging", out: "one voxel (a 3-D pixel) of a CT or MRI scan", why: "every voxel is rebuilt from the same measurements, independently", who: "medical-device and health-tech companies" },
  { t: "🎥 Vision & video", out: "one pixel of a filtered or decoded frame", why: "each pixel needs only a small patch around it", who: "cameras, drones, robots and cars (small GPUs such as NVIDIA Jetson)" },
  { t: "💹 Finance", out: "one random future path of a price", why: "each path uses its own random numbers", who: "banks, trading firms, risk-analytics companies" },
  { t: "🧬 Genomics", out: "the best match for one DNA read", why: "each read is matched on its own", who: "sequencing labs and bioinformatics companies" },
  { t: "📡 Signals & data", out: "one frequency, or one row of a table", why: "rows are filtered and summed in parallel", who: "5G and radar, data analytics (GPU dataframes such as RAPIDS cuDF)" },
];
function BeyondWidget() {
  const canvas = useRef(null);
  const [n, setN] = useState(0);
  const [inside, setInside] = useState(0);
  const [fi, setFi] = useState(0);
  const SZ = 220;
  const throwDarts = (m) => {
    const ctx = canvas.current.getContext("2d");
    let hit = 0;
    for (let k = 0; k < m; k++) {
      const x = Math.random(), y = Math.random(), inn = x * x + y * y < 1;
      if (inn) hit++;
      if (n + k < 20000) { ctx.fillStyle = inn ? C.green : C.red; ctx.fillRect(x * SZ, SZ - y * SZ, 1.6, 1.6); }
    }
    setN((v) => v + m); setInside((v) => v + hit);
  };
  const reset = () => {
    const ctx = canvas.current.getContext("2d");
    ctx.fillStyle = C.card; ctx.fillRect(0, 0, SZ, SZ);
    ctx.strokeStyle = C.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, SZ, SZ, -Math.PI / 2, 0); ctx.stroke();
    setN(0); setInside(0);
  };
  useEffect(() => { reset(); }, []);
  const est = n ? (4 * inside) / n : null;
  const f = FIELDS[fi];
  return (
    <div>
      <Frame>
        <b style={{ color: C.text }}>Monte Carlo</b> means "try lots of random cases and average them". Banks price options this way, with lakhs of random futures.
        The simplest example: throw darts at a 1 × 1 square. The share that lands inside the quarter circle is π ÷ 4, so <b style={{ color: C.accent }}>π ≈ 4 × inside ÷ all</b>.
        One dart is one independent output.
      </Frame>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <canvas ref={canvas} width={SZ} height={SZ} style={{ borderRadius: 8, border: `1px solid ${C.border}`, maxWidth: "100%" }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <Btn onClick={() => throwDarts(100)}>+100 darts</Btn>
            <Btn onClick={() => throwDarts(1000)}>+1,000</Btn>
            <Btn onClick={() => throwDarts(100000)}>+1 lakh</Btn>
            <Btn ghost onClick={reset}>↺</Btn>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Stat label="DARTS" value={n.toLocaleString("en-IN")} />
            <Stat label="π ESTIMATE" value={est ? est.toFixed(4) : "—"} color={C.accent} />
            <Stat label="ERROR" value={est ? Math.abs(est - Math.PI).toFixed(4) : "—"} color={C.orange} />
          </div>
          <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 8 }}>
            The error shrinks only as 1 ÷ √(darts): 100 times more darts buy just one more correct digit. That hunger for samples is why Monte Carlo
            suits a GPU. In our lab run the GPU threw 5 crore darts 54× faster than NumPy.
          </div>
        </div>
      </div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 14, margin: "18px 0 8px" }}>A tour of the other fields: click each one</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {FIELDS.map((x, i) => <Btn key={i} color={C.teal} ghost={i !== fi} onClick={() => setFi(i)}>{x.t}</Btn>)}
      </div>
      <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 8, background: C.teal + "12", border: `1px solid ${C.teal}55`, color: C.muted, fontSize: 13, lineHeight: 1.8 }}>
        <div>One output = <b style={{ color: C.text }}>{f.out}</b></div>
        <div>Independent because <b style={{ color: C.text }}>{f.why}</b></div>
        <div>Who uses it: {f.who}</div>
      </div>
      <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: C.yellow + "14", border: `1px solid ${C.yellow}55`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        ⚠️ <b style={{ color: C.yellow }}>Science often needs FP64.</b> AI is happy with FP16 or INT8 (Lesson 5.2). A weather model run for thousands of steps lets small rounding errors grow,
        so it uses FP64 (8 bytes). AI-oriented GPUs run FP64 slowly: the T4 at about 1/32 of its FP32 speed. Check the precision a job needs before choosing a GPU.
      </div>
      <Insight color={C.green} title="Everything from Lessons 2–5 carries over: count the work, decide CPU or GPU, map outputs to threads, feed the cores, choose the precision, profile.">
        Each field adds its own knowledge (graphics, physics, finance or biology). The roles: GPU/CUDA software engineer, graphics and rendering engineer, HPC engineer,
        performance engineer, and AI kernel engineer (writing the GPU kernels that AI frameworks call, a scarce skill today). Each niche is small and expects depth, and this
        course is the first step. Next: the rest of Kirk &amp; Hwu, NVIDIA's free tutorials, and two or three <b>measured</b> GPU projects, starting with your mini-project.
      </Insight>
      <LabCard part="C" title="Monte Carlo: estimate π with 5 crore darts"
        what="Throw 5 crore random darts on the CPU (NumPy) and on the GPU (CuPy), count the ones inside the quarter circle, and compare the times and the error in π."
        expect="π correct to about 3 decimal places, with the GPU tens of times faster. Try 50,000 darts too and watch the error grow." />
    </div>
  );
}

const QUESTIONS = [
  { q: "Which two questions tell you whether a problem suits a GPU?", options: ["Is it about AI? Is the data big?", "What is one output? Are the outputs independent of each other?", "Is it written in Python? Does it use NumPy?", "Is the CPU busy? Is the GPU cheap?"], answer: 1, explain: "If there are lakhs of outputs that don't depend on each other, give each one a thread. That is the whole pattern, in AI or anywhere else." },
  { q: "In the ray tracer, why can every pixel have its own GPU thread?", options: ["Because pixels are small", "Each ray needs only the scene, never another pixel's result", "Because the GPU has exactly one core per pixel", "Because ray tracing uses Tensor Cores"], answer: 1, explain: "Independent outputs: the thread for one pixel never waits for another. (There are more pixels than cores; the GPU runs them in waves of warps.)" },
  { q: "What are RT cores for?", options: ["Speeding up matrix multiplies", "Testing rays against triangles very fast, for graphics", "Decoding video", "Storing the picture"], answer: 1, explain: "Just as Tensor Cores were added for AI's matrix multiplies, RT cores were added for ray tracing's most common test." },
  { q: "A climate scientist chooses a GPU. Why might the T4 be a poor fit, though it is fine for AI?", options: ["It has no CUDA cores", "Long simulations often need FP64, and the T4 runs FP64 at only about 1/32 of its FP32 speed", "Climate models can't run in parallel", "The T4 has too much memory"], answer: 1, explain: "Precision needs differ by field. AI is happy with FP16/INT8; much of science and finance needs FP64, where GPUs built for science are far faster." },
];
const RESULT = {
  perfect: "Perfect! You can spot the GPU pattern anywhere, not just in AI.",
  good: "Well done. Play 'One Pattern' again and try to explain each answer before you click.",
  low: "Revisit 'One Pattern': what is one output, and are the outputs independent?",
  done: "Side Trail complete! 🥾",
  body: "From rules vs learning to ray tracing: you understand how AI uses GPUs, you can measure, speed up and plan GPU work, and you can spot the same pattern in graphics, simulation and finance.",
  next: "What next?",
  teaser: "Do your mini-project (an AI task, or a GPU application beyond AI), keep your notebooks, and build two or three measured GPU projects. Get your footing. Keep climbing.",
};

const UNIT_WORDS = [
  ["ray tracing", "drawing by following rays of light", "Send one ray per pixel into the scene and colour the nearest thing it hits.", "new here"],
  ["RT core", "ray-tracing core", "A GPU unit that tests rays against triangles very fast. The T4 has 40.", "new here"],
  ["normal", "the surface's outward direction", "Compared with the light's direction, it tells how brightly a point is lit.", "new here"],
  ["Monte Carlo", "a method named after a casino", "Estimate an answer by averaging many independent random trials.", "new here"],
  ["voxel", "volume pixel", "A tiny 3-D cube of a CT or MRI scan.", "new here"],
  ["FP64", "64-bit floating point (double precision)", "8 bytes per number; needed by much of science and finance.", "from Lesson 5.2"],
  ["HPC", "high-performance computing", "Running big simulations on supercomputers full of CPUs and GPUs.", "new here"],
  ["CuPy", "NumPy for CUDA GPUs", "Runs array maths and our own CUDA kernels on the GPU.", "from Step 3"],
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
        📖 Short names in this lesson: <span style={{ fontFamily: "monospace", fontWeight: 400 }}>{UNIT_WORDS.map((w) => w[0]).join(" · ")}</span> {open ? "▲" : "▼ tap to see what they mean"}
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
        📘 Course book: <span style={{ fontWeight: 400, color: C.text }}><i>A Billion Small Steps</i>, {BOOK_SECTION}</span> {open ? "▲" : "▼ further reading"}
      </button>
      {open && <div style={{ marginTop: 6, fontSize: 12, color: C.muted, lineHeight: 1.7 }}><b style={{ color: C.text }}>Further reading:</b> {TEXTBOOK}<br />{TEXTBOOK_KEY}</div>}
    </div>
  );
}

export default function Unit5_10({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "One Pattern" },
    { id: "s1", label: "One Ray per Pixel" },
    { id: "s2", label: "The Race" },
    { id: "s3", label: "Beyond: Fields & Careers" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🧭 One Pattern, Two Questions</h3><PatternWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🌈 Ray Tracing: One Thread per Pixel</h3><RayWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🏁 The Race: CPU vs GPU, 60 Frames a Second</h3><RaceWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🌍 Monte Carlo, the Other Fields, and Careers</h3><BeyondWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Lesson 5.10.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🌈</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>STEP 5 › LESSON 5.10 · 🥾 SIDE TRAIL</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>GPUs Beyond AI: Applications & Careers</div>
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
