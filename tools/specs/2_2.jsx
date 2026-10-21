//@@META
{"unit": "2.2", "module": 2, "title": "Training vs Inference, Epochs & Batches", "icon": "🏋️", "lab": "Lab02_AI_Is_Hungry.ipynb", "labNo": 2}
//@@WIDGETS

const fmt = (x) => {
  const u = [["", 1], [" thousand", 1e3], [" million", 1e6], [" billion", 1e9], [" trillion", 1e12], [" quadrillion", 1e15], [" quintillion", 1e18], [" sextillion", 1e21], [" septillion", 1e24]];
  let k = 0; while (k < u.length - 1 && x >= u[k + 1][1]) k++;
  return `${(x / u[k][1]).toFixed(x / u[k][1] < 10 ? 1 : 0)}${u[k][0]}`;
};

// ── Section 1: Need — using a model vs teaching it ──
function NeedWidget() {
  const [mode, setMode] = useState("infer");
  const steps = mode === "infer"
    ? [["Forward pass", "Data flows in, through every layer, to an answer.", 1, C.accent]]
    : [["Forward pass", "Same as using it: compute the answer.", 1, C.accent], ["Backward pass", "Work out every weight's gradient, layer by layer, from the output back to the input. About twice the work of the forward pass.", 2, C.orange], ["Update", "Nudge every weight: w ← w − lr × gradient.", 0.1, C.green]];
  const total = steps.reduce((s, x) => s + x[2], 0);
  return (
    <div>
      <Frame>
        An AI model has two lives. <b style={{ color: C.accent }}>Inference</b> is using a trained model, like writing an exam.
        <b style={{ color: C.orange }}> Training</b> is teaching it, like the months of preparation before. Switch between them and see what has
        to be computed for ONE example.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Btn ghost={mode !== "infer"} onClick={() => setMode("infer")}>📝 Inference (use it)</Btn>
        <Btn ghost={mode !== "train"} onClick={() => setMode("train")} color={C.orange}>🏋️ Training (teach it)</Btn>
      </div>
      {steps.map(([t, d, c, col]) => (
        <div key={t} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><b style={{ color: col }}>{t}</b><span style={{ color: C.muted, fontFamily: "monospace" }}>≈ {c}× forward</span></div>
          <div style={{ height: 14, background: C.card, borderRadius: 4 }}><div style={{ width: `${(c / 3.1) * 100}%`, height: "100%", background: col, borderRadius: 4, minWidth: 6 }} /></div>
          <div style={{ color: C.muted, fontSize: 12.5, marginTop: 3 }}>{d}</div>
        </div>
      ))}
      <Stat label="WORK PER EXAMPLE" value={`≈ ${total.toFixed(1)}× a forward pass`} color={mode === "infer" ? C.accent : C.orange} />
      <Insight color={C.orange} title="Training one example costs about 3 forward passes, and training sees each example many times over.">
        Inference happens once per question. Training repeats forward + backward + update over the whole dataset, again and again. That's why
        training is the hungriest job in AI.
      </Insight>
    </div>
  );
}

// ── Section 2: Forward and backward, traced ──
const FB = [
  { a: -1, txt: "A batch of images enters the input layer.", phase: "f" },
  { a: 0, txt: "Layer 1 computes X @ W₁ + b₁, then ReLU. Its output is SAVED in memory: backward will need it.", phase: "f" },
  { a: 1, txt: "Layer 2 does the same with W₂. Output saved again.", phase: "f" },
  { a: 2, txt: "Layer 3 gives the 10 scores, and the loss compares them with the right answers.", phase: "f" },
  { a: 2, txt: "BACKWARD starts at the loss: how should the scores change? That gives the gradient for W₃.", phase: "b" },
  { a: 1, txt: "Pass the blame back one layer (using the saved output of layer 2) to get W₂'s gradient.", phase: "b" },
  { a: 0, txt: "Back again, using layer 1's saved output, to get W₁'s gradient. This is backpropagation.", phase: "b" },
  { a: 3, txt: "UPDATE: every weight takes its small step. One iteration done; the saved outputs can be thrown away.", phase: "u" },
];
function TraceWidget() {
  const [i, setI] = useState(0);
  const s = FB[i];
  const col = s.phase === "f" ? C.accent : s.phase === "b" ? C.orange : C.green;
  const saved = FB.slice(0, i + 1).filter((x) => x.phase === "f" && x.a >= 0 && x.a < 2).length;
  return (
    <div>
      <Frame>Step through one training iteration on a 3-layer network. Watch the direction change, and watch what has to be remembered.</Frame>
      <svg viewBox="0 0 560 150" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        {["Input", "Layer 1", "Layer 2", "Layer 3 + loss"].map((t, k) => {
          const on = (s.phase !== "u" && s.a === k - 1) || (s.phase === "f" && s.a === -1 && k === 0) || s.phase === "u";
          return (
            <g key={t}>
              <rect x={20 + k * 135} y="40" width="110" height="56" rx="8" fill={on ? col + "33" : C.surface} stroke={on ? col : C.border} strokeWidth="2" />
              <text x={75 + k * 135} y="73" fill={C.text} fontSize="12" textAnchor="middle">{t}</text>
              {k > 0 && k < 3 && saved >= k && s.phase !== "u" && <text x={75 + k * 135} y="116" fill={C.teal} fontSize="10" textAnchor="middle">💾 output saved</text>}
              {k < 3 && <text x={140 + k * 135} y="72" fill={C.muted} fontSize="14" textAnchor="middle">{s.phase === "b" ? "←" : "→"}</text>}
            </g>
          );
        })}
        <text x="20" y="22" fill={col} fontSize="12" fontWeight="700">{s.phase === "f" ? "FORWARD →" : s.phase === "b" ? "← BACKWARD" : "UPDATE ✓"}</text>
      </svg>
      <div style={{ marginTop: 10, minHeight: 40, color: C.text, fontSize: 13, lineHeight: 1.6 }}>{s.txt}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={() => setI((v) => Math.min(FB.length - 1, v + 1))}>Step ▶ ({i + 1} / {FB.length})</Btn>
        <Btn ghost onClick={() => setI(0)}>↺ Reset</Btn>
      </div>
      <Insight color={C.teal} title="Training needs extra memory as well as extra arithmetic.">
        Every layer's output from the forward pass is stored until the backward pass uses it. Big batches × big layers = lots of saved numbers.
        In Module 7 this is the reason for the famous "CUDA out of memory" error.
      </Insight>
    </div>
  );
}

