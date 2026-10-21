//@@META
{"unit": "5.3", "module": 5, "title": "Compute-bound vs Memory-bound", "icon": "🏠", "lab": "Lab5A_Why_GPUs_Make_AI_Fast.ipynb", "labNo": "5A", "gpu": true}
//@@WIDGETS

const PEAK32 = 8.1e12, PEAK16 = 65e12, BW = 320e9;

// ── Section 1: Need — same GPU, wildly different speeds ──
function NeedWidget() {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <Frame>
        Two operations measured on the same T4. Both are "running at full speed", yet one reaches 50% of the GPU's peak FLOPS and the other
        about 0.4%. Is the second one broken? Predict, then reveal.
      </Frame>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[["ReLU on 10 crore numbers", "≈ 3.1 ms", "≈ 32 GFLOPS", "≈ 260 GB/s", C.orange], ["4096 × 4096 matrix multiply", "≈ 34 ms", "≈ 4,000 GFLOPS", "≈ 6 GB/s", C.green]].map(([t, ms, fl, bw, c]) => (
          <div key={t} style={{ background: C.card, borderRadius: 10, padding: 12, border: `1.5px solid ${c}` }}>
            <div style={{ color: c, fontWeight: 700, fontSize: 13 }}>{t}</div>
            <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.8, marginTop: 4 }}>time {ms}<br />FLOPS {fl}<br />{shown && <>memory traffic {bw}</>}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10 }}><Btn onClick={() => setShown(true)} color={C.purple}>Reveal the memory traffic</Btn></div>
      {shown && (
        <Insight color={C.purple} title="ReLU isn't broken: it's using almost all of the memory bandwidth. Its limit is bytes, not FLOPs.">
          ReLU does one tiny operation per 8 bytes moved, so memory is its ceiling. The matrix multiply does thousands of operations per byte, so the
          arithmetic units are its ceiling. To know which limit applies, you need one number: arithmetic intensity. (Illustrative T4 figures.)
        </Insight>
      )}
    </div>
  );
}

// ── Section 2: Arithmetic intensity ──
const OPS = {
  add: { t: "Vector add  c = a + b", flops: (n) => n, bytes: (n) => 12 * n, note: "1 add per 12 bytes (read 2 floats, write 1)." },
  relu: { t: "ReLU  y = max(x, 0)", flops: (n) => n, bytes: (n) => 8 * n, note: "1 operation per 8 bytes." },
  layerB1: { t: "Layer, batch 1  (1 × n) @ (n × n)", flops: (n) => 2 * n * n, bytes: (n) => 4 * (n * n + 2 * n), note: "Each weight is used once: about 2 FLOPs per 4 bytes." },
  matmul: { t: "Matrix multiply  (n × n) @ (n × n)", flops: (n) => 2 * n ** 3, bytes: (n) => 12 * n * n, note: "Each number is reused n times: intensity grows with n." },
};
function IntensityWidget() {
  const [k, setK] = useState("matmul");
  const [n, setN] = useState(1024);
  const o = OPS[k];
  const I = o.flops(n) / o.bytes(n);
  return (
    <div>
      <Frame>
        <b style={{ color: C.text }}>Arithmetic intensity = FLOPs ÷ bytes moved to and from memory.</b> It says how much maths an operation does for each byte it
        has to fetch. Pick an operation and a size.
      </Frame>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
        {Object.entries(OPS).map(([key, v]) => <Btn key={key} ghost={key !== k} onClick={() => setK(key)}>{v.t}</Btn>)}
      </div>
      <Slider label={<>n = <b style={{ color: C.accent }}>{n}</b></>} value={n} min={64} max={8192} step={64} onChange={setN} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="FLOPs" value={o.flops(n).toExponential(2)} color={C.green} />
        <Stat label="BYTES" value={o.bytes(n).toExponential(2)} color={C.teal} />
        <Stat label="INTENSITY (FLOPs/BYTE)" value={I < 10 ? I.toFixed(3) : I.toFixed(0)} color={C.purple} />
      </div>
      <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8 }}>{o.note}</div>
      <Insight color={C.purple} title="Element-wise operations: far below 1 FLOP per byte. Big matrix multiplies: hundreds or thousands.">
        Intensity depends on reuse, the same idea as Unit 3.4 and tiling in Unit 5.1. Note that a layer with batch size 1 is as poor as ReLU: every weight
        is fetched for just one multiply-add.
      </Insight>
    </div>
  );
}

