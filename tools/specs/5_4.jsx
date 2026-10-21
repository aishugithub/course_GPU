//@@META
{"unit": "5.4", "module": 5, "title": "Batch Size & Training on GPU", "icon": "🏋️", "lab": "Lab5A_Why_GPUs_Make_AI_Fast.ipynb", "labNo": "5A", "gpu": true}
//@@WIDGETS

// ── Section 1: Need — "only 3× faster?" ──
function NeedWidget() {
  const [width, setWidth] = useState(128);
  const [B, setB] = useState(64);
  const params = 784 * width + width * width + width * 10;
  const flops = 6 * params * B;                          // training FLOPs per step (Unit 1.2)
  const prep = 0.004 * B;                                // ms of CPU data work per step (same on both)
  const cpu = flops / 8e10 * 1000 + 0.15 + prep;         // Colab's 2-core CPU
  const gpu = flops / 4e12 * 1000 + 0.3 + prep;          // 0.3 ms of launch overheads per step
  return (
    <div>
      <Frame>
        Students run Lab 0's digit network on the GPU and are disappointed: "only about 2× faster!" Explore why with this simple model of one
        training step. Make the network wider and the batch bigger.
      </Frame>
      <Slider label={<>Hidden layer width = <b style={{ color: C.accent }}>{width}</b> ({params.toLocaleString("en-IN")} parameters)</>} value={width} min={64} max={4096} step={64} onChange={setWidth} />
      <Slider label={<>Batch size = <b style={{ color: C.orange }}>{B}</b></>} value={B} min={8} max={1024} step={8} onChange={setB} color={C.orange} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="CPU STEP" value={`${cpu.toFixed(2)} ms`} color={C.orange} />
        <Stat label="GPU STEP" value={`${gpu.toFixed(2)} ms`} color={C.green} />
        <Stat label="GPU SPEED-UP" value={`${(cpu / gpu).toFixed(1)}×`} color={cpu / gpu > 10 ? C.green : C.yellow} />
      </div>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 6 }}>Model: Colab CPU 0.08 TFLOPS, GPU 4 TFLOPS effective; CPU pays ~0.15 ms and GPU ~0.3 ms of fixed overhead per step; both pay the same CPU data-preparation time. Illustrative.</div>
      <Insight color={C.yellow} title="A tiny model with small batches can't keep 2,560 cores busy. The GPU's advantage grows with the work per step.">
        The fixed costs (kernel launches, data preparation) dominate small steps: Amdahl again. Real AI models are big, which is exactly where GPUs shine.
      </Insight>
    </div>
  );
}

// ── Section 2: Throughput vs memory ──
function ThroughputWidget() {
  const [B, setB] = useState(64);
  const over = 0.4, per = 0.012;                     // ms per step overhead, ms per image of real work
  const tput = (b) => (b / (over + per * b)) * 1000;
  const mem = (b) => 0.6 + 0.022 * b;                // GB: weights + optimiser + activations per image (illustrative)
  const OOM = 15;
  const maxB = Math.floor((OOM - 0.6) / 0.022);
  const X = (b) => 30 + (Math.log2(b) / 11) * 460;
  return (
    <div>
      <Frame>
        Bigger batches spread the fixed per-step costs over more images, so <b style={{ color: C.green }}>throughput</b> (images per second) rises. But
        every image in the batch needs memory for its saved activations (Unit 1.2), so <b style={{ color: C.red }}>memory</b> rises too, up to the T4's limit.
      </Frame>
      <Slider label={<>Batch size = <b style={{ color: C.orange }}>{B}</b></>} value={B} min={1} max={1024} onChange={setB} color={C.orange} />
      <svg viewBox="0 0 520 190" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <polyline fill="none" stroke={C.green} strokeWidth="2.5" points={Array.from({ length: 45 }, (_, i) => 2 ** (i / 4)).map((b) => `${X(b)},${170 - (tput(b) / 85000) * 150}`).join(" ")} />
        <polyline fill="none" stroke={C.red} strokeWidth="2" strokeDasharray="5 4" points={Array.from({ length: 45 }, (_, i) => 2 ** (i / 4)).map((b) => `${X(b)},${170 - (Math.min(mem(b), 24) / 24) * 150}`).join(" ")} />
        <line x1="30" x2="500" y1={170 - (OOM / 24) * 150} y2={170 - (OOM / 24) * 150} stroke={C.red} strokeWidth="1" />
        <text x="34" y={165 - (OOM / 24) * 150} fill={C.red} fontSize="10">T4 memory limit (≈ 15 GB usable)</text>
        <line x1={X(B)} x2={X(B)} y1="15" y2="172" stroke={C.orange} strokeDasharray="3 3" />
        {[1, 4, 16, 64, 256, 1024].map((b) => <text key={b} x={X(b)} y="185" fill={C.muted} fontSize="9" textAnchor="middle">{b}</text>)}
        <text x="380" y="30" fill={C.green} fontSize="10">— throughput</text><text x="380" y="44" fill={C.red} fontSize="10">- - memory</text>
      </svg>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="IMAGES PER SECOND" value={B > maxB ? "💥 out of memory" : Math.round(tput(B)).toLocaleString("en-IN")} color={B > maxB ? C.red : C.green} />
        <Stat label="GPU MEMORY" value={`${mem(B).toFixed(1)} GB`} color={B > maxB ? C.red : C.teal} />
        <Stat label="LARGEST BATCH THAT FITS" value={maxB} color={C.purple} />
      </div>
      <Insight color={C.green} title="Throughput rises steeply at first, then flattens once the GPU is full. Memory just keeps climbing.">
        A good batch size sits on the flat part of the green curve, safely below the red line. Mixed precision (Unit 5.2) halves the activation memory,
        so batches can be bigger.
      </Insight>
    </div>
  );
}

