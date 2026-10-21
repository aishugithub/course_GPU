//@@META
{"unit": "0.2", "module": 0, "title": "Everything Is Numbers", "icon": "🔢", "lab": "Lab0_AI_Basics.ipynb", "labNo": "0"}
//@@WIDGETS

// ── Section 1: Need — the machine only does arithmetic ──
const THINGS = [
  { k: "photo", icon: "🐈", label: "A cat photo", nums: "[[ 12,  15,  20, …],\n [ 14, 180, 210, …],\n …  ]   ← brightness of every dot", note: "A grid of brightness values, one per dot." },
  { k: "text", icon: "💬", label: "\"I love mangoes\"", nums: "[ 41, 893, 2711 ]   ← one ID per word", note: "Each word swapped for its number in a dictionary." },
  { k: "song", icon: "🎵", label: "A song", nums: "[ 0.02, 0.31, 0.58, 0.44, -0.12, … ]   ← 44,100 per second", note: "Air pressure measured 44,100 times every second." },
];
function NeedWidget() {
  const [shown, setShown] = useState([]);
  return (
    <div>
      <Frame>
        From COA you know the ALU can only <b style={{ color: C.text }}>add, subtract, multiply and compare numbers</b>. Ask it to
        "multiply a cat by 2" and it has no idea what you mean. So every AI system starts by turning the world into numbers.
        Click each item to see what the computer actually receives.
      </Frame>
      {THINGS.map((t, i) => {
        const on = shown.includes(i);
        return (
          <div key={t.k} onClick={() => !on && setShown((s) => [...s, i])} style={{ display: "flex", gap: 14, alignItems: "center", background: C.card, border: `1.5px solid ${on ? C.teal : C.border}`, borderRadius: 10, padding: 12, marginBottom: 10, cursor: on ? "default" : "pointer" }}>
            <div style={{ fontSize: 34 }}>{t.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.text, fontWeight: 600, fontSize: 13.5 }}>{t.label} {!on && <span style={{ color: C.muted, fontWeight: 400 }}>→ click to convert</span>}</div>
              {on && <pre style={{ fontFamily: "monospace", fontSize: 12, color: C.teal, margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{t.nums}</pre>}
              {on && <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{t.note}</div>}
            </div>
          </div>
        );
      })}
      {shown.length === THINGS.length && (
        <Insight title="To a computer, every photo, sentence and song is just a long list of numbers.">
          AI never sees the cat. It sees numbers and does arithmetic on them. Keep this in mind for the whole course: that
          arithmetic is the work a GPU will later do very, very fast.
        </Insight>
      )}
    </div>
  );
}

// ── Section 2: Pictures are grids of numbers ──
const LEVELS = [0, 128, 255];
const SEVEN = [
  "00000000", "02222220", "00000220", "00000200", "00002200", "00002000", "00022000", "00000000",
].map((r) => r.split("").map((d) => LEVELS[Number(d)]));
function PixelWidget() {
  const [grid, setGrid] = useState(() => Array.from({ length: 8 }, () => Array(8).fill(0)));
  const [w, setW] = useState(28);
  const [colour, setColour] = useState(false);
  const click = (r, c) => setGrid((g) => g.map((row, i) => row.map((v, j) => (i === r && j === c ? LEVELS[(LEVELS.indexOf(v) + 1) % 3] : v))));
  const count = w * w * (colour ? 3 : 1);
  return (
    <div>
      <Frame>
        A digital image is a grid of tiny dots called <b style={{ color: C.text }}>pixels</b>. Each pixel stores one number: 0 = black,
        255 = white, anything in between is grey. Click the cells to draw (each click cycles 0 → 128 → 255) and watch the
        numbers the computer stores.
      </Frame>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 30px)", gap: 2, background: C.border, padding: 2, borderRadius: 6 }}>
            {grid.map((row, r) => row.map((v, c) => (
              <div key={r + "-" + c} onClick={() => click(r, c)} style={{ width: 30, height: 30, background: `rgb(${v},${v},${v})`, cursor: "pointer" }} />
            )))}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <Btn onClick={() => setGrid(SEVEN.map((r) => [...r]))}>Draw a 7</Btn>
            <Btn ghost onClick={() => setGrid(Array.from({ length: 8 }, () => Array(8).fill(0)))}>Clear</Btn>
          </div>
        </div>
        <pre style={{ flex: 1, minWidth: 250, margin: 0, background: C.card, border: `1.5px solid ${C.teal}`, borderRadius: 10, padding: 12, fontFamily: "monospace", fontSize: 11.5, color: C.teal, lineHeight: 1.75 }}>
          {grid.map((row) => row.map((v) => String(v).padStart(3, " ")).join(" ")).join("\n")}
        </pre>
      </div>
      <div style={{ marginTop: 18, background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 8 }}>How many numbers in one image?</div>
        <Slider label={<>Image width = height = <b style={{ color: C.accent }}>{w}</b> pixels</>} value={w} min={8} max={1080} step={4} onChange={setW} />
        <label style={{ color: C.muted, fontSize: 12.5, cursor: "pointer" }}><input type="checkbox" checked={colour} onChange={(e) => setColour(e.target.checked)} /> Colour image (3 numbers per pixel: Red, Green, Blue)</label>
        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <Stat label="NUMBERS STORED" value={count.toLocaleString("en-IN")} color={C.accent} />
          <Stat label="FOR COMPARISON" value={w === 28 && !colour ? "= one MNIST digit" : w >= 1000 ? "≈ a phone screenshot" : "—"} color={C.purple} />
        </div>
      </div>
      <Insight title="A small 28 × 28 grey digit is already 784 numbers. A 1080 × 1080 colour photo is about 35 lakh.">
        Every one of those numbers goes into the AI's arithmetic. That's why image AI needs so much computing power.
      </Insight>
    </div>
  );
}