// ── Section 3: The roofline ──
function RooflineWidget() {
  const [fp16, setFp16] = useState(false);
  const [n, setN] = useState(1024);
  const peak = fp16 ? PEAK16 : PEAK32, bpe = fp16 ? 2 : 4;
  const ridge = peak / BW;
  const pts = [
    { t: "vector add", I: 1 / (3 * bpe), c: C.orange },
    { t: "ReLU", I: 1 / (2 * bpe), c: C.yellow },
    { t: "layer, batch 1", I: (2 * n * n) / (bpe * (n * n + 2 * n)), c: C.red },
    { t: `matmul n=${n}`, I: (2 * n ** 3) / (3 * bpe * n * n), c: C.green },
  ];
  const X = (I) => 40 + ((Math.log10(I) + 2) / 6) * 450, Y = (p) => 190 - ((Math.log10(p) - 9) / 5.2) * 175;
  const perf = (I) => Math.min(peak, BW * I);
  return (
    <div>
      <Frame>
        The <b style={{ color: C.text }}>roofline</b> (Hennessy & Patterson Ch 4) puts it in one picture: x = intensity, y = achievable FLOPS. The slanted part is the memory
        limit (bandwidth × intensity); the flat part is the compute limit (peak). An operation can never rise above the roof. Drag n, and switch on FP16.
      </Frame>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
        <label style={{ color: C.text, fontSize: 12.5, cursor: "pointer" }}><input type="checkbox" checked={fp16} onChange={(e) => setFp16(e.target.checked)} /> FP16 Tensor Cores (65 TFLOPS, 2 bytes per number)</label>
      </div>
      <Slider label={<>Matrix size n = <b style={{ color: C.accent }}>{n}</b></>} value={n} min={16} max={8192} step={16} onChange={setN} />
      <svg viewBox="0 0 520 215" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        {[1e9, 1e10, 1e11, 1e12, 1e13, 1e14].map((p) => <g key={p}><line x1="40" x2="500" y1={Y(p)} y2={Y(p)} stroke={C.border} /><text x="4" y={Y(p) + 3} fill={C.muted} fontSize="9">{p >= 1e12 ? `${p / 1e12}T` : `${p / 1e9}G`}</text></g>)}
        {[0.01, 0.1, 1, 10, 100, 1000, 10000].map((I) => <text key={I} x={X(I)} y="210" fill={C.muted} fontSize="9" textAnchor="middle">{I}</text>)}
        <polyline fill="none" stroke={C.text} strokeWidth="2.5" points={`${X(0.01)},${Y(BW * 0.01)} ${X(ridge)},${Y(peak)} ${X(10000)},${Y(peak)}`} />
        <text x={X(ridge) + 6} y={Y(peak) - 6} fill={C.text} fontSize="10">ridge ≈ {ridge.toFixed(0)} FLOPs/byte</text>
        <text x={X(0.03)} y={Y(BW * 0.03) - 8} fill={C.teal} fontSize="10" transform={`rotate(-33 ${X(0.03)} ${Y(BW * 0.03) - 8})`}>memory roof: 320 GB/s × intensity</text>
        {pts.map((p, k) => <g key={p.t}><circle cx={X(p.I)} cy={Y(perf(p.I))} r="6" fill={p.c} /><text x={X(p.I) + 8} y={Y(perf(p.I)) + (k === 1 ? -8 : 14)} fill={p.c} fontSize="10">{p.t}</text></g>)}
        <text x="44" y="14" fill={C.muted} fontSize="9">y: achievable FLOPS (log) · x: intensity, FLOPs per byte (log)</text>
      </svg>
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        {pts.map((p) => <Stat key={p.t} label={p.t.toUpperCase()} value={p.I < ridge ? "memory-bound" : "compute-bound"} color={p.c} />)}
      </div>
      <Insight title="Left of the ridge: memory-bound, so more FLOPS won't help. Right of the ridge: compute-bound, so more bandwidth won't help.">
        Notice that switching to FP16 raises the roof AND moves every point right (fewer bytes), but it also moves the ridge right, so more operations
        end up memory-bound. Small matrices (drag n down) slide left into memory-bound territory.
      </Insight>
    </div>
  );
}

