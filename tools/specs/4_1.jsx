//@@META
{"unit": "4.1", "module": 4, "title": "SMs, Cores & Tensor Cores", "icon": "🔬", "lab": "Lab04_Inside_a_GPU.ipynb", "labNo": 4, "gpu": true}
//@@WIDGETS

// NVIDIA T4 (Turing) published figures
const T4 = { sms: 40, coresPerSM: 64, tensorPerSM: 8, boostGHz: 1.59, l2MB: 4, memGB: 16, bwGBs: 320 };

// ── Section 1: Need — 2,560 workers need an organisation ──
function NeedWidget() {
  const [org, setOrg] = useState(false);
  return (
    <div>
      <Frame>
        2,560 workers can't each take orders from one manager: the manager would spend all day giving instructions. Your university solves the
        same problem with layers. Toggle between a flat crowd and an organisation.
      </Frame>
      <Btn onClick={() => setOrg((v) => !v)} color={C.purple}>{org ? "◀ Flat crowd" : "Organise them ▶"}</Btn>
      <div style={{ marginTop: 14, background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
        {!org ? (
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>{Array.from({ length: 640 }, (_, i) => <div key={i} style={{ width: 6, height: 6, borderRadius: 1, background: C.muted }} />)}</div>
            <div style={{ color: C.red, fontSize: 12.5, marginTop: 8 }}>👤 One manager shouting instructions to 2,560 people: chaos.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["🏛️ University", "🖥️ The GPU chip", "the whole thing"], ["🏫 40 colleges", "📦 40 Streaming Multiprocessors (SMs)", "each runs its own work"], ["👩‍🏫 4 departments per college", "🧭 4 processing blocks per SM", "each with its own warp scheduler"], ["🧑‍🎓 16 students per department", "➕ 16 CUDA cores per block", "do the arithmetic"]].map(([u, g, d]) => (
              <div key={u} style={{ gridColumn: "span 2", display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 10, alignItems: "center", borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
                <div style={{ color: C.muted, fontSize: 13 }}>{u}</div>
                <div style={{ color: C.text, fontSize: 13 }}><b style={{ color: C.green }}>{g}</b> <span style={{ color: C.muted }}>({d})</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
      {org && (
        <Insight color={C.green} title="40 SMs × 4 blocks × 16 cores = 2,560 CUDA cores, organised in layers.">
          Each layer has its own "manager": the chip hands work to SMs, and each SM's schedulers hand instructions to warps of 32 threads. Nobody
          has to instruct 2,560 cores one by one.
        </Insight>
      )}
    </div>
  );
}

// ── Section 2: Zoom in ──
const LEVELS = [
  { k: "chip", t: "The T4 chip", d: "40 SMs share a 4 MB L2 cache and connect to 16 GB of GDDR6 memory at 320 GB/s. The chip is a team of 40 near-identical mini-processors." },
  { k: "sm", t: "One SM (Streaming Multiprocessor)", d: "An SM is like a small, very wide processor: 64 CUDA cores, 8 Tensor Cores, a 256 KB register file, 96 KB of L1 cache/shared memory, and 4 warp schedulers. It can keep up to 32 warps (1,024 threads) on the go at once." },
  { k: "block", t: "One processing block (a quarter of an SM)", d: "One warp scheduler issues one instruction per clock to a warp of 32 threads, using the block's 16 CUDA cores and 2 Tensor Cores (a 32-thread instruction is spread over 2 clocks). Its 64 KB of registers hold the private variables of every thread it looks after." },
];
function ZoomWidget() {
  const [lv, setLv] = useState(0);
  return (
    <div>
      <Frame>Zoom into Colab's T4, level by level. (Published Turing/T4 figures; the drawing is simplified.)</Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {LEVELS.map((l, i) => <Btn key={l.k} ghost={i !== lv} onClick={() => setLv(i)}>{i === 0 ? "🖥️ Chip" : i === 1 ? "📦 SM" : "🧭 Block"}</Btn>)}
      </div>
      <svg viewBox="0 0 520 230" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        {lv === 0 && (
          <g>
            {Array.from({ length: 40 }, (_, i) => <rect key={i} x={20 + (i % 10) * 49} y={20 + Math.floor(i / 10) * 38} width="42" height="32" rx="4" fill={C.green + "33"} stroke={C.green} />)}
            {Array.from({ length: 40 }, (_, i) => <text key={"t" + i} x={41 + (i % 10) * 49} y={40 + Math.floor(i / 10) * 38} fill={C.text} fontSize="9" textAnchor="middle">SM</text>)}
            <rect x="20" y="176" width="480" height="20" rx="4" fill={C.teal + "33"} stroke={C.teal} /><text x="260" y="190" fill={C.text} fontSize="11" textAnchor="middle">L2 cache (4 MB), shared by all SMs</text>
            <rect x="20" y="202" width="480" height="20" rx="4" fill={C.purple + "33"} stroke={C.purple} /><text x="260" y="216" fill={C.text} fontSize="11" textAnchor="middle">memory controllers → 16 GB GDDR6 (off-chip) · 320 GB/s</text>
          </g>
        )}
        {lv === 1 && (
          <g>
            {[0, 1, 2, 3].map((b) => (
              <g key={b}>
                <rect x={20 + b * 122} y="14" width="112" height="150" rx="6" fill={C.surface} stroke={C.accent} />
                <text x={76 + b * 122} y="30" fill={C.accent} fontSize="10" textAnchor="middle">block {b}: warp scheduler</text>
                {Array.from({ length: 16 }, (_, i) => <rect key={i} x={28 + b * 122 + (i % 4) * 25} y={40 + Math.floor(i / 4) * 18} width="20" height="14" rx="2" fill={C.green} opacity="0.75" />)}
                <rect x={28 + b * 122} y="116" width="45" height="18" rx="3" fill={C.orange} /><rect x={78 + b * 122} y="116" width="45" height="18" rx="3" fill={C.orange} />
                <text x={76 + b * 122} y="152" fill={C.muted} fontSize="9" textAnchor="middle">registers 64 KB</text>
              </g>
            ))}
            <rect x="20" y="172" width="480" height="22" rx="4" fill={C.teal + "33"} stroke={C.teal} /><text x="260" y="187" fill={C.text} fontSize="11" textAnchor="middle">96 KB L1 cache / shared memory, shared by the 4 blocks</text>
            <text x="20" y="214" fill={C.green} fontSize="10">■ CUDA core (FP32)</text><text x="140" y="214" fill={C.orange} fontSize="10">■ Tensor Core</text>
          </g>
        )}
        {lv === 2 && (
          <g>
            <rect x="20" y="14" width="480" height="30" rx="6" fill={C.accent + "33"} stroke={C.accent} /><text x="260" y="34" fill={C.text} fontSize="11" textAnchor="middle">warp scheduler + dispatch: picks a ready warp, issues ONE instruction for its 32 threads</text>
            {Array.from({ length: 16 }, (_, i) => <g key={i}><rect x={20 + i * 30} y="56" width="26" height="40" rx="3" fill={C.green} opacity="0.8" /><text x={33 + i * 30} y="80" fill="#0D1117" fontSize="8" textAnchor="middle">FP32</text></g>)}
            <rect x="20" y="106" width="234" height="34" rx="4" fill={C.orange} /><text x="137" y="127" fill="#0D1117" fontSize="11" textAnchor="middle">Tensor Core</text>
            <rect x="266" y="106" width="234" height="34" rx="4" fill={C.orange} /><text x="383" y="127" fill="#0D1117" fontSize="11" textAnchor="middle">Tensor Core</text>
            <rect x="20" y="150" width="480" height="30" rx="4" fill={C.teal + "22"} stroke={C.teal} /><text x="260" y="170" fill={C.text} fontSize="11" textAnchor="middle">register file: 16,384 × 32-bit registers (each thread's private variables)</text>
            <text x="20" y="206" fill={C.muted} fontSize="10">Also here: integer units, load/store units, special-function units (sin, exp…)</text>
          </g>
        )}
      </svg>
      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}><b style={{ color: C.text }}>{LEVELS[lv].t}.</b> {LEVELS[lv].d}</div>
      <Insight title="A GPU is a team of SMs; an SM is a team of processing blocks; a block runs warps of 32 threads on its cores.">
        Compare it with the COA processor: an SM has its own control (schedulers), its own registers and its own ALUs, just many of each. It's
        the datapath from COA, copied wide.
      </Insight>
    </div>
  );
}

// ── Section 3: Tensor Cores ──
function TensorWidget() {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState("cuda");
  const total = mode === "cuda" ? 64 : 1;
  return (
    <div>
      <Frame>
        A <b style={{ color: C.green }}>CUDA core</b> does one fused multiply-add (FMA: a × b + c) per clock. A <b style={{ color: C.orange }}>Tensor Core</b> does a whole small
        matrix operation, <b style={{ color: C.text }}>D = A × B + C on 4 × 4 matrices</b> (64 FMAs), in one go, with FP16 inputs. Compare the two
        on the same 4 × 4 × 4 job.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <Btn ghost={mode !== "cuda"} onClick={() => { setMode("cuda"); setStep(0); }} color={C.green}>One CUDA core</Btn>
        <Btn ghost={mode !== "tensor"} onClick={() => { setMode("tensor"); setStep(0); }} color={C.orange}>One Tensor Core</Btn>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {["A", "B"].map((m) => (
          <div key={m}>
            <div style={{ color: C.muted, fontSize: 11, textAlign: "center" }}>{m} (4×4, FP16)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 20px)", gap: 2 }}>{Array.from({ length: 16 }, (_, i) => <div key={i} style={{ width: 20, height: 20, borderRadius: 3, background: C.accent + "44", border: `1px solid ${C.accent}` }} />)}</div>
          </div>
        ))}
        <div style={{ color: C.muted, fontSize: 18 }}>→</div>
        <div>
          <div style={{ color: C.muted, fontSize: 11, textAlign: "center" }}>D (4×4)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 20px)", gap: 2 }}>
            {Array.from({ length: 16 }, (_, i) => {
              const done = mode === "tensor" ? step >= 1 : Math.floor(step / 4) > i || (Math.floor(step / 4) === i && step % 4 > 0);
              const full = mode === "tensor" ? step >= 1 : Math.floor(step / 4) > i;
              return <div key={i} style={{ width: 20, height: 20, borderRadius: 3, background: full ? C.green : done ? C.yellow : C.card, border: `1px solid ${C.border}` }} />;
            })}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <Stat label="CLOCK CYCLES USED" value={`${step} / ${total}`} color={mode === "cuda" ? C.green : C.orange} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Btn onClick={() => setStep((s) => Math.min(total, s + 1))} color={mode === "cuda" ? C.green : C.orange}>Clock tick ▶</Btn>
        <Btn onClick={() => setStep(total)} ghost>Finish</Btn>
        <Btn ghost onClick={() => setStep(0)}>↺ Reset</Btn>
      </div>
      <Insight color={C.orange} title="One Tensor Core does in one step what a CUDA core does in 64.">
        Tensor Cores exist only because AI is matrix multiplication (Unit 1.5). They need lower-precision inputs (FP16 and smaller), which Unit 6.2
        explains. PyTorch uses them automatically when the numbers are in FP16.
      </Insight>
    </div>
  );
}

// ── Section 4: Work out the peak yourself ──
function PeakWidget() {
  const [sms, setSms] = useState(T4.sms);
  const [ghz, setGhz] = useState(T4.boostGHz);
  const cuda = sms * T4.coresPerSM * 2 * ghz * 1e9;
  const tensor = sms * T4.tensorPerSM * 64 * 2 * ghz * 1e9;
  return (
    <div>
      <Frame>
        Peak speed isn't magic: it's <b style={{ color: C.text }}>units × operations per clock × clocks per second</b>. Each FMA counts as 2 FLOPs.
        Start from the T4's real figures, then change them.
      </Frame>
      <Slider label={<>SMs = <b style={{ color: C.green }}>{sms}</b></>} value={sms} min={1} max={144} onChange={setSms} color={C.green} />
      <Slider label={<>Clock = <b style={{ color: C.accent }}>{ghz.toFixed(2)} GHz</b></>} value={ghz} min={0.5} max={2.5} step={0.01} onChange={setGhz} />
      <div style={{ fontFamily: "monospace", fontSize: 12.5, color: C.text, background: C.card, borderRadius: 10, padding: 12, border: `1px solid ${C.border}`, lineHeight: 2 }}>
        <div><span style={{ color: C.green }}>CUDA cores</span>: {sms} SMs × 64 cores × 2 FLOPs × {ghz.toFixed(2)} GHz = <b style={{ color: C.green }}>{(cuda / 1e12).toFixed(1)} TFLOPS</b> (FP32)</div>
        <div><span style={{ color: C.orange }}>Tensor Cores</span>: {sms} SMs × 8 × 64 FMAs × 2 × {ghz.toFixed(2)} GHz = <b style={{ color: C.orange }}>{(tensor / 1e12).toFixed(1)} TFLOPS</b> (FP16)</div>
      </div>
      <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8 }}>With the T4's real numbers (40 SMs, 1.59 GHz) you get NVIDIA's published 8.1 and 65 TFLOPS. Now you know where those numbers come from.</div>
      <Insight color={C.green} title="Peak FLOPS = how many units × how much each does per clock × clock rate.">
        Notice that most of the T4's arithmetic power is in its Tensor Cores. To use it, your work must be matrix multiplies in low precision,
        which is exactly what deep learning is.
      </Insight>
      <LabCard part="A" title="Read the SM count and compute your GPU's peak"
        what="Ask PyTorch for the SM count, look up the clock in nvidia-smi, compute the peak FP32 and FP16 TFLOPS yourself, then compare with a measured FP32 vs FP16 matrix multiply."
        expect="40 SMs, a computed peak near 8 (FP32) and 65 (FP16) TFLOPS, and an FP16 matrix multiply clearly faster than FP32." />
    </div>
  );
}
//@@SECTIONS
[["Organising 2,560 Cores", "🏛️ Organising 2,560 Cores — a university of workers", "NeedWidget"],
 ["Zoom In", "🔍 Zoom In — chip → SM → processing block", "ZoomWidget"],
 ["Tensor Cores", "🟧 Tensor Cores — a matrix multiply in one step", "TensorWidget"],
 ["Work Out the Peak", "🧮 Work Out the Peak — where 8.1 and 65 TFLOPS come from", "PeakWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "What is a Streaming Multiprocessor (SM)?", options: ["A type of memory chip", "One of the GPU's mini-processors, with its own schedulers, registers and many cores", "A CPU core inside the GPU", "The PCIe connector"], answer: 1, explain: "The GPU is built from many SMs (40 on the T4); each SM has warp schedulers, a register file, shared memory and many CUDA and Tensor Cores." },
  { q: "40 SMs × 64 CUDA cores × 2 FLOPs per FMA × 1.5 GHz = ?", options: ["3.8 TFLOPS", "7.7 TFLOPS", "15.4 TFLOPS", "0.77 TFLOPS"], answer: 1, explain: "40 × 64 × 2 × 1.5 × 10⁹ = 7.68 × 10¹² FLOPS ≈ 7.7 TFLOPS." },
  { q: "What does a Tensor Core do in one step?", options: ["One addition", "A small matrix multiply-and-add, like 4×4 × 4×4 + 4×4", "Copies data from the CPU", "Schedules warps"], answer: 1, explain: "D = A × B + C on small matrices: 64 FMAs at once on Turing. That's why it's so much faster for AI." },
  { q: "Why does a register file need to be so large (256 KB per SM)?", options: ["To store the whole dataset", "Every resident thread keeps its own private variables in registers", "To hold the operating system", "For graphics textures only"], answer: 1, explain: "Up to 1,024 threads live on an SM at once, each with its own registers. Unit 4.3 shows why keeping them all resident matters." },
];
const RESULT = {
  perfect: "Perfect! You can read a GPU like a datasheet.",
  good: "Good. Replay 'Zoom In' and go through all three levels.",
  low: "Revisit 'Organising 2,560 Cores': chip → SM → block → core is the map for this module.",
  done: "Unit 4.1 Complete!",
  body: "You can describe a GPU's organisation, explain Tensor Cores, and derive its peak FLOPS.",
  next: "Next up: Unit 4.2 — Warps & Branch Divergence.",
  teaser: "32 threads march in lock-step. What happens when an if-statement makes them disagree?",
};
//@@WORDS
const UNIT_WORDS = [
  ["SM", "Streaming Multiprocessor", "One of the GPU's mini-processors; the T4 has 40.", "from Unit 3.3"],
  ["FMA", "Fused Multiply-Add", "a × b + c in one instruction = 2 FLOPs (the GPU's MAC).", "new here"],
  ["FP32 / FP16", "32-bit / 16-bit floating point", "Number formats (IEEE 754, COA). Tensor Cores work on FP16.", "from COA"],
  ["GDDR6", "Graphics Double Data Rate 6 memory", "The T4's fast off-chip memory, 16 GB.", "new here"],
  ["L1 / L2", "level-1 / level-2 cache", "On-chip caches: L1 per SM, L2 shared by all SMs.", "from COA"],
];
