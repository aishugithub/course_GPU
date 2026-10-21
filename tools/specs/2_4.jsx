//@@META
{"unit": "2.4", "module": 2, "title": "Amdahl's Law", "icon": "⚖️", "lab": "Lab2_CPU_vs_GPU.ipynb", "labNo": "2", "gpu": true}
//@@WIDGETS

const speedup = (p, s) => 1 / ((1 - p) + p / s);

// ── Section 1: Need — 100× faster part, 3× faster whole ──
function NeedWidget() {
  const [gpu, setGpu] = useState(false);
  const load = 30, mm = 70;
  const mmNew = gpu ? mm / 100 : mm;
  const total = load + mmNew;
  return (
    <div>
      <Frame>
        One training step takes 100 ms on the CPU: <b style={{ color: C.orange }}>30 ms</b> loading and preparing the next batch of images (plain
        Python), and <b style={{ color: C.accent }}>70 ms</b> of matrix multiplies. A GPU makes matrix multiplies <b style={{ color: C.green }}>100× faster</b>.
        Move them to the GPU and predict the new total first.
      </Frame>
      <Btn onClick={() => setGpu((v) => !v)} color={C.green}>{gpu ? "◀ Back to CPU only" : "Move the matrix multiplies to the GPU (100×) ▶"}</Btn>
      <div style={{ display: "flex", height: 44, marginTop: 14, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
        <div style={{ width: `${load}%`, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", color: "#0D1117", fontSize: 12, fontWeight: 700 }}>load 30 ms</div>
        <div style={{ width: `${mmNew}%`, minWidth: 4, background: gpu ? C.green : C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#0D1117", fontSize: 12, fontWeight: 700, transition: "width 0.6s" }}>{gpu ? "" : "matmul 70 ms"}</div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <Stat label="STEP TIME" value={`${total.toFixed(1)} ms`} color={gpu ? C.green : C.text} />
        <Stat label="OVERALL SPEED-UP" value={`${(100 / total).toFixed(2)}×`} color={C.purple} />
      </div>
      {gpu && (
        <Insight color={C.red} title="The matrix part got 100× faster, but the whole step only about 3.3× faster.">
          The 30 ms of loading didn't change, and now it's almost all the time that's left. However fast the GPU gets, this step can never take less
          than 30 ms. That's Amdahl's law.
        </Insight>
      )}
    </div>
  );
}

// ── Section 2: The law ──
function LawWidget() {
  const [p, setP] = useState(0.9);
  const [s, setS] = useState(10);
  const S = speedup(p, s);
  const cap = 1 / (1 - p);
  const X = (v) => 40 + (Math.log10(v) / 3) * 460, Y = (v) => 170 - (Math.min(v, 22) / 22) * 155;
  return (
    <div>
      <Frame>
        Gene Amdahl (1967): if a fraction <b style={{ color: C.accent }}>p</b> of a program's time can be sped up by a factor
        <b style={{ color: C.green }}> s</b>, and the rest can't, the overall speed-up is:
      </Frame>
      <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 17, color: C.text, background: C.card, borderRadius: 10, padding: 12, border: `1px solid ${C.border}` }}>
        S = 1 / ( (1 − <span style={{ color: C.accent }}>p</span>) + <span style={{ color: C.accent }}>p</span> / <span style={{ color: C.green }}>s</span> )
      </div>
      <Slider label={<>Parallel fraction p = <b style={{ color: C.accent }}>{Math.round(p * 100)}%</b></>} value={p} min={0} max={0.99} step={0.01} onChange={setP} />
      <Slider label={<>Speed-up of that part s = <b style={{ color: C.green }}>{s}×</b></>} value={s} min={1} max={1000} onChange={setS} color={C.green} />
      <div style={{ fontFamily: "monospace", fontSize: 13, color: C.yellow, marginBottom: 8 }}>
        S = 1 / ({(1 - p).toFixed(2)} + {p.toFixed(2)} / {s}) = <b>{S.toFixed(2)}×</b>
      </div>
      <svg viewBox="0 0 520 185" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <line x1="40" x2="500" y1={Y(cap)} y2={Y(cap)} stroke={C.red} strokeDasharray="5 4" />
        <text x="44" y={Y(cap) - 5} fill={C.red} fontSize="10">ceiling = 1 / (1 − p) = {cap.toFixed(1)}×</text>
        <polyline fill="none" stroke={C.purple} strokeWidth="2.5" points={Array.from({ length: 61 }, (_, i) => 10 ** (i * 0.05)).map((v) => `${X(v)},${Y(speedup(p, v))}`).join(" ")} />
        <circle cx={X(s)} cy={Y(S)} r="6" fill={C.yellow} />
        {[1, 10, 100, 1000].map((v) => <text key={v} x={X(v)} y="182" fill={C.muted} fontSize="10" textAnchor="middle">s = {v}</text>)}
      </svg>
      <Insight color={C.purple} title="The part you can't speed up sets a hard ceiling: 1 / (1 − p).">
        With p = 90%, even an infinitely fast GPU gives at most 10×. To get big speed-ups, p must be very close to 100%: almost all the time
        must be spent in parallel work.
      </Insight>
    </div>
  );
}

// ── Section 3: The dosa kitchen ──
function KitchenWidget() {
  const [cooks, setCooks] = useState(1);
  const grind = 60;                     // one grinder: can't be shared
  const dosas = 100 * 3;                // 100 dosas × 3 min each, one tawa per cook
  const total = grind + dosas / cooks;
  return (
    <div>
      <Frame>
        A wedding needs 100 dosas. First the batter must be ground: <b style={{ color: C.orange }}>60 minutes in the only grinder</b> (one machine,
        no sharing). Then each dosa takes <b style={{ color: C.green }}>3 minutes on a tawa</b>, and every extra cook brings a tawa. Hire cooks.
      </Frame>
      <Slider label={<>Cooks = <b style={{ color: C.green }}>{cooks}</b></>} value={cooks} min={1} max={100} onChange={setCooks} color={C.green} />
      <div style={{ display: "flex", height: 40, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
        <div style={{ width: `${(grind / 360) * 100}%`, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", color: "#0D1117", fontSize: 11.5, fontWeight: 700 }}>grind 60</div>
        <div style={{ width: `${(dosas / cooks / 360) * 100}%`, minWidth: 3, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", color: "#0D1117", fontSize: 11.5, fontWeight: 700 }}>{cooks < 4 ? `dosas ${(dosas / cooks).toFixed(0)}` : ""}</div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="TOTAL TIME" value={`${total.toFixed(0)} min`} color={C.text} />
        <Stat label="SPEED-UP vs 1 COOK" value={`${(360 / total).toFixed(2)}×`} color={C.purple} />
        <Stat label="BEST POSSIBLE" value="6× (360 ÷ 60)" color={C.red} />
      </div>
      <Insight color={C.orange} title="Hiring the 100th cook barely helps: the grinder is the bottleneck.">
        In AI the "grinder" is often the CPU-side work: reading files, decoding images, Python code between GPU calls. A fast GPU waiting for
        slow data is a very expensive idle machine.
      </Insight>
    </div>
  );
}

// ── Section 4: What should you optimise? ──
const PARTS = [
  { k: "load", t: "Read images from disk", pct: 20, c: C.orange },
  { k: "prep", t: "Decode & resize (CPU)", pct: 15, c: C.yellow },
  { k: "copy", t: "Copy to GPU", pct: 10, c: C.teal },
  { k: "compute", t: "Forward + backward", pct: 50, c: C.green },
  { k: "log", t: "Logging & saving", pct: 5, c: C.purple },
];
function OptimiseWidget() {
  const [pick, setPick] = useState(null);
  const res = (k) => 1 / PARTS.reduce((s, x) => s + (x.k === k ? x.pct / 10 : x.pct) / 100, 0);
  return (
    <div>
      <Frame>
        Your training step is split up as below. Your budget buys <b style={{ color: C.text }}>ONE 10× upgrade</b> for ONE part. Which part gives the
        biggest overall speed-up? Pick one, then try the others.
      </Frame>
      <div style={{ display: "flex", height: 40, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 10 }}>
        {PARTS.map((x) => <div key={x.k} style={{ width: `${pick === x.k ? x.pct / 10 : x.pct}%`, minWidth: 3, background: x.c, transition: "width 0.5s" }} title={x.t} />)}
      </div>
      {PARTS.map((x) => (
        <div key={x.k} onClick={() => setPick(x.k)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 8, marginBottom: 5, cursor: "pointer", background: pick === x.k ? x.c + "22" : C.card, border: `1.5px solid ${pick === x.k ? x.c : C.border}` }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: x.c }} />
          <div style={{ flex: 1, color: C.text, fontSize: 13 }}>{x.t}</div>
          <div style={{ color: C.muted, fontFamily: "monospace", fontSize: 12 }}>{x.pct}% of time</div>
          {pick && <div style={{ fontFamily: "monospace", fontSize: 12, color: x.k === "compute" ? C.green : C.muted, minWidth: 70, textAlign: "right" }}>→ {res(x.k).toFixed(2)}×</div>}
        </div>
      ))}
      {pick && (
        <Insight color={C.green} title="Speed up the biggest part first, and remember that the small parts become the new bottleneck.">
          10× on compute gives 1.82×; 10× on logging gives only 1.05×. After upgrading compute, loading (20%) and decoding (15%) become most of
          the remaining time. That's why real AI code uses several CPU workers to load data in parallel (PyTorch's DataLoader
          <code> num_workers</code>).
        </Insight>
      )}
      <LabCard part="D" title="Amdahl's law on a real GPU"
        what="Build a fake training loop with a slow CPU part (Python preprocessing) and a GPU matrix multiply, time each part, then predict the speed-up with Amdahl's law and compare it with what you measure."
        expect="your Amdahl prediction lands close to the measured speed-up, and the CPU part sets the ceiling." />
    </div>
  );
}
//@@SECTIONS
[["100× but only 3×?", "🤨 100× Faster, But Only 3× Overall?", "NeedWidget"],
 ["The Law", "⚖️ Amdahl's Law — S = 1 / ((1 − p) + p/s)", "LawWidget"],
 ["The Dosa Kitchen", "🥞 The Dosa Kitchen — the grinder is the bottleneck", "KitchenWidget"],
 ["What to Optimise?", "🎯 What Should You Optimise?", "OptimiseWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "80% of a program can be sped up 4×. What is the overall speed-up?", options: ["4×", "3.2×", "2.5×", "1.8×"], answer: 2, explain: "S = 1 / (0.2 + 0.8/4) = 1 / (0.2 + 0.2) = 1 / 0.4 = 2.5×." },
  { q: "95% of a program is parallel. With an infinitely fast GPU, the best possible speed-up is…", options: ["95×", "20×", "100×", "Infinite"], answer: 1, explain: "Ceiling = 1 / (1 − p) = 1 / 0.05 = 20×. The serial 5% never shrinks." },
  { q: "A GPU training job shows the GPU busy only 30% of the time. What is the most likely bottleneck?", options: ["The GPU is too slow", "CPU-side data loading and preprocessing", "Too much GPU memory", "The learning rate"], answer: 1, explain: "The GPU sits waiting for data. Speed up the input pipeline (for example with more DataLoader workers) before buying a faster GPU." },
  { q: "Which part should you optimise first?", options: ["The smallest part", "The part that takes the largest share of the time", "The part that's easiest to explain", "Whichever runs on the CPU"], answer: 1, explain: "Amdahl says the gain is limited by the fraction you improve. Start with the biggest slice of time." },
];
const RESULT = {
  perfect: "Perfect! You can predict real-world speed-ups.",
  good: "Good. Replay 'The Law' and drag p close to 100%.",
  low: "Revisit 'The Dosa Kitchen': the part you can't parallelise decides everything.",
  done: "Unit 2.4 Complete!",
  body: "You can apply Amdahl's law, find the ceiling 1 / (1 − p), and choose what to optimise.",
  next: "Next up: Unit 2.C — Capstone: CPU or GPU?",
  teaser: "Put it all together: for any job, decide where it should run, then prove it on a real GPU.",
};
//@@WORDS
const UNIT_WORDS = [
  ["p", "parallel fraction", "The share of a program's time that can be sped up.", "new here"],
  ["s", "speed-up of the parallel part", "How many times faster that part gets (for example on a GPU).", "new here"],
  ["S", "overall speed-up", "Old total time ÷ new total time.", "new here"],
  ["num_workers", "a DataLoader setting", "How many CPU processes load data in parallel in PyTorch.", "new here"],
];