// ── Section 3: Faster epochs ≠ faster learning ──
function TradeoffWidget() {
  const [B, setB] = useState(128);
  const epochTime = (b) => 60000 / ((b / (0.4 + 0.012 * b)) * 1000);       // seconds per MNIST epoch (from section 2)
  const epochsNeeded = (b) => 2 + Math.pow(b / 256, 1.3) * 1.5;           // illustrative: big batches need more epochs
  const total = (b) => epochTime(b) * epochsNeeded(b);
  const Bs = [8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
  const best = Bs.reduce((a, b) => (total(b) < total(a) ? b : a));
  const maxT = Math.max(...Bs.map(total));
  return (
    <div>
      <Frame>
        A bigger batch makes each <b style={{ color: C.text }}>epoch</b> faster, but it also makes <b style={{ color: C.text }}>fewer weight updates</b> per epoch (Unit 1.2), so the model may
        need more epochs to learn as well. What matters is the total time to reach a good accuracy. (Illustrative curves; the usual fix for big batches is
        a proportionally larger learning rate.)
      </Frame>
      <Slider label={<>Batch size = <b style={{ color: C.orange }}>{B}</b></>} value={B} min={8} max={4096} step={8} onChange={setB} color={C.orange} />
      <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 120, padding: "0 4px" }}>
        {Bs.map((b) => (
          <div key={b} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: (total(b) / maxT) * 100, background: b === best ? C.green : C.accent + "88", borderRadius: "3px 3px 0 0" }} />
            <div style={{ color: C.muted, fontSize: 9 }}>{b}</div>
          </div>
        ))}
      </div>
      <div style={{ color: C.muted, fontSize: 11.5, textAlign: "center" }}>total training time to reach the target accuracy, by batch size (green = shortest)</div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="UPDATES PER EPOCH" value={Math.ceil(60000 / B).toLocaleString("en-IN")} color={C.purple} />
        <Stat label="SECONDS PER EPOCH" value={epochTime(B).toFixed(2)} color={C.green} />
        <Stat label="EPOCHS NEEDED (ILLUSTRATIVE)" value={epochsNeeded(B).toFixed(1)} color={C.yellow} />
        <Stat label="TOTAL" value={`${total(B).toFixed(1)} s`} color={B === best ? C.green : C.text} />
      </div>
      <Insight color={C.purple} title="There's a sweet spot: big enough to fill the GPU, not so big that learning slows down.">
        That's why batch sizes of 32–512 are so common, and why people tune the learning rate together with the batch size.
      </Insight>
    </div>
  );
}

