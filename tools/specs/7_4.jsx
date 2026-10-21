//@@META
{"unit": "7.4", "module": 7, "title": "Many GPUs & Other Accelerators", "icon": "🌐", "lab": "Lab07_GPUs_in_Real_Projects.ipynb", "labNo": 7, "gpu": true}
//@@WIDGETS

// ── Section 1: Need — one GPU would take centuries ──
function NeedWidget() {
  const [g, setG] = useState(1);
  const flops = 3.14e23;                     // GPT-3 training estimate (Unit 2.2)
  const per = 312e12 * 0.4;                  // A100 FP16 peak × 40% utilisation
  const eff = g === 1 ? 1 : Math.pow(0.97, Math.log2(g));   // illustrative: a little communication loss per doubling
  const days = flops / (per * g * eff) / 86400;
  return (
    <div>
      <Frame>
        Training a GPT-3-sized model takes about 3 × 10²³ FLOPs (Unit 2.2). Even on one big data-centre GPU (an A100 at 40% of its FP16 peak), how long?
        Now add GPUs.
      </Frame>
      <Slider label={<>GPUs = <b style={{ color: C.green }}>{g.toLocaleString("en-IN")}</b></>} value={g} min={1} max={4096} onChange={setG} color={C.green} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="TRAINING TIME" value={days > 730 ? `${(days / 365).toFixed(0)} years` : days > 2 ? `${days.toFixed(0)} days` : `${(days * 24).toFixed(0)} hours`} color={days > 365 ? C.red : days > 60 ? C.yellow : C.green} />
        <Stat label="SCALING EFFICIENCY (ILLUSTRATIVE)" value={`${(eff * 100).toFixed(0)}%`} color={C.purple} />
      </div>
      <Insight color={C.orange} title="Big models are trained on thousands of GPUs at once, not because one is slow, but because the work is enormous.">
        The question is how to split ONE training job across many GPUs. There are two basic ways, plus a lot of fast networking.
      </Insight>
    </div>
  );
}

// ── Section 2: Data parallelism ──
function DataParWidget() {
  const [s, setS] = useState(0);
  const STEPS = [
    "Every GPU holds a full copy of the model (same weights).",
    "The batch of 256 is split: each of the 4 GPUs gets its own 64 images.",
    "Each GPU runs forward + backward on its slice and gets its own gradients.",
    "ALL-REDUCE: the GPUs exchange gradients over fast links (NVLink) and each ends up with the average.",
    "Each GPU applies the same averaged update, so the copies stay identical. Repeat.",
  ];
  const cols = [C.accent, C.green, C.orange, C.purple];
  return (
    <div>
      <Frame>
        <b style={{ color: C.text }}>Data parallelism</b>: like four examiners each marking a quarter of the answer scripts, then agreeing on the marking scheme
        together. Step through one training iteration on 4 GPUs.
      </Frame>
      <svg viewBox="0 0 520 170" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        {[0, 1, 2, 3].map((k) => (
          <g key={k}>
            <rect x={20 + k * 125} y="20" width="105" height="90" rx="8" fill={cols[k] + "18"} stroke={cols[k]} />
            <text x={72 + k * 125} y="38" fill={C.text} fontSize="11" textAnchor="middle">GPU {k}</text>
            <rect x={35 + k * 125} y="46" width="75" height="16" rx="3" fill={C.teal + "44"} /><text x={72 + k * 125} y="58" fill={C.text} fontSize="9" textAnchor="middle">full model</text>
            {s >= 1 && <><rect x={35 + k * 125} y="66" width="75" height="16" rx="3" fill={C.yellow + "44"} /><text x={72 + k * 125} y="78" fill={C.text} fontSize="9" textAnchor="middle">images {k * 64}–{k * 64 + 63}</text></>}
            {s >= 2 && <><rect x={35 + k * 125} y="86" width="75" height="16" rx="3" fill={(s >= 3 ? C.green : cols[k]) + "55"} /><text x={72 + k * 125} y="98" fill={C.text} fontSize="9" textAnchor="middle">{s >= 3 ? "avg gradient" : `gradient ${k}`}</text></>}
          </g>
        ))}
        {s === 3 && <g><line x1="72" y1="125" x2="447" y2="125" stroke={C.green} strokeWidth="3" /><text x="260" y="145" fill={C.green} fontSize="11" textAnchor="middle">all-reduce: exchange and average gradients (NVLink)</text></g>}
        {s >= 4 && <text x="260" y="145" fill={C.accent} fontSize="11" textAnchor="middle">same update everywhere → the 4 copies stay identical</text>}
      </svg>
      <div style={{ marginTop: 10, minHeight: 22, color: C.text, fontSize: 13 }}>{STEPS[s]}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Btn onClick={() => setS((v) => Math.min(4, v + 1))}>Step ▶ ({s + 1} / 5)</Btn>
        <Btn ghost onClick={() => setS(0)}>↺ Reset</Btn>
      </div>
      <Code color={C.accent} title="🔥 IN PYTORCH: DistributedDataParallel">{`model = torch.nn.parallel.DistributedDataParallel(model)   # one process per GPU
# the training loop stays the same; backward() triggers the all-reduce`}</Code>
      <Insight title="Averaging the gradients of 4 slices gives exactly the gradient of the whole batch.">
        So 4 GPUs act like one GPU with a 4× bigger batch, at nearly 4× the speed, as long as the gradient exchange is fast. The exchange is the serial part
        that Amdahl's law warns about (Unit 3.4).
      </Insight>
    </div>
  );
}

