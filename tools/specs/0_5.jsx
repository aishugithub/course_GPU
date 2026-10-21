//@@META
{"unit": "0.5", "module": 0, "title": "Layers = Matrix Multiplication", "icon": "🧱", "lab": "Lab0_AI_Basics.ipynb", "labNo": "0"}
//@@WIDGETS

// ── Section 1: Need — one neuron draws one straight line ──
const PTS = [
  [0.15, 0.2, 0], [0.25, 0.12, 0], [0.85, 0.82, 0], [0.75, 0.9, 0],
  [0.15, 0.82, 1], [0.25, 0.9, 1], [0.85, 0.15, 1], [0.78, 0.25, 1],
];
function NeedWidget() {
  const [ang, setAng] = useState(45);
  const [off, setOff] = useState(0);
  const [two, setTwo] = useState(false);
  const t = (ang * Math.PI) / 180;
  const side = (x, y) => Math.cos(t) * (x - 0.5) + Math.sin(t) * (y - 0.5) - off;
  const pred = (x, y) => (two ? (x + y > 0.6 && x + y < 1.4 ? 1 : 0) : side(x, y) > 0 ? 1 : 0);
  const right = PTS.filter(([x, y, c]) => pred(x, y) === c).length;
  const S = 260, P = (v) => 10 + v * S;
  // the single line: points where side = 0
  const dx = -Math.sin(t), dy = Math.cos(t), cx = 0.5 + off * Math.cos(t), cy = 0.5 + off * Math.sin(t);
  return (
    <div>
      <Frame>
        One neuron can only split the plane with <b style={{ color: C.text }}>one straight line</b>. Here mangoes 🟢 are ripe in the bottom-left
        and top-right, and unripe 🟠 in the other two corners. Turn and slide the line: can you put all the green on one side?
      </Frame>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${S + 20} ${S + 20}`} style={{ width: 280, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
          {two ? (
            <g>
              <line x1={P(0)} y1={P(1 - 0.6)} x2={P(0.6)} y2={P(1)} stroke={C.accent} strokeWidth="2.5" />
              <line x1={P(0.4)} y1={P(0)} x2={P(1)} y2={P(0.6)} stroke={C.accent} strokeWidth="2.5" />
            </g>
          ) : (
            <line x1={P(cx - dx * 2)} y1={P(1 - (cy - dy * 2))} x2={P(cx + dx * 2)} y2={P(1 - (cy + dy * 2))} stroke={C.accent} strokeWidth="2.5" />
          )}
          {PTS.map(([x, y, c], i) => {
            const ok = pred(x, y) === c;
            return <g key={i}><circle cx={P(x)} cy={P(1 - y)} r="9" fill={c ? C.orange : C.green} />{!ok && <circle cx={P(x)} cy={P(1 - y)} r="13" fill="none" stroke={C.red} strokeWidth="2" />}</g>;
          })}
        </svg>
        <div style={{ flex: 1, minWidth: 220 }}>
          {!two && <>
            <Slider label={<>angle = <b style={{ color: C.accent }}>{ang}°</b></>} value={ang} min={0} max={180} onChange={setAng} />
            <Slider label={<>slide = <b style={{ color: C.accent }}>{off}</b></>} value={off} min={-0.6} max={0.6} step={0.05} onChange={setOff} />
          </>}
          <Stat label="CORRECT" value={`${right} / 8`} color={right === 8 ? C.green : C.yellow} />
          <div style={{ marginTop: 10 }}>
            <Btn onClick={() => setTwo((v) => !v)} color={C.purple}>{two ? "◀ Back to one neuron" : "Use a layer of 2 neurons + 1 more ▶"}</Btn>
          </div>
          <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8 }}>{two ? "Two neurons each draw a line; a third neuron combines them: 'between the lines = unripe'." : "Red ring = wrong side. The best one line can do is 6 / 8."}</div>
        </div>
      </div>
      {two && (
        <Insight color={C.purple} title="More neurons, arranged in layers, can carve out shapes that one neuron can't.">
          The first layer draws several lines; the next layer combines them. Stack enough layers and the network can separate
          cats from dogs. That's why it's called <b>deep</b> learning.
        </Insight>
      )}
    </div>
  );
}

// ── Section 2: A layer = a matrix ──
const W = [[2, -1, 0.5], [1, 1, 1], [-1, 3, 0], [0.5, 0, -2]];
const XV = [1, 2, 3];
function LayerWidget() {
  const [k, setK] = useState(-1);
  const out = W.map((row) => row.reduce((s, w, j) => s + w * XV[j], 0));
  return (
    <div>
      <Frame>
        A <b style={{ color: C.text }}>layer</b> is several neurons all reading the same inputs. Write each neuron's weights as one row, and the
        rows form a grid of numbers: a <b style={{ color: C.accent }}>matrix</b> W. Press Step to compute one neuron (one row) at a time.
      </Frame>
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", fontFamily: "monospace" }}>
        <div>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>W (4 neurons × 3 inputs)</div>
          <div style={{ border: `1.5px solid ${C.accent}`, borderRadius: 8, padding: 6 }}>
            {W.map((row, i) => (
              <div key={i} style={{ display: "flex", gap: 4, background: i === k ? C.accent + "33" : "transparent", borderRadius: 4, padding: "2px 4px" }}>
                {row.map((v, j) => <span key={j} style={{ width: 36, textAlign: "right", color: C.text, fontSize: 13 }}>{v}</span>)}
              </div>
            ))}
          </div>
        </div>
        <div style={{ color: C.muted, fontSize: 20 }}>×</div>
        <div>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>x</div>
          <div style={{ border: `1.5px solid ${C.teal}`, borderRadius: 8, padding: 6 }}>
            {XV.map((v, j) => <div key={j} style={{ color: C.teal, fontSize: 13, width: 30, textAlign: "right", background: k >= 0 ? C.teal + "22" : "transparent" }}>{v}</div>)}
          </div>
        </div>
        <div style={{ color: C.muted, fontSize: 20 }}>=</div>
        <div>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>output</div>
          <div style={{ border: `1.5px solid ${C.green}`, borderRadius: 8, padding: 6 }}>
            {out.map((v, i) => <div key={i} style={{ color: i <= k ? C.green : C.border, fontSize: 13, width: 40, textAlign: "right", fontWeight: i === k ? 700 : 400 }}>{i <= k ? v : "?"}</div>)}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, minHeight: 22, fontFamily: "monospace", fontSize: 12.5, color: C.yellow }}>
        {k >= 0 ? `neuron ${k + 1}: ${W[k].map((w, j) => `(${w})(${XV[j]})`).join(" + ")} = ${out[k]}` : "Press Step to compute neuron 1."}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Btn onClick={() => setK((v) => Math.min(3, v + 1))}>Step ▶ ({k + 1} / 4)</Btn>
        <Btn ghost onClick={() => setK(-1)}>↺ Reset</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
        <Code color={C.orange} title="✍️ BY HAND: a loop of dot products">{`for i in range(4):          # each neuron
    out[i] = b[i]
    for j in range(3):      # each input
        out[i] += W[i][j] * x[j]`}</Code>
        <Code color={C.accent} title="🧮 AS MATHS / NUMPY">{`out = W @ x + b

# W @ x is "matrix times vector"`}</Code>
      </div>
      <Insight title="A whole layer is one matrix multiplication.">
        Every row of W is a neuron; every output number is one row "dotted" with the input. Four neurons × three inputs = 12 MACs.
        This is the operation the rest of the course is about.
      </Insight>
    </div>
  );
}