// ── Section 3: Epochs, batches, iterations ──
function EpochWidget() {
  const [N, setN] = useState(60000);
  const [B, setB] = useState(64);
  const [E, setE] = useState(3);
  const iters = Math.ceil(N / B);
  const [cur, setCur] = useState(0);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);
  const play = () => { clearInterval(timer.current); setCur(0); timer.current = setInterval(() => setCur((c) => { if (c >= 39) { clearInterval(timer.current); return 39; } return c + 1; }), 80); };
  return (
    <div>
      <Frame>
        Three words you'll see in every training log. A <b style={{ color: C.orange }}>batch</b> is a handful of examples processed together.
        An <b style={{ color: C.accent }}>iteration</b> is one forward + backward + update on one batch. An <b style={{ color: C.purple }}>epoch</b> is
        one full pass over the whole dataset.
      </Frame>
      <Slider label={<>Dataset size = <b style={{ color: C.teal }}>{N.toLocaleString("en-IN")}</b> examples</>} value={N} min={1000} max={100000} step={1000} onChange={setN} color={C.teal} />
      <Slider label={<>Batch size = <b style={{ color: C.orange }}>{B}</b></>} value={B} min={1} max={1024} onChange={setB} color={C.orange} />
      <Slider label={<>Epochs = <b style={{ color: C.purple }}>{E}</b></>} value={E} min={1} max={50} onChange={setE} color={C.purple} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="ITERATIONS PER EPOCH" value={iters.toLocaleString("en-IN")} color={C.accent} />
        <Stat label="TOTAL WEIGHT UPDATES" value={(iters * E).toLocaleString("en-IN")} color={C.green} />
        <Stat label="EXAMPLES PROCESSED" value={(N * E).toLocaleString("en-IN")} color={C.purple} />
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>One epoch, drawn as 40 slices of the dataset:</div>
        <div style={{ display: "flex", gap: 2 }}>{Array.from({ length: 40 }, (_, k) => <div key={k} style={{ flex: 1, height: 22, borderRadius: 3, background: k < cur ? C.green : k === cur ? C.orange : C.card, border: `1px solid ${C.border}` }} />)}</div>
        <div style={{ marginTop: 8 }}><Btn onClick={play} color={C.orange}>▶ Play an epoch</Btn></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
        {[["Batch = 1", C.red, "Very noisy steps, and the hardware sits mostly idle: a tiny matrix multiply can't keep many workers busy."], ["Batch = 32–512", C.green, "The usual sweet spot: big enough matrix multiplies, steady steps, fits in memory."], ["Batch = huge", C.yellow, "Needs lots of memory, and makes fewer (if larger) updates per epoch."]].map(([t, c, d]) => (
          <div key={t} style={{ background: C.card, borderRadius: 8, padding: 10, border: `1.5px solid ${c}` }}><b style={{ color: c, fontSize: 12.5 }}>{t}</b><div style={{ color: C.muted, fontSize: 12, marginTop: 4, lineHeight: 1.6 }}>{d}</div></div>
        ))}
      </div>
      <Insight color={C.purple} title="Batches turn many small sums into one big matrix multiply.">
        From Unit 1.5: a batch makes the layer X @ W with many rows. Bigger, fewer matrix multiplies suit parallel hardware far better than
        thousands of tiny ones. Unit 6.4 measures this on a real GPU.
      </Insight>
    </div>
  );
}