// ── Section 3: When the model doesn't fit: model parallelism ──
function ModelParWidget() {
  const [mode, setMode] = useState("pipeline");
  const MODES = {
    pipeline: { t: "Pipeline parallelism", d: "Split the LAYERS: GPU 0 holds layers 1–8, GPU 1 holds 9–16, and so on. Activations flow from GPU to GPU like an assembly line, and micro-batches keep every stage busy (the same idea as pipelining in COA Unit 3!).", draw: "layers" },
    tensor: { t: "Tensor parallelism", d: "Split each big MATRIX: each GPU holds a slice of every weight matrix and computes part of every layer, then the GPUs combine partial results. It needs very fast links, so it's used inside one server.", draw: "matrix" },
    fsdp: { t: "Sharded data parallelism (FSDP / ZeRO)", d: "Like data parallelism, but each GPU stores only a SHARE of the weights, gradients and Adam states (the 16 bytes/param from Unit 7.2), fetching the rest just when needed. Memory per GPU drops by about the number of GPUs.", draw: "shard" },
  };
  const m = MODES[mode];
  return (
    <div>
      <Frame>
        Data parallelism needs a full model copy on every GPU. A model needing 2,800 GB to train (175 B parameters × 16 bytes) fits on no single GPU.
        Then the MODEL itself has to be split. Compare three ways.
      </Frame>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {Object.entries(MODES).map(([k, v]) => <Btn key={k} ghost={k !== mode} onClick={() => setMode(k)} color={C.purple}>{v.t}</Btn>)}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {[0, 1, 2, 3].map((k) => (
          <div key={k} style={{ flex: 1, background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, padding: 8, textAlign: "center" }}>
            <div style={{ color: C.muted, fontSize: 11, marginBottom: 6 }}>GPU {k}</div>
            {m.draw === "layers" && <div style={{ background: C.purple + "44", border: `1px solid ${C.purple}`, borderRadius: 4, padding: 6, fontSize: 11, color: C.text }}>layers {k * 8 + 1}–{k * 8 + 8}</div>}
            {m.draw === "matrix" && <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>{Array.from({ length: 16 }, (_, i) => <div key={i} style={{ height: 10, background: i % 4 === k ? C.purple : C.border, borderRadius: 1 }} />)}</div>}
            {m.draw === "shard" && <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>weights ¼<br />grads ¼<br />Adam ¼</div>}
          </div>
        ))}
      </div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginTop: 10 }}>{m.d}</div>
      <Insight color={C.purple} title="Real giant-model training combines all of these at once, across thousands of GPUs.">
        Data parallel across servers, tensor parallel inside a server, pipeline across groups, and sharding everywhere. The ideas are the ones
        you know (splitting work, pipelining, Amdahl); the scale is enormous.
      </Insight>
    </div>
  );
}