// ── Section 3: Stack layers — count parameters and MACs ──
function StackWidget() {
  const [layers, setLayers] = useState(2);
  const [width, setWidth] = useState(128);
  const sizes = [784, ...Array(layers).fill(width), 10];
  let params = 0, macs = 0;
  for (let i = 0; i < sizes.length - 1; i++) { params += sizes[i] * sizes[i + 1] + sizes[i + 1]; macs += sizes[i] * sizes[i + 1]; }
  return (
    <div>
      <Frame>
        A digit classifier takes 784 pixels in and gives 10 scores out (one per digit 0–9). In between are hidden layers. Change how many
        and how wide, and count the knobs (weights + biases, called <b style={{ color: C.text }}>parameters</b>) and the multiply-adds needed
        for <b style={{ color: C.text }}>one</b> image.
      </Frame>
      <Slider label={<>Hidden layers = <b style={{ color: C.accent }}>{layers}</b></>} value={layers} min={1} max={6} onChange={setLayers} />
      <Slider label={<>Neurons per hidden layer = <b style={{ color: C.accent }}>{width}</b></>} value={width} min={16} max={2048} step={16} onChange={setWidth} />
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", overflowX: "auto", padding: "10px 0" }}>
        {sizes.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 46, height: Math.max(14, Math.min(130, Math.sqrt(s) * 4)), background: (i === 0 ? C.teal : i === sizes.length - 1 ? C.green : C.accent) + "44", border: `1.5px solid ${i === 0 ? C.teal : i === sizes.length - 1 ? C.green : C.accent}`, borderRadius: 6 }} />
              <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{s}</div>
            </div>
            {i < sizes.length - 1 && <div style={{ color: C.muted, marginBottom: 20 }}>→</div>}
          </div>
        ))}
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 12, color: C.muted }}>shapes: {sizes.join(" → ")}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="PARAMETERS (KNOBS)" value={params.toLocaleString("en-IN")} color={C.purple} />
        <Stat label="MACs PER IMAGE" value={macs.toLocaleString("en-IN")} color={C.orange} />
      </div>
      <Insight color={C.purple} title="Each layer is a matrix, and its size multiplies fast.">
        Two layers of 128 already need about 1 lakh multiply-adds per digit. ChatGPT-class models have hundreds of layers and billions of
        parameters, so the number of multiply-adds gets enormous.
      </Insight>
    </div>
  );
}