// ── Section 4: The GPU training recipe ──
const RECIPE = [
  { t: "Pick the device and move the model once", code: `device = "cuda" if torch.cuda.is_available() else "cpu"\nmodel = model.to(device)`, u: "5.1" },
  { t: "Feed data fast: workers + pinned memory", code: `loader = DataLoader(data, batch_size=256, shuffle=True,\n                    num_workers=2, pin_memory=True)`, u: "5.4" },
  { t: "Copy each batch without blocking", code: `x = x.to(device, non_blocking=True)`, u: "5.4" },
  { t: "Batch size that fills the GPU but fits in memory", code: `# try 64, 128, 256 … watch throughput and nvidia-smi`, u: "6.4" },
  { t: "Mixed precision for Tensor Cores", code: `with torch.autocast("cuda", dtype=torch.float16):\n    loss = loss_fn(model(x), y)\nscaler.scale(loss).backward()`, u: "6.2" },
  { t: "No per-step sync points", code: `running += loss.detach()     # .item() once per epoch`, u: "5.4" },
  { t: "Let cuDNN pick the fastest kernels", code: `torch.backends.cudnn.benchmark = True`, u: "6.1" },
  { t: "Optional: compile to fuse operations", code: `model = torch.compile(model)`, u: "6.3" },
];
function RecipeWidget() {
  const [done, setDone] = useState([]);
  const [open, setOpen] = useState(0);
  return (
    <div>
      <Frame>Everything from Modules 4 and 5 as one checklist: the GPU training recipe. Click each item to see the code, and tick it off.</Frame>
      {RECIPE.map((r, i) => {
        const on = done.includes(i);
        return (
          <div key={i} style={{ background: C.card, border: `1.5px solid ${on ? C.green : C.border}`, borderRadius: 8, padding: "8px 12px", marginBottom: 6 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }} onClick={() => setOpen(i)}>
              <span onClick={(e) => { e.stopPropagation(); setDone((s) => (on ? s.filter((x) => x !== i) : [...s, i])); }} style={{ fontSize: 16 }}>{on ? "✅" : "⬜"}</span>
              <span style={{ flex: 1, color: C.text, fontSize: 13 }}>{r.t}</span>
              <span style={{ color: C.accent, fontFamily: "monospace", fontSize: 11.5 }}>Unit {r.u}</span>
            </div>
            {open === i && <pre style={{ margin: "8px 0 0", fontFamily: "monospace", fontSize: 11.5, color: C.teal, whiteSpace: "pre-wrap" }}>{r.code}</pre>}
          </div>
        );
      })}
      <div style={{ color: done.length === RECIPE.length ? C.green : C.muted, fontSize: 12.5 }}>{done.length} / {RECIPE.length} ingredients ticked</div>
      <Insight color={C.green} title="Eight lines turn 'it runs on the GPU' into 'it runs WELL on the GPU'.">
        None of them changes the model or the maths, only how the work is fed to the hardware. That's the practical skill this course set out to build.
      </Insight>
      <LabCard part="D" title="Real training on the T4: CPU vs GPU, batch sweep, mixed precision"
        what="Train a wider MNIST network for one epoch on the CPU and on the GPU, sweep the batch size and plot images per second, then switch on autocast and compare speed and accuracy."
        expect="a big GPU speed-up for the wide network, throughput rising then levelling off with batch size, and autocast faster at the same accuracy." />
    </div>
  );
}
//@@SECTIONS
[["Only 3× Faster?", "🤨 Only 3× Faster? — when the GPU is underused", "NeedWidget"],
 ["Throughput vs Memory", "📈 Throughput vs Memory — choosing a batch size", "ThroughputWidget"],
 ["Faster ≠ Better", "⚖️ Faster Epochs ≠ Faster Learning", "TradeoffWidget"],
 ["The Recipe", "📋 The GPU Training Recipe", "RecipeWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "Why does a tiny model with batch size 16 get only a small speed-up on a GPU?", options: ["GPUs are slow at small numbers", "Fixed per-step costs (launches, data prep) dominate, and there's too little work to fill the cores", "The CPU secretly helps", "The learning rate is wrong"], answer: 1, explain: "Amdahl's law: the fixed overheads don't shrink, and a small step can't keep 2,560 cores busy." },
  { q: "As batch size grows, throughput (images per second)…", options: ["keeps doubling forever", "rises, then levels off once the GPU is fully used", "falls", "stays the same"], answer: 1, explain: "Overheads get spread out until the GPU is saturated; after that, more images per step just take proportionally longer." },
  { q: "What usually limits how big a batch you can use?", options: ["The number of CPU cores", "GPU memory for the saved activations of every image", "The size of the dataset file", "The clock speed"], answer: 1, explain: "Each image's activations are stored for the backward pass. Too many images → 'CUDA out of memory'." },
  { q: "Why isn't the biggest batch that fits always the fastest way to train?", options: ["It uses more electricity", "Fewer weight updates per epoch can mean more epochs are needed to reach the same accuracy", "It always crashes", "Batches must be powers of 10"], answer: 1, explain: "Time per epoch falls, but learning per epoch can fall too. Total time to accuracy has a sweet spot." },
];
const RESULT = {
  perfect: "Perfect! You can train models efficiently on a GPU.",
  good: "Good. Replay 'Throughput vs Memory' and find the largest batch that fits.",
  low: "Revisit 'Only 3× Faster?': fixed costs vs work per step is the key idea.",
  done: "Unit 5.4 Complete!",
  body: "You can choose batch sizes, reason about throughput, memory and learning speed, and apply the full GPU training recipe.",
  next: "Next up: Unit 5.5 — Capstone: Speed Up a Training Run.",
  teaser: "Take a slow image-classifier training run and apply every trick, measuring each one's effect.",
};
//@@WORDS
const UNIT_WORDS = [
  ["throughput", "work per second", "Here: images processed per second during training.", "from Unit 2.1"],
  ["OOM", "Out Of Memory", "The 'CUDA out of memory' error when tensors don't fit in GPU memory (Unit 5.8).", "new here"],
  ["cuDNN", "CUDA Deep Neural Network library", "NVIDIA's library of fast kernels for neural-network layers.", "new here"],
  ["AMP", "Automatic Mixed Precision", "autocast + GradScaler (Unit 5.2).", "from Unit 5.2"],
];
