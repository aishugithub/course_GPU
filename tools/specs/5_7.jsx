//@@META
{"unit": "5.7", "module": 5, "title": "Will It Fit? Sizing GPU Memory", "icon": "📏", "lab": "Lab5B_GPUs_in_Real_Projects.ipynb", "labNo": "5B", "gpu": true}
//@@WIDGETS

const GPUS = [["T4 (Colab)", 16], ["L4", 24], ["A100 40 GB", 40], ["A100 80 GB", 80]];

// ── Section 1: Need — where does the memory go? ──
function NeedWidget() {
  const [mode, setMode] = useState("infer");
  const parts = mode === "infer"
    ? [["Weights", 2, C.accent, "the model itself"]]
    : [["Weights (FP16)", 2, C.accent, "used in forward and backward"], ["Gradients (FP16)", 2, C.orange, "one per weight, from backward"], ["Master weights (FP32)", 4, C.purple, "exact copy for safe updates (Unit 5.2)"], ["Adam state m (FP32)", 4, C.teal, "running average of gradients"], ["Adam state v (FP32)", 4, C.green, "running average of squared gradients"]];
  const total = parts.reduce((s, p) => s + p[1], 0);
  return (
    <div>
      <Frame>
        "CUDA out of memory" is the most common error in AI projects. To avoid it, count the bytes <b style={{ color: C.text }}>per parameter</b>. Compare using a model in
        FP16 with training it using mixed precision and the popular Adam optimiser.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Btn ghost={mode !== "infer"} onClick={() => setMode("infer")}>Inference (FP16)</Btn>
        <Btn ghost={mode !== "train"} onClick={() => setMode("train")} color={C.orange}>Training (mixed precision + Adam)</Btn>
      </div>
      <div style={{ display: "flex", height: 40, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
        {parts.map(([t, b, c]) => <div key={t} style={{ width: `${(b / 16) * 100}%`, background: c, display: "flex", alignItems: "center", justifyContent: "center", color: "#0D1117", fontSize: 10.5, fontWeight: 700, borderRight: "1px solid #0D1117" }}>{b} B</div>)}
      </div>
      <div style={{ marginTop: 8 }}>
        {parts.map(([t, b, c, d]) => <div key={t} style={{ fontSize: 12.5, color: C.muted, marginBottom: 2 }}><span style={{ color: c }}>■</span> <b style={{ color: C.text }}>{t}</b>: {b} bytes per parameter. {d}</div>)}
      </div>
      <Stat label="BYTES PER PARAMETER (BEFORE ACTIVATIONS)" value={`${total}`} color={mode === "infer" ? C.accent : C.orange} />
      <Insight color={C.orange} title="Training needs about 8× the memory of inference: roughly 16 bytes per parameter instead of 2, before activations.">
        That's why a model you can <i>run</i> on a T4 may be far too big to <i>train</i> on it. (The 16-byte figure is the standard estimate for
        mixed-precision Adam; other optimisers need less.)
      </Insight>
    </div>
  );
}

// ── Section 2: The calculator ──
function CalcWidget() {
  const [params, setParams] = useState(1);
  const [mode, setMode] = useState("train16");
  const per = { infer16: 2, infer8: 1, infer4: 0.5, train32sgd: 12, train16: 16 }[mode];
  const weightsGB = params * per;
  const extra = mode.startsWith("infer") ? weightsGB * 0.2 : params * 2;   // activations / workspace, rough
  const total = weightsGB + extra + 0.5;                                   // + ~0.5 GB CUDA context
  const MODES = [["infer16", "Inference FP16"], ["infer8", "Inference INT8"], ["infer4", "Inference INT4"], ["train32sgd", "Train FP32 + SGD-momentum"], ["train16", "Train mixed + Adam"]];
  return (
    <div>
      <Frame>Size any project. Pick a model size and what you'll do with it, and see which GPUs it fits on. (Rough estimate: the activation part depends heavily on batch size and model type.)</Frame>
      <Slider label={<>Model size = <b style={{ color: C.accent }}>{params} billion</b> parameters</>} value={params} min={0.1} max={70} step={0.1} onChange={setParams} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {MODES.map(([k, t]) => <Btn key={k} ghost={k !== mode} onClick={() => setMode(k)} color={k.startsWith("train") ? C.orange : C.accent}>{t}</Btn>)}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label={`MODEL STATE (${per} B/param)`} value={`${weightsGB.toFixed(1)} GB`} color={C.accent} />
        <Stat label="+ ACTIVATIONS, WORKSPACE (ROUGH)" value={`${extra.toFixed(1)} GB`} color={C.teal} />
        <Stat label="TOTAL ≈" value={`${total.toFixed(1)} GB`} color={C.text} />
      </div>
      <div style={{ marginTop: 12 }}>
        {GPUS.map(([g, gb]) => (
          <div key={g} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 110, color: C.text, fontSize: 12.5 }}>{g}</div>
            <div style={{ flex: 1, height: 16, background: C.card, borderRadius: 4, position: "relative", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (total / gb) * 100)}%`, height: "100%", background: total <= gb ? C.green : C.red }} />
            </div>
            <div style={{ width: 120, fontFamily: "monospace", fontSize: 12, color: total <= gb ? C.green : C.red }}>{total <= gb ? `✓ ${((total / gb) * 100).toFixed(0)}% full` : `✗ needs ${Math.ceil(total / gb)} GPUs`}</div>
          </div>
        ))}
      </div>
      <Insight title="Rule of thumb: inference ≈ 2 bytes/param (FP16); training ≈ 16 bytes/param (mixed precision + Adam); plus activations.">
        A 1-billion-parameter model: about 2 GB to run, about 16 GB or more to train. The T4 can run a 7B model in INT8, but can only train models of
        roughly half a billion parameters.
      </Insight>
    </div>
  );
}

// ── Section 3: Activations grow with the batch ──
function ActWidget() {
  const [B, setB] = useState(256);
  const [w, setW] = useState(1024);
  const layers = [784, w, w, w, w, 10];
  const actFloats = layers.slice(1).reduce((s, n) => s + n, 0) * 2 * B;   // each layer output (and its ReLU copy) is saved
  const actMB = actFloats * 4 / 1e6;
  const params = layers.slice(0, -1).reduce((s, n, i) => s + n * layers[i + 1] + layers[i + 1], 0);
  const stateMB = params * 16 / 1e6;
  return (
    <div>
      <Frame>
        Activations are the layer outputs saved for the backward pass (Unit 1.2). Their size is <b style={{ color: C.text }}>batch × (sum of layer widths) × bytes</b>, so
        they grow with the batch, unlike the weights. Here's a 4-hidden-layer network like the ones in this course.
      </Frame>
      <Slider label={<>Batch size = <b style={{ color: C.orange }}>{B}</b></>} value={B} min={1} max={8192} onChange={setB} color={C.orange} />
      <Slider label={<>Hidden width = <b style={{ color: C.accent }}>{w}</b></>} value={w} min={128} max={8192} step={128} onChange={setW} />
      <div style={{ display: "flex", height: 34, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
        <div style={{ width: `${(stateMB / (stateMB + actMB)) * 100}%`, background: C.purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, color: "#0D1117", fontWeight: 700 }}>{stateMB / (stateMB + actMB) > 0.2 ? "model state" : ""}</div>
        <div style={{ width: `${(actMB / (stateMB + actMB)) * 100}%`, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, color: "#0D1117", fontWeight: 700 }}>{actMB / (stateMB + actMB) > 0.2 ? "activations" : ""}</div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="PARAMETERS" value={params.toLocaleString("en-IN")} color={C.accent} />
        <Stat label="MODEL STATE (16 B/PARAM)" value={`${(stateMB / 1000).toFixed(2)} GB`} color={C.purple} />
        <Stat label="ACTIVATIONS (FP32)" value={`${(actMB / 1000).toFixed(2)} GB`} color={C.orange} />
      </div>
      <Insight color={C.orange} title="Small batch: the model state dominates. Big batch: activations take over.">
        That's why lowering the batch size is the first fix for 'out of memory', and why mixed precision (half-size activations) lets batches double.
        In transformer models activations also grow with the sequence length, often the biggest memory cost.
      </Insight>
    </div>
  );
}

// ── Section 4: Tricks to make it fit ──
const TRICKS = [
  { t: "Smaller batch + gradient accumulation", c: C.orange, d: "Run 4 small batches, add up their gradients, then do ONE update: the same maths as one big batch, with a quarter of the activation memory.", code: `for i, (x, y) in enumerate(loader):          # batch 64, acting like 256
    loss = loss_fn(model(x), y) / 4
    loss.backward()                           # gradients ADD up
    if (i + 1) % 4 == 0:
        opt.step(); opt.zero_grad()` },
  { t: "Mixed precision", c: C.green, d: "FP16 activations and weights for compute: about half the activation memory (Unit 5.2).", code: `with torch.autocast("cuda", dtype=torch.float16):
    loss = loss_fn(model(x), y)` },
  { t: "Gradient checkpointing", c: C.purple, d: "Save only some layers' outputs and recompute the rest during backward: much less activation memory, for about 30% more compute.", code: `from torch.utils.checkpoint import checkpoint
h = checkpoint(block, h, use_reentrant=False)   # recomputed in backward` },
  { t: "Quantised inference (INT8 / INT4)", c: C.teal, d: "Store weights in 8 or 4 bits for running a model: 2–4× smaller than FP16 (Unit 5.2). Common for running chatbots on small GPUs.", code: `# e.g. with the bitsandbytes library through Hugging Face:
from transformers import BitsAndBytesConfig
model = AutoModelForCausalLM.from_pretrained(
    name, quantization_config=BitsAndBytesConfig(load_in_8bit=True))` },
  { t: "Freeze most layers / LoRA fine-tuning", c: C.yellow, d: "Fine-tune only small add-on matrices (LoRA) while the big model stays frozen in FP16: gradients and Adam states are needed for well under 1% of the parameters.", code: `for p in base_model.parameters():
    p.requires_grad = False          # frozen: no gradients, no Adam state
# then train only the small adapter layers` },
];
function TricksWidget() {
  const [i, setI] = useState(0);
  const t = TRICKS[i];
  return (
    <div>
      <Frame>When the numbers say "doesn't fit", engineers reach for these. Click each.</Frame>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {TRICKS.map((x, k) => <Btn key={k} ghost={k !== i} onClick={() => setI(k)} color={x.c}>{x.t}</Btn>)}
      </div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>{t.d}</div>
      <Code color={t.c}>{t.code}</Code>
      <Insight color={C.green} title="Every trick trades something: time, a little accuracy, or flexibility, for memory.">
        Pick based on the calculator: if the model state is the problem, quantise or use LoRA; if activations are the problem, shrink the batch,
        accumulate gradients, or checkpoint.
      </Insight>
      <LabCard part="B" title="Measure memory step by step"
        what="Use torch.cuda.memory_allocated() to watch memory grow as you create a model, run a forward pass, call backward, and take an Adam step; then compare with the 16-bytes-per-parameter estimate, and measure activations at several batch sizes."
        expect="memory jumping at each stage (weights → activations → gradients → Adam states), close to your estimate, and activations growing in step with the batch size." />
    </div>
  );
}
//@@SECTIONS
[["Where Memory Goes", "📏 Where the Memory Goes — bytes per parameter", "NeedWidget"],
 ["The Calculator", "🧮 Will It Fit? — the calculator", "CalcWidget"],
 ["Activations", "📈 Activations — the part that grows with the batch", "ActWidget"],
 ["Tricks to Fit", "🧰 Tricks to Make It Fit", "TricksWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "Roughly how much GPU memory do the weights of a 3-billion-parameter model need for FP16 inference?", options: ["1.5 GB", "3 GB", "6 GB", "48 GB"], answer: 2, explain: "2 bytes per parameter × 3 × 10⁹ = 6 GB (plus some extra for activations)." },
  { q: "Why does training with Adam need about 16 bytes per parameter in mixed precision?", options: ["Adam stores the dataset", "FP16 weights + FP16 gradients + FP32 master weights + two FP32 Adam states", "Training uses FP64", "The GPU duplicates everything"], answer: 1, explain: "2 + 2 + 4 + 4 + 4 = 16 bytes per parameter, before activations." },
  { q: "Doubling the batch size roughly doubles which part of training memory?", options: ["The weights", "The Adam states", "The activations", "The CUDA context"], answer: 2, explain: "Activations are stored per example, so they scale with the batch. Weights and optimiser states don't." },
  { q: "Gradient accumulation lets you…", options: ["Train without a GPU", "Get the effect of a large batch using several small batches and one update", "Skip the backward pass", "Use INT4 training"], answer: 1, explain: "Gradients from several small batches are added up before a single optimiser step: same maths, less activation memory." },
];
const RESULT = {
  perfect: "Perfect! You can size any AI project's memory.",
  good: "Good. Replay 'The Calculator' with inference vs training.",
  low: "Revisit 'Where the Memory Goes': 2 bytes to run, about 16 to train.",
  done: "Unit 5.7 Complete!",
  body: "You can estimate weights, gradients, optimiser states and activations, decide whether a project fits, and choose tricks to make it fit.",
  next: "Next up: Unit 5.8 — nvidia-smi & Out-of-Memory.",
  teaser: "Read the GPU's dashboard, decode the dreaded OOM message, and hunt down memory leaks.",
};
//@@WORDS
const UNIT_WORDS = [
  ["Adam", "Adaptive Moment Estimation", "A popular optimiser that keeps two running averages (m, v) per parameter.", "new here"],
  ["activations", "saved layer outputs", "Stored in forward, used in backward (Unit 1.2).", "from Unit 1.2"],
  ["LoRA", "Low-Rank Adaptation", "Fine-tuning by training small add-on matrices while the big model stays frozen.", "new here"],
  ["OOM", "Out Of Memory", "The 'CUDA out of memory' error.", "from Unit 5.4"],
  ["CUDA context", "the driver's per-process setup", "Takes a few hundred MB of GPU memory before any tensor exists.", "new here"],
];