// ── Section 4: A batch = matrix × matrix, every cell independent ──
function BatchWidget() {
  const N = 8;
  const [mode, setMode] = useState("idle");
  const [done, setDone] = useState(0);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);
  const run = (m) => {
    clearInterval(timer.current); setMode(m);
    if (m === "all") { setDone(0); setTimeout(() => setDone(N * N), 350); return; }
    setDone(0);
    timer.current = setInterval(() => setDone((d) => { if (d + 1 >= N * N) clearInterval(timer.current); return d + 1; }), 90);
  };
  return (
    <div>
      <Frame>
        AI feeds in a <b style={{ color: C.text }}>batch</b> of inputs at once. Stack 8 images as rows of a matrix X and the layer becomes
        <b style={{ color: C.accent }}> matrix × matrix</b>. Each output cell is one dot product (row of X · column of W) that needs no other cell.
        Compute the grid two ways.
      </Frame>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Btn onClick={() => run("one")} color={C.orange}>🐢 One cell at a time</Btn>
        <Btn onClick={() => run("all")} color={C.green}>⚡ All cells at once</Btn>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${N}, 26px)`, gap: 3 }}>
          {Array.from({ length: N * N }, (_, i) => (
            <div key={i} style={{ width: 26, height: 26, borderRadius: 4, background: i < done ? (mode === "all" ? C.green : C.orange) : C.card, border: `1px solid ${C.border}`, transition: mode === "all" ? "background 0.3s" : "none" }} />
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Stat label="CELLS DONE" value={`${done} / ${N * N}`} color={mode === "all" ? C.green : C.orange} />
          <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8, lineHeight: 1.7 }}>
            Real sizes: a batch of 64 images × 784 inputs × 128 neurons = <b style={{ color: C.text }}>64 × 128 = 8,192 cells</b>, each a 784-long
            dot product, for about <b style={{ color: C.orange }}>64 lakh MACs</b>, for just one layer of one batch.
          </div>
        </div>
      </div>
      <Code color={C.accent} title="🧮 THE WHOLE LAYER FOR A WHOLE BATCH">{`Y = X @ W.T + b      # X: (64, 784)   W: (128, 784)   →  Y: (64, 128)`}</Code>
      <Insight color={C.green} title="Every cell of a matrix multiply can be computed independently, so they can all be done at the same time.">
        A machine with one worker fills the grid cell by cell. A machine with thousands of workers fills it almost at once. Keep that
        thought: it is exactly the idea behind the GPU.
      </Insight>
      <LabCard part="E" title="A layer is a matrix multiply: prove it"
        what="Make a random batch X and weights W in NumPy, compute X @ W.T + b, and check it matches PyTorch's nn.Linear with the same weights. Then count the MACs."
        expect="the two outputs match (difference ≈ 0) and shape (64, 128)." />
    </div>
  );
}
//@@SECTIONS
[["One Line Isn't Enough", "📐 One Line Isn't Enough — why we need layers", "NeedWidget"],
 ["A Layer = A Matrix", "🧱 A Layer = A Matrix — many neurons, one multiply", "LayerWidget"],
 ["Stack the Layers", "🏗️ Stack the Layers — count the knobs and the work", "StackWidget"],
 ["Batches", "⚡ Batches — matrix × matrix, every cell independent", "BatchWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "A layer has 5 neurons and each reads 3 inputs. What is the shape of its weight matrix W?", options: ["(3, 3)", "(5, 3)", "(5, 5)", "(15,)"], answer: 1, explain: "One row per neuron, one column per input: 5 rows × 3 columns. That's 15 weights (plus 5 biases)." },
  { q: "W = [[1, 2], [3, 4]] and x = [1, 1]. What is W @ x?", options: ["[3, 7]", "[4, 6]", "[1, 2]", "[10]"], answer: 0, explain: "Row 1 · x = 1 + 2 = 3; Row 2 · x = 3 + 4 = 7. Each output is one row dotted with x." },
  { q: "Why can't a single neuron separate the 'ripe in opposite corners' mangoes?", options: ["It has too few inputs", "It can only draw one straight line", "Its learning rate is wrong", "The data has no labels"], answer: 1, explain: "A neuron's decision boundary is one straight line. Opposite corners need at least two lines, which takes a layer of neurons." },
  { q: "What makes a batch matrix multiply perfect for doing many things at once?", options: ["It uses only integers", "Each output cell is an independent dot product", "It needs no memory", "It is always small"], answer: 1, explain: "No output cell depends on another, so thousands of workers could each compute one cell simultaneously. That's the GPU's whole idea." },
];
const RESULT = {
  perfect: "Perfect! You see neural networks the way hardware does: as matrix multiplies.",
  good: "Good. Replay 'A Layer = A Matrix' and step through the rows again.",
  low: "Revisit 'A Layer = A Matrix': one row = one neuron is the key picture.",
  done: "Unit 0.5 Complete!",
  body: "You can write a layer as W @ x + b, count its parameters and multiply-adds, and explain why batches become matrix × matrix.",
  next: "Next up: Unit 0.C — Capstone: Train a Tiny Network.",
  teaser: "Put the neuron, the loss and gradient descent together, and watch a network learn in front of you.",
};
//@@WORDS
const UNIT_WORDS = [
  ["MAC", "Multiply-Accumulate", "Multiply, then add to a running total. A layer needs (inputs × neurons) of them.", "from Unit 0.3"],
  ["W @ x", "matrix multiplication", "Python's @ operator multiplies matrices: each output = one row of W dotted with x.", "new here"],
  ["MNIST", "the handwritten-digit dataset", "28 × 28 grey images, so 784 inputs.", "from Unit 0.2"],
];