// ── Section 3: Words become numbers ──
const VOCAB = { i: 41, love: 893, mangoes: 2711, mango: 2710, the: 5, bus: 1204, is: 12, late: 3330, auto: 1207, happy: 640, sad: 641, train: 1203, am: 30, very: 77, banana: 2712 };
const EMB = {
  mango: [0.82, 0.71], banana: [0.78, 0.80], apple: [0.88, 0.62],
  bus: [-0.70, 0.55], auto: [-0.62, 0.66], train: [-0.80, 0.42],
  happy: [0.10, -0.75], glad: [0.18, -0.82], sad: [-0.25, -0.70],
};
function WordsWidget() {
  const [text, setText] = useState("I love mangoes");
  const [pick, setPick] = useState("mango");
  const toks = text.toLowerCase().replace(/[^a-z ]/g, "").split(/\s+/).filter(Boolean);
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const near = Object.keys(EMB).filter((w) => w !== pick).sort((a, b) => dist(EMB[a], EMB[pick]) - dist(EMB[b], EMB[pick])).slice(0, 2);
  const X = (v) => 170 + v * 140, Y = (v) => 120 - v * 95;
  return (
    <div>
      <Frame>
        Text goes through two steps. <b style={{ color: C.text }}>Step 1:</b> chop the sentence into pieces called tokens and look each one
        up in a fixed dictionary to get an ID number. Type your own sentence.
      </Frame>
      <input value={text} onChange={(e) => setText(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 14, boxSizing: "border-box" }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {toks.map((t, i) => (
          <div key={i} style={{ background: C.card, border: `1.5px solid ${VOCAB[t] ? C.teal : C.red}`, borderRadius: 8, padding: "4px 10px", textAlign: "center" }}>
            <div style={{ color: C.text, fontSize: 12.5 }}>{t}</div>
            <div style={{ color: VOCAB[t] ? C.teal : C.red, fontFamily: "monospace", fontSize: 12 }}>{VOCAB[t] ?? "[UNK] 0"}</div>
          </div>
        ))}
      </div>
      <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Try: <i>the bus is late</i>, <i>I am very happy</i>. Red = not in this tiny dictionary ([UNK] = "unknown"). Real models know about 1 lakh tokens.</div>

      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, margin: "18px 0 10px" }}>
        <b style={{ color: C.text }}>Step 2:</b> an ID alone says nothing about meaning, because 2710 isn't "closer" to 2712 in any useful sense. So each
        token is turned into a list of numbers called an <b style={{ color: C.purple }}>embedding</b>, learned so that words with similar
        meanings end up close together. Real embeddings have hundreds of numbers per word; here we show just 2, so they fit on a map. Click a word.
      </div>
      <svg viewBox="0 0 340 240" style={{ width: "100%", maxWidth: 460, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <line x1="170" y1="10" x2="170" y2="230" stroke={C.border} /><line x1="10" y1="120" x2="330" y2="120" stroke={C.border} />
        {Object.entries(EMB).map(([w, v]) => (
          <g key={w} onClick={() => setPick(w)} style={{ cursor: "pointer" }}>
            <circle cx={X(v[0])} cy={Y(v[1])} r={w === pick ? 7 : 5} fill={w === pick ? C.purple : near.includes(w) ? C.teal : C.muted} />
            <text x={X(v[0]) + 9} y={Y(v[1]) + 4} fill={C.text} fontSize="11">{w}</text>
          </g>
        ))}
      </svg>
      <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 12.5, color: C.purple }}>{pick} → [{EMB[pick][0].toFixed(2)}, {EMB[pick][1].toFixed(2)}]</div>
      <div style={{ color: C.muted, fontSize: 12.5 }}>Nearest words: <b style={{ color: C.teal }}>{near.join(", ")}</b></div>
      <Insight color={C.purple} title="Words become lists of numbers, placed so that closeness means similar meaning.">
        Fruits sit together, vehicles sit together, feelings sit together. Chatbots work entirely in this world of number lists.
      </Insight>
    </div>
  );
}