// ── Section 4: What to do about it ──
function ActWidget() {
  const [params, setParams] = useState(1);
  const bytes = params * 1e9 * 2;
  const msPerToken = (bytes / BW) * 1000;
  return (
    <div>
      <Frame>The roofline tells you which fix will work. Then a real example: a chatbot writing one word at a time.</Frame>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: C.card, borderRadius: 10, padding: 12, border: `1.5px solid ${C.teal}` }}>
          <b style={{ color: C.teal, fontSize: 13 }}>If memory-bound</b>
          <ul style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.7, margin: "6px 0 0", paddingLeft: 18 }}>
            <li><b style={{ color: C.text }}>Fuse operations</b>: do matmul + bias + ReLU in one kernel, so the intermediate never goes to memory (torch.compile does this)</li>
            <li><b style={{ color: C.text }}>Fewer bytes</b>: FP16 / INT8 (Unit 5.2)</li>
            <li><b style={{ color: C.text }}>More reuse</b>: bigger batches, tiling</li>
          </ul>
        </div>
        <div style={{ background: C.card, borderRadius: 10, padding: 12, border: `1.5px solid ${C.green}` }}>
          <b style={{ color: C.green, fontSize: 13 }}>If compute-bound</b>
          <ul style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.7, margin: "6px 0 0", paddingLeft: 18 }}>
            <li><b style={{ color: C.text }}>Tensor Cores</b>: FP16 / BF16 matmuls</li>
            <li><b style={{ color: C.text }}>A bigger GPU</b> or several (Unit 5.9)</li>
            <li><b style={{ color: C.text }}>Fewer FLOPs</b>: a smaller or smarter model</li>
          </ul>
        </div>
      </div>
      <div style={{ marginTop: 14, background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Case study: chatbot word generation (batch 1, FP16)</div>
        <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.7, marginBottom: 8 }}>To produce each new token, the model multiplies a single vector by every weight matrix: that's "layer, batch 1", deep in memory-bound
          territory. So every token must read ALL the weights from memory once.</div>
        <Slider label={<>Model size = <b style={{ color: C.accent }}>{params} B</b> parameters (FP16 = {(params * 2).toFixed(0)} GB)</>} value={params} min={0.5} max={7} step={0.5} onChange={setParams} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Stat label="TIME PER TOKEN ≥ BYTES ÷ 320 GB/s" value={`${msPerToken.toFixed(1)} ms`} color={C.teal} />
          <Stat label="MAX TOKENS PER SECOND" value={(1000 / msPerToken).toFixed(0)} color={C.green} />
        </div>
      </div>
      <Insight color={C.teal} title="Chatbot speed is set by memory bandwidth, not FLOPS. That's why INT8/INT4 quantisation makes chatbots faster.">
        Halve the bytes per weight and you double the tokens per second. This is also why Unit 1.C's FLOPs-only estimate was too optimistic, as
        promised.
      </Insight>
      <LabCard part="C" title="Plot your own roofline"
        what="Measure vector add, ReLU, a batch-1 layer and matrix multiplies of several sizes on the T4, compute each one's intensity and achieved FLOPS, and plot them under the T4's roofline."
        expect="element-wise operations hugging the slanted memory roof, and large matrix multiplies close to the flat compute roof." />
    </div>
  );
}
//@@SECTIONS
[["Broken or Not?", "🤔 Broken or Not? — 50% vs 0.4% of peak", "NeedWidget"],
 ["Arithmetic Intensity", "⚖️ Arithmetic Intensity — FLOPs per byte", "IntensityWidget"],
 ["The Roofline", "🏠 The Roofline — the speed limit of any operation", "RooflineWidget"],
 ["What To Do", "🛠️ What To Do — and why chatbots are memory-bound", "ActWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "An operation does 2 FLOPs for every 8 bytes it moves. What is its arithmetic intensity?", options: ["0.25 FLOPs/byte", "4 FLOPs/byte", "16 FLOPs/byte", "2 FLOPs/byte"], answer: 0, explain: "Intensity = FLOPs ÷ bytes = 2 ÷ 8 = 0.25. Far left of the T4's ridge (≈ 25), so memory-bound." },
  { q: "The T4 has 8.1 TFLOPS (FP32) and 320 GB/s. Where is its ridge point?", options: ["≈ 2.5 FLOPs/byte", "≈ 25 FLOPs/byte", "≈ 250 FLOPs/byte", "≈ 2,600 FLOPs/byte"], answer: 1, explain: "Ridge = peak ÷ bandwidth = 8.1 × 10¹² ÷ 320 × 10⁹ ≈ 25 FLOPs per byte." },
  { q: "An operation is memory-bound. Which change will NOT speed it up?", options: ["Using FP16 instead of FP32", "Fusing it with the next operation", "A GPU with more FLOPS but the same bandwidth", "Increasing data reuse"], answer: 2, explain: "Memory-bound means the bytes are the limit. More FLOPS can't help; fewer or reused bytes can." },
  { q: "A 7-billion-parameter chatbot in FP16 on a 320 GB/s GPU can generate at most about how many tokens per second (batch 1)?", options: ["≈ 2", "≈ 23", "≈ 230", "≈ 2,300"], answer: 1, explain: "Each token reads all 14 GB of weights: 14 GB ÷ 320 GB/s ≈ 44 ms per token, so about 23 tokens per second at most." },
];
const RESULT = {
  perfect: "Perfect! You can predict any operation's speed limit.",
  good: "Good. Replay 'The Roofline' and toggle FP16.",
  low: "Revisit 'Arithmetic Intensity': FLOPs per byte decides everything.",
  done: "Unit 5.3 Complete!",
  body: "You can compute arithmetic intensity, read a roofline, classify operations as compute- or memory-bound, and pick the right fix.",
  next: "Next up: Unit 5.4 — Batch Size & Training on GPU.",
  teaser: "Put it all together in real training: batch size, throughput, memory, and mixed precision.",
};
//@@WORDS
const UNIT_WORDS = [
  ["intensity", "arithmetic intensity", "FLOPs done per byte moved to or from memory.", "new here"],
  ["roofline", "the roofline model", "A chart of the speed limit: min(peak FLOPS, bandwidth × intensity).", "new here"],
  ["ridge point", "where the two roofs meet", "peak ÷ bandwidth; about 25 FLOPs/byte for the T4 in FP32.", "new here"],
  ["kernel fusion", "combining operations into one kernel", "Avoids writing intermediate results to memory.", "new here"],
  ["torch.compile", "PyTorch's compiler", "Can fuse operations automatically to cut memory traffic.", "new here"],
];