// ── Section 4: Beyond NVIDIA GPUs ──
const ACCEL = [
  { t: "Google TPU", c: C.green, d: "Tensor Processing Unit: built around a huge matrix-multiply unit (a 'systolic array') where numbers flow through a grid of multiply-add cells. Used through Google Cloud and Colab." },
  { t: "NPUs in phones and laptops", c: C.teal, d: "Neural Processing Units: small, low-power AI engines (often INT8) on phone and laptop chips. They run face unlock, camera effects and on-device assistants without the cloud." },
  { t: "AMD Instinct GPUs", c: C.red, d: "AMD's data-centre GPUs, programmed with ROCm/HIP (Unit 7.1). Same SIMT ideas, different company." },
  { t: "Apple M-series", c: C.purple, d: "CPU, GPU and Neural Engine on one chip sharing unified memory: no PCIe copies (Unit 5.1). Great for running models locally." },
  { t: "Cloud GPUs", c: C.yellow, d: "Rent instead of buy: T4, L4, A100, H100 by the hour from cloud providers. Colab's free T4 is the entry point; prices vary a lot, so always check current rates." },
];
function AccelWidget() {
  const [i, setI] = useState(0);
  return (
    <div>
      <Frame>
        GPUs aren't the only AI chips. Click each family. Notice what they all have in common.
      </Frame>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {ACCEL.map((a, k) => <Btn key={k} ghost={k !== i} onClick={() => setI(k)} color={a.c}>{a.t}</Btn>)}
      </div>
      <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 8, background: ACCEL[i].c + "14", border: `1px solid ${ACCEL[i].c}55`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{ACCEL[i].d}</div>
      <Insight color={C.green} title="Every AI chip is the same bargain: huge numbers of multiply-adds in parallel, low precision, and a memory system to feed them.">
        Learn the principles in this course (SIMD, memory bandwidth, precision, the roofline, host-device copies) and you can understand any of them.
      </Insight>
      <LabCard part="D" title="Prove data parallelism on one GPU"
        what="Colab gives you one GPU, but you can still check the key idea: split a batch into 4 slices, compute each slice's gradient separately, average them, and compare with the gradient of the whole batch."
        expect="the averaged gradient matching the full-batch gradient (difference ≈ 0), exactly what all-reduce relies on." />
    </div>
  );
}
//@@SECTIONS
[["Centuries on One GPU", "⏳ Centuries on One GPU — why go multi-GPU", "NeedWidget"],
 ["Data Parallelism", "🍰 Data Parallelism — split the batch, average the gradients", "DataParWidget"],
 ["Model Parallelism", "🧩 When the Model Doesn't Fit — split the model", "ModelParWidget"],
 ["Other Accelerators", "🌐 Beyond NVIDIA — TPUs, NPUs and more", "AccelWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "In data parallelism with 8 GPUs, what does each GPU hold?", options: ["One-eighth of the model", "A full copy of the model and one-eighth of each batch", "Only the gradients", "Only the data"], answer: 1, explain: "Every GPU has the whole model; the batch is split; gradients are averaged with an all-reduce." },
  { q: "Why is averaging the gradients of 4 batch slices correct?", options: ["It's an approximation that usually works", "The gradient of the average loss over a batch equals the average of the slice gradients (for equal slices)", "Because GPUs round numbers", "It isn't; each GPU learns separately"], answer: 1, explain: "Gradients add up linearly, so averaging equal slices gives exactly the full-batch gradient." },
  { q: "A model is too big for one GPU's memory even for a single example. Which approach helps?", options: ["Plain data parallelism", "Model parallelism (pipeline/tensor) or sharding the model state (FSDP)", "A bigger batch", "More DataLoader workers"], answer: 1, explain: "Data parallelism copies the whole model to every GPU. To fit, the model or its state must be split." },
  { q: "What do GPUs, TPUs and NPUs have in common?", options: ["They're all made by NVIDIA", "Massive parallel multiply-adds, usually in low precision, fed by a fast memory system", "They all use PCIe Gen 5", "They can't run neural networks"], answer: 1, explain: "Different designs, same bargain: lots of parallel MACs plus a way to feed them data." },
];
const RESULT = {
  perfect: "Perfect! You understand AI computing at scale.",
  good: "Good. Replay 'Data Parallelism' and step through the all-reduce.",
  low: "Revisit 'Data Parallelism': full model per GPU, split batch, average gradients.",
  done: "Unit 7.4 Complete!",
  body: "You can explain data, pipeline, tensor and sharded parallelism, and how TPUs, NPUs and other accelerators relate to GPUs.",
  next: "Next up: Unit 7.C — Grand Capstone: Plan an AI Project.",
  teaser: "Put the whole course to work: plan the GPU side of a real AI project, then run a real language model.",
};
//@@WORDS
const UNIT_WORDS = [
  ["all-reduce", "a collective communication step", "Every GPU contributes its gradients and receives the average.", "new here"],
  ["DDP", "DistributedDataParallel", "PyTorch's data-parallel wrapper: one process per GPU.", "new here"],
  ["FSDP / ZeRO", "Fully Sharded Data Parallel / Zero Redundancy Optimizer", "Store only a share of the weights, gradients and optimiser state on each GPU.", "new here"],
  ["TPU / NPU", "Tensor / Neural Processing Unit", "AI accelerators from Google / in phones and laptops.", "new here"],
  ["NVLink", "NVIDIA's GPU-to-GPU link", "Much faster than PCIe (Unit 5.1).", "from Unit 5.1"],
];