// ── Section 4: The training bill ──
function BillWidget() {
  const [params, setParams] = useState(1);
  const [tokens, setTokens] = useState(20);
  const P = params * 1e9, D = tokens * 1e9;
  const train = 6 * P * D;
  const answer = 2 * P * 650;
  const t4 = 6.5e13 * 0.4;
  const days = train / t4 / 86400;
  return (
    <div>
      <Frame>
        A widely used rule of thumb for language models: <b style={{ color: C.text }}>training FLOPs ≈ 6 × parameters × training tokens</b>
        (2 for forward + 4 for backward, per parameter per token). Compare that with answering one question.
      </Frame>
      <Slider label={<>Model size = <b style={{ color: C.accent }}>{params} billion</b> parameters</>} value={params} min={0.1} max={200} step={0.1} onChange={setParams} />
      <Slider label={<>Training data = <b style={{ color: C.purple }}>{tokens} billion</b> tokens</>} value={tokens} min={1} max={2000} onChange={setTokens} color={C.purple} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="TRAINING (ONCE)" value={`${fmt(train)} FLOPs`} color={C.orange} />
        <Stat label="ONE 500-WORD ANSWER" value={`${fmt(answer)} FLOPs`} color={C.accent} />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <Stat label="ON ONE T4 GPU (40% OF PEAK)" value={days < 1 ? `${(days * 24).toFixed(1)} hours` : days < 730 ? `${days.toFixed(0)} days` : `${(days / 365).toFixed(0)} years`} color={days > 365 ? C.red : C.yellow} />
        <Stat label="TRAINING = HOW MANY ANSWERS?" value={fmt(train / answer)} color={C.purple} />
      </div>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 6 }}>Assumes the T4's 65 TFLOPS FP16 peak and 40% average use (approximate). Real projects use thousands of bigger GPUs at once.</div>
      <Insight color={C.orange} title="Training is a one-time mountain; inference is a daily river.">
        A big model's training run would take a single GPU centuries, so companies split it across thousands of GPUs (Unit 7.4). Serving
        crores of users adds up too. Either way the answer is the same: more parallel arithmetic.
      </Insight>
      <LabCard part="B" title="Time inference vs training on the CPU"
        what="Take your Lab 1 network, time 100 forward passes on a batch, then time 100 full training iterations (forward + backward + update), and compute the ratio."
        expect="a training iteration takes roughly 2–4× as long as a forward pass alone." />
    </div>
  );
}
//@@SECTIONS
[["Use vs Teach", "📝 Use vs Teach — inference and training", "NeedWidget"],
 ["Forward & Backward", "🔁 Forward & Backward — one iteration, traced", "TraceWidget"],
 ["Epochs & Batches", "🍰 Epochs, Batches, Iterations — the vocabulary of training", "EpochWidget"],
 ["The Training Bill", "🧾 The Training Bill — 6 × parameters × tokens", "BillWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "A dataset has 10,000 images and the batch size is 100. How many iterations make one epoch?", options: ["10", "100", "1,000", "10,000"], answer: 1, explain: "10,000 ÷ 100 = 100 batches. Each batch is one iteration, and doing them all is one epoch." },
  { q: "Roughly how much work is ONE training step on an example, compared with one inference (forward pass)?", options: ["The same", "About half", "About 3 times", "About 100 times"], answer: 2, explain: "Forward (1×) + backward (≈ 2×) + a small update ≈ 3× a forward pass." },
  { q: "Why does training need much more memory than inference?", options: ["Weights are stored twice", "Each layer's forward output must be saved until the backward pass uses it", "The dataset is copied into every layer", "The learning rate takes memory"], answer: 1, explain: "Backpropagation needs the saved outputs (activations) of every layer, so they all stay in memory during the iteration." },
  { q: "Using training FLOPs ≈ 6 × parameters × tokens: a 1-billion-parameter model trained on 10 billion tokens needs about…", options: ["6 × 10¹⁰", "6 × 10¹⁹", "10¹⁹", "6 × 10⁹"], answer: 1, explain: "6 × 10⁹ × 10¹⁰ = 6 × 10¹⁹ FLOPs." },
];
const RESULT = {
  perfect: "Perfect! You can read a training log and estimate its cost.",
  good: "Good. Replay 'Forward & Backward' and watch the saved outputs.",
  low: "Revisit 'Use vs Teach' and 'Epochs & Batches': they're the vocabulary for the rest of the course.",
  done: "Unit 2.2 Complete!",
  body: "You can explain inference vs training, forward vs backward, and epochs vs batches vs iterations, and estimate a training bill.",
  next: "Next up: Unit 2.3 — Every Output Is Independent.",
  teaser: "All this work has a hidden gift: most of it doesn't have to wait in a queue.",
};
//@@WORDS
const UNIT_WORDS = [
  ["FLOP", "FLoating-point OPeration", "One add or multiply on decimal numbers.", "from Unit 2.1"],
  ["lr", "learning rate", "The size of each update step.", "from Unit 1.4"],
  ["CUDA", "Compute Unified Device Architecture", "NVIDIA's system for programming its GPUs. Used properly from Module 5.", "new here"],
  ["T4", "NVIDIA Tesla T4", "The GPU you get free in Google Colab.", "new here"],
];