// ── Section 4: Scalars → vectors → matrices → tensors ──
const SHAPES = [
  { k: "scalar", name: "Scalar", shape: "()", ex: "37.5", what: "One number, e.g. today's temperature.", n: 1 },
  { k: "vector", name: "Vector", shape: "(3,)", ex: "[4.5, 92, 1]", what: "A list: one student's hours, attendance %, and whether they did the homework.", n: 3 },
  { k: "matrix", name: "Matrix", shape: "(28, 28)", ex: "[[0, 0, …],\n [0, 255, …], …]", what: "A grid: one grey digit image.", n: 784 },
  { k: "tensor", name: "3-D tensor", shape: "(3, 224, 224)", ex: "[R grid, G grid, B grid]", what: "A stack of grids: one colour photo (3 colour layers).", n: 3 * 224 * 224 },
];
function TensorWidget() {
  const [sel, setSel] = useState(2);
  const [batch, setBatch] = useState(32);
  const s = SHAPES[sel];
  return (
    <div>
      <Frame>
        AI people use one word for "a box of numbers with some number of dimensions": a <b style={{ color: C.text }}>tensor</b>. Its
        <b style={{ color: C.accent }}> shape</b> tells you how the numbers are arranged. Click through the four kinds.
      </Frame>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {SHAPES.map((x, i) => <Btn key={x.k} ghost={i !== sel} onClick={() => setSel(i)}>{x.name}</Btn>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Code color={C.teal} title={`shape = ${s.shape}`}>{s.ex}</Code>
        <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
          {s.what}<br /><b style={{ color: C.text }}>{s.n.toLocaleString("en-IN")}</b> numbers.
        </div>
      </div>
      <div style={{ marginTop: 16, background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>AI never handles one image at a time. It takes a <span style={{ color: C.orange }}>batch</span>.</div>
        <Slider label={<>Batch size = <b style={{ color: C.orange }}>{batch}</b> colour photos</>} value={batch} min={1} max={256} onChange={setBatch} color={C.orange} />
        <div style={{ fontFamily: "monospace", fontSize: 13, color: C.text }}>shape = ({batch}, 3, 224, 224) → <b style={{ color: C.orange }}>{(batch * 3 * 224 * 224).toLocaleString("en-IN")}</b> numbers in one go</div>
      </div>
      <Insight title="Shapes are how AI code describes its data.">
        A batch of photos is a 4-D tensor. You'll see shapes like (32, 3, 224, 224) printed constantly in PyTorch, and a GPU is
        built to chew through tensors this size.
      </Insight>
      <LabCard part="B" title="Look inside a real image"
        what="Load a handwritten digit from the MNIST dataset, print its 28 × 28 grid of numbers, check its shape, and draw it back as a picture."
        expect="shape (28, 28), values between 0 and 255, and the digit outlined in the printed numbers." />
    </div>
  );
}
//@@SECTIONS
[["Only Numbers", "🔢 Only Numbers — what the machine actually receives", "NeedWidget"],
 ["Pictures = Grids", "🖼️ Pictures Are Grids — pixels are numbers", "PixelWidget"],
 ["Words → Numbers", "💬 Words Become Numbers — tokens and embeddings", "WordsWidget"],
 ["Tensors & Shapes", "📦 Tensors & Shapes — boxes of numbers", "TensorWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "A grey image is 28 pixels wide and 28 pixels tall. How many numbers does the computer store for it?", options: ["28", "56", "784", "2,352"], answer: 2, explain: "One number per pixel: 28 × 28 = 784. A colour image would need 3 per pixel (R, G, B), giving 2,352." },
  { q: "Why are words turned into embeddings instead of being left as dictionary IDs?", options: ["IDs are too long to store", "IDs carry no meaning; embeddings place similar words close together", "Embeddings use fewer numbers", "GPUs cannot read integers"], answer: 1, explain: "ID 2710 being next to 2712 means nothing. Embeddings are learned so that distance reflects meaning: mango sits near banana." },
  { q: "A batch of 64 colour photos, each 224 × 224, has which shape?", options: ["(64, 224)", "(224, 224, 64)", "(64, 3, 224, 224)", "(3, 64)"], answer: 2, explain: "Batch size first, then 3 colour layers, then height and width: (64, 3, 224, 224)." },
  { q: "Pixel value 0 means black and 255 means white. What does 128 look like?", options: ["Bright red", "Mid grey", "Transparent", "An error"], answer: 1, explain: "128 is about halfway between 0 and 255, so it's mid grey. Brightness is just a number." },
];
const RESULT = {
  perfect: "Perfect! You see the world the way an AI does: as numbers.",
  good: "Good. Replay 'Tensors & Shapes' to lock in what a shape means.",
  low: "Revisit 'Pictures Are Grids': every pixel is one number, and that idea is the base for everything else.",
  done: "Unit 0.2 Complete!",
  body: "You can turn images and text into numbers and describe them with tensor shapes.",
  next: "Next up: Unit 0.3 — The Neuron.",
  teaser: "The tiny calculator, built from multiply and add, that all of AI is made of.",
};
//@@WORDS
const UNIT_WORDS = [
  ["ALU", "Arithmetic Logic Unit", "The part of a processor that adds, multiplies and compares numbers.", "from COA"],
  ["RGB", "Red, Green, Blue", "The three numbers stored for every pixel of a colour image.", "new here"],
  ["MNIST", "Modified National Institute of Standards and Technology dataset", "70,000 small images of handwritten digits 0–9, the classic first AI dataset.", "new here"],
  ["UNK", "Unknown token", "The placeholder used for a word that isn't in the dictionary.", "new here"],
];
