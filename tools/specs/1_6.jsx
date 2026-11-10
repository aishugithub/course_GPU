//@@META
{"unit": "1.6", "module": 1, "title": "Convolution: Looking at Pictures in Small Windows", "icon": "🔍", "lab": "SideTrails_Step1_More_AI_Maths.ipynb", "labNo": "Step 1 Side Trails", "labTrail": true, "gpu": true}
//@@WIDGETS

const fmtIN = (n) => Math.round(n).toLocaleString("en-IN");

// ── Section 1: Need — a plain layer has to relearn the same stroke at every place ──
// A "7" drawn on a 10 × 10 grid: a top bar and a slanting stroke.
const SEVEN = [[1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [2, 6], [3, 5], [4, 5], [5, 4], [6, 4], [7, 3], [8, 3]];
function MiniGrid({ cells, size = 10, px = 16, color = C.accent, ghost = [], ghostColor = C.orange }) {
  const on = new Set(cells.map(([r, c]) => r * size + c));
  const gh = new Set(ghost.map(([r, c]) => r * size + c));
  return (
    <svg viewBox={`0 0 ${size * px} ${size * px}`} style={{ width: size * px, maxWidth: "100%", background: C.card, borderRadius: 6, border: `1px solid ${C.border}` }}>
      {Array.from({ length: size * size }, (_, i) => {
        const r = Math.floor(i / size), c = i % size;
        const fill = on.has(i) ? color : gh.has(i) ? ghostColor + "55" : "transparent";
        return <rect key={i} x={c * px + 0.5} y={r * px + 0.5} width={px - 1} height={px - 1} fill={fill} stroke={C.border} strokeWidth="0.5" />;
      })}
    </svg>
  );
}
function ShiftWidget() {
  const [shift, setShift] = useState(0);
  const moved = SEVEN.map(([r, c]) => [r, c + shift]);
  const orig = new Set(SEVEN.map(([r, c]) => r * 10 + c));
  const same = moved.filter(([r, c]) => orig.has(r * 10 + c)).length;
  return (
    <div>
      <Frame>
        The digit reader you will build in Lesson 1.C flattens a 28 × 28 picture into one row of 784 numbers, and every neuron in its first layer has
        <b style={{ color: C.text }}> its own weight for every pixel</b>. Nila's teacher writes a "7". Slide it a few pixels to the right, as a
        different teacher might, and watch how many of the inked pixels the neurons were looking at are still inked.
      </Frame>
      <Slider label={<>move the 7 right by <b style={{ color: C.accent }}>{shift} pixel{shift === 1 ? "" : "s"}</b></>} value={shift} min={0} max={3} onChange={setShift} />
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <MiniGrid cells={moved} ghost={shift ? SEVEN : []} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 200 }}>
          <Stat label="INKED PIXELS STILL IN THE SAME PLACE" value={`${same} / ${SEVEN.length}`} color={same === SEVEN.length ? C.green : C.red} />
          <Stat label="WEIGHTS IN A PLAIN 784 → 128 LAYER" value={fmtIN(784 * 128)} color={C.yellow} />
          <div style={{ color: C.muted, fontSize: 12 }}>Orange = where the 7 used to be. Blue = where it is now.</div>
        </div>
      </div>
      <Insight color={C.purple} title="Same stroke, new place: to a plain layer it is a brand-new picture.">
        A slanting stroke means the same thing in the corner and in the middle, but a plain layer must learn it separately for every place.
        That wastes knobs. A convolution fixes it with one idea: look through a small window, and use <b>the same few weights at every position</b>.
      </Insight>
    </div>
  );
}

// ── Section 2: Slide the window — the book's 5 × 5 vertical-edge example ──
const FILTERS = {
  vertical: { name: "Vertical edge", w: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], note: "right column minus left column" },
  horizontal: { name: "Horizontal edge", w: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]], note: "bottom row minus top row" },
  sum: { name: "Add them all", w: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], note: "how much ink is in the window" },
};
const START_IMG = [0, 1, 2, 3, 4].map(() => [0, 0, 9, 9, 9]);
function convolve(img, w) {
  const n = img.length, out = [];
  for (let r = 0; r <= n - 3; r++) {
    const row = [];
    for (let c = 0; c <= n - 3; c++) {
      let s = 0;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += img[r + i][c + j] * w[i][j];
      row.push(s);
    }
    out.push(row);
  }
  return out;
}
function NumGrid({ grid, hi, onClick, cell = 34, color = C.teal, valueColor }) {
  return (
    <div style={{ display: "inline-grid", gridTemplateColumns: `repeat(${grid[0].length}, ${cell}px)`, gap: 2 }}>
      {grid.flatMap((row, r) => row.map((v, c) => {
        const inside = hi && r >= hi[0] && r < hi[0] + hi[2] && c >= hi[1] && c < hi[1] + hi[2];
        return (
          <div key={`${r}-${c}`} onClick={onClick ? () => onClick(r, c) : undefined}
            style={{ width: cell, height: cell, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, fontSize: 13, fontFamily: "monospace",
              cursor: onClick ? "pointer" : "default", background: inside ? C.purple + "44" : v === null ? C.bg : C.card,
              border: `1px solid ${inside ? C.purple : C.border}`, color: valueColor ? valueColor(v) : color }}>
            {v === null ? "" : v}
          </div>
        );
      }))}
    </div>
  );
}
function SlideWidget() {
  const [img, setImg] = useState(START_IMG);
  const [fk, setFk] = useState("vertical");
  const [pos, setPos] = useState(0);
  const w = FILTERS[fk].w;
  const out = convolve(img, w);
  const r = Math.floor(pos / 3), c = pos % 3;
  const shown = out.map((row, i) => row.map((v, j) => (i * 3 + j <= pos ? v : null)));
  const terms = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) terms.push([w[i][j], img[r + i][c + j]]);
  const toggle = (rr, cc) => setImg(img.map((row, i) => row.map((v, j) => (i === rr && j === cc ? (v ? 0 : 9) : v))));
  return (
    <div>
      <Frame>
        A tiny 5 × 5 picture: the left two columns are empty (0), the right three are inked (9). The <b style={{ color: C.purple }}>filter</b> is a 3 × 3
        grid of weights. At each position it does exactly what a neuron does: multiply the 9 pixels by its 9 weights and add them up. Step the window
        across the picture. (Click any pixel to ink or empty it.)
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {Object.entries(FILTERS).map(([k, f]) => <Btn key={k} ghost={fk !== k} onClick={() => setFk(k)}>{f.name}</Btn>)}
      </div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div><div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>IMAGE (5 × 5)</div><NumGrid grid={img} hi={[r, c, 3]} onClick={toggle} /></div>
        <div><div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>FILTER: {FILTERS[fk].note}</div>
          <NumGrid grid={w} cell={30} valueColor={(v) => (v > 0 ? C.green : v < 0 ? C.red : C.muted)} /></div>
        <div><div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>OUTPUT (3 × 3)</div>
          <NumGrid grid={shown} hi={[r, c, 1]} color={C.yellow} /></div>
      </div>
      <div style={{ marginTop: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontFamily: "monospace", fontSize: 12.5, color: C.muted, lineHeight: 1.7 }}>
        position {pos + 1} of 9: {terms.map(([a, b], i) => <span key={i}>{i ? " + " : ""}<span style={{ color: a > 0 ? C.green : a < 0 ? C.red : C.muted }}>{a}</span>×{b}</span>)}
        {" = "}<b style={{ color: C.yellow }}>{out[r][c]}</b>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Btn ghost onClick={() => setPos(Math.max(0, pos - 1))} disabled={pos === 0}>← Back</Btn>
        <Btn onClick={() => setPos(Math.min(8, pos + 1))} disabled={pos === 8}>Slide the window →</Btn>
        <Btn ghost onClick={() => { setPos(0); setImg(START_IMG); }}>Reset</Btn>
      </div>
      <Insight color={C.green} title="The output is big exactly where the picture changes from empty to ink: the filter has found the edge.">
        Top-left window: 9 + 9 + 9 = 27. Two steps right, the window sees only ink: −27 + 27 = 0. A 5 × 5 picture and a 3 × 3 window fit
        5 − 3 + 1 = 3 positions each way. And nobody hand-designs filters in a real network: they are weights, so <b>training finds them</b>,
        with the same loss and gradient descent as Lesson 1.4.
      </Insight>
    </div>
  );
}

// ── Section 3: Count the work — few knobs, lots of multiply-adds ──
const CONV_PRESETS = {
  conv1: { label: "Conv 1 (MNIST)", n: 28, cin: 1, cout: 32 },
  conv2: { label: "Conv 2", n: 26, cin: 32, cout: 64 },
  photo: { label: "A colour photo", n: 224, cin: 3, cout: 64 },
};
function CountWidget() {
  const [n, setN] = useState(28);
  const [cin, setCin] = useState(1);
  const [cout, setCout] = useState(32);
  const pos = (n - 2) * (n - 2);
  const params = cout * cin * 9 + cout;
  const macs = pos * cout * cin * 9;
  const plainMacs = 784 * 128;
  return (
    <div>
      <Frame>
        A real layer has many filters, each looking for its own pattern, and each producing its own output picture, called a <b style={{ color: C.teal }}>channel</b>.
        Count the knobs and the multiply-adds (MACs) of one 3 × 3 conv layer on one image. Try the presets, then move the sliders.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {Object.entries(CONV_PRESETS).map(([k, p]) => <Btn key={k} ghost onClick={() => { setN(p.n); setCin(p.cin); setCout(p.cout); }}>{p.label}</Btn>)}
      </div>
      <Slider label={<>input picture: <b style={{ color: C.accent }}>{n} × {n}</b> → output positions {n - 2} × {n - 2}</>} value={n} min={5} max={224} onChange={setN} />
      <Slider label={<>input channels: <b style={{ color: C.accent }}>{cin}</b> (grey = 1, colour = 3)</>} value={cin} min={1} max={64} onChange={setCin} />
      <Slider label={<>filters (output channels): <b style={{ color: C.accent }}>{cout}</b></>} value={cout} min={1} max={128} onChange={setCout} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontFamily: "monospace", fontSize: 12.5, color: C.muted, margin: "10px 0" }}>
        MACs = output positions × output channels × (input channels × 3 × 3)<br />
        &nbsp;&nbsp;&nbsp;&nbsp; = {fmtIN(pos)} × {cout} × {cin * 9} = <b style={{ color: C.yellow }}>{fmtIN(macs)}</b>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="KNOBS (WEIGHTS + BIASES)" value={fmtIN(params)} color={C.teal} />
        <Stat label="MACS PER IMAGE" value={fmtIN(macs)} color={C.yellow} />
        <Stat label="PLAIN 784 → 128 LAYER" value={`${fmtIN(100480)} knobs · ${fmtIN(plainMacs)} MACs`} color={C.muted} />
      </div>
      <Insight color={C.purple} title="Conv 2 has one-fifth of the knobs of the plain layer, but does more than 100 times the arithmetic.">
        Every weight is reused at every position. That is the shape of most vision AI: a modest model, a mountain of multiply-adds.
      </Insight>
    </div>
  );
}

// ── Section 4: im2col — a convolution is a matrix multiply in disguise ──
function Im2colWidget() {
  const [rows, setRows] = useState(1);
  const img = START_IMG;
  const w = FILTERS.vertical.w;
  const windows = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const v = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) v.push(img[r + i][c + j]);
    windows.push(v);
  }
  const col = w.flat();
  const dot = (v) => v.reduce((s, x, i) => s + x * col[i], 0);
  return (
    <div>
      <Frame>
        Every window position is its own dot product. <b style={{ color: C.text }}>im2col</b> ("image to columns") copies each 3 × 3 window out into a
        row of 9 numbers. Stack the 9 windows of our 5 × 5 picture and you get a 9 × 9 table. Put the filter's 9 weights in a column, and
        <b style={{ color: C.accent }}> one matrix multiply</b> gives all 9 outputs at once. Unroll the windows one by one.
      </Frame>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap", fontFamily: "monospace", fontSize: 12 }}>
        <div>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>WINDOWS AS ROWS ({rows} × 9)</div>
          {windows.slice(0, rows).map((v, i) => (
            <div key={i} style={{ display: "flex", gap: 2, marginBottom: 2 }}>
              {v.map((x, j) => <span key={j} style={{ width: 22, textAlign: "center", background: C.card, border: `1px solid ${C.border}`, borderRadius: 3, color: C.teal }}>{x}</span>)}
            </div>
          ))}
        </div>
        <div style={{ color: C.muted, alignSelf: "center", fontSize: 18 }}>@</div>
        <div>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>FILTER (9 × 1)</div>
          {col.map((x, i) => <div key={i} style={{ width: 26, textAlign: "center", marginBottom: 2, background: C.card, border: `1px solid ${C.border}`, borderRadius: 3, color: x > 0 ? C.green : x < 0 ? C.red : C.muted }}>{x}</div>)}
        </div>
        <div style={{ color: C.muted, alignSelf: "center", fontSize: 18 }}>=</div>
        <div>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>OUTPUTS</div>
          {windows.slice(0, rows).map((v, i) => <div key={i} style={{ width: 34, textAlign: "center", marginBottom: 2, background: C.card, border: `1px solid ${C.border}`, borderRadius: 3, color: C.yellow }}>{dot(v)}</div>)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Btn onClick={() => setRows(Math.min(9, rows + 1))} disabled={rows === 9}>Unroll the next window →</Btn>
        <Btn ghost onClick={() => setRows(9)}>All 9</Btn>
        <Btn ghost onClick={() => setRows(1)}>Reset</Btn>
      </div>
      {rows === 9 && <div style={{ color: C.green, fontSize: 13, marginTop: 8 }}>27, 27, 0, 27, 27, 0, 27, 27, 0: exactly the 3 × 3 output from "Slide the Window", read row by row.</div>}
      <Insight title="With 32 filters the column becomes a (9 × 32) matrix, and the whole layer is one (676 × 9) @ (9 × 32) multiply per image.">
        The copying wastes some memory (each pixel is copied up to 9 times), but it turns a convolution into the operation GPUs are best at. So
        everything you will learn about matrix multiply in Steps 2 to 5 applies to CNNs too.
      </Insight>
    </div>
  );
}

// ── Section 5: Why GPUs love it — independent dot products ──
function GpuLoveWidget() {
  const [batch, setBatch] = useState(1);
  const per = 676 * 32;
  return (
    <div>
      <Frame>
        Conv 1 on one MNIST image: 676 window positions × 32 filters. Each of those dot products needs nothing from any other one. Make the batch bigger.
      </Frame>
      <Slider label={<>images in the batch: <b style={{ color: C.accent }}>{batch}</b></>} value={batch} min={1} max={64} onChange={setBatch} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="INDEPENDENT DOT PRODUCTS" value={fmtIN(per * batch)} color={C.green} />
        <Stat label="MACS (9 EACH)" value={fmtIN(per * batch * 9)} color={C.yellow} />
      </div>
      <div style={{ marginTop: 14, background: C.purple + "14", border: `1px solid ${C.purple}55`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
        <b style={{ color: C.purple }}>🤖 Arputham says:</b> 676 × 32 = 21,632 dot products that do not depend on each other, for one small image. A batch of 64:
        nearly 14 lakh. That is exactly the kind of work my thousands of workers were built for.
      </div>
      <Insight color={C.green} title="A network built from conv layers is a CNN: the usual choice for images, and for signals from sensors.">
        Few knobs, a mountain of independent multiply-adds, and a matrix multiply underneath. Next lesson: the other big pattern in modern AI, attention.
      </Insight>
      <LabCard part="C" title="A CNN reads MNIST, on the CPU and on a GPU"
        what="Train a small CNN (Conv 1 and Conv 2 from this lesson, a max-pool, then one layer to the 10 digits) for one epoch on all 60,000 MNIST images, on the CPU and then on the T4. This is an optional Side Trail: nothing later needs it."
        expect="about as many knobs as the Core Lab 3 network but higher accuracy after one epoch (about 97%), and the GPU finishing the epoch many times sooner." />
    </div>
  );
}
//@@SECTIONS
[["Why Not a Plain Layer?", "🧩 Why Not a Plain Layer? — the same stroke, a new place", "ShiftWidget"],
 ["Slide the Window", "🔍 Slide the Window — one small dot product, again and again", "SlideWidget"],
 ["Count the Work", "🧮 Count the Work — few knobs, lots of multiply-adds", "CountWidget"],
 ["im2col", "🧱 A Matrix Multiply in Disguise — im2col", "Im2colWidget"],
 ["Why GPUs Love It", "⚡ Why GPUs Love It — thousands of independent windows", "GpuLoveWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "A 3 × 3 filter slides over a 10 × 10 image. How many output positions are there?", options: ["100", "64", "81", "9"], answer: 1, explain: "10 − 3 + 1 = 8 positions each way, so 8 × 8 = 64." },
  { q: "Why does a conv layer need far fewer weights than a plain layer on the same image?", options: ["It skips half the pixels", "It uses the same small filter at every position", "It works only on grey images", "It has no biases"], answer: 1, explain: "A plain layer has its own weight for every pixel. A filter's 9 weights are reused at every window position." },
  { q: "A conv layer turns 3 input channels into 16 output channels with 3 × 3 filters, on 30 × 30 output positions. How many MACs is that?", options: ["14,400", "1,29,600", "3,88,800", "43,200"], answer: 2, explain: "900 positions × 16 channels × (3 × 9) = 900 × 16 × 27 = 3,88,800." },
  { q: "What does im2col do, and why do GPUs like it?", options: ["It shrinks the image so it fits in memory", "It copies every window into a row, so the whole convolution becomes one matrix multiply", "It removes the filters", "It converts the image to colour"], answer: 1, explain: "Each window becomes a row; the filters become columns; one big matrix multiply gives every output. GPUs are built for exactly that." },
];
const RESULT = {
  perfect: "Perfect! You can see a convolution as many small dot products, and as one big matrix multiply.",
  good: "Good. Replay 'Slide the Window' and count the 9 products yourself.",
  low: "Revisit 'Slide the Window': one window position = one neuron-style dot product.",
  done: "Lesson 1.6 Complete!",
  body: "You can explain why a filter beats a plain layer on pictures, compute a convolution by hand, count a conv layer's knobs and MACs, and turn it into a matrix multiply with im2col.",
  next: "Next up: Lesson 1.7 — Attention: Tokens Looking at Tokens.",
  teaser: "\"Bank\": the side of a river, or a place for money? Watch every word score every other word, and see why long chats cost so much.",
};
//@@WORDS
const UNIT_WORDS = [
  ["MAC", "Multiply-Accumulate", "Multiply, then add to a running total. One 3 × 3 window needs 9 of them.", "from Lesson 1.3"],
  ["CNN", "Convolutional Neural Network", "A network whose early layers are convolutions. The usual choice for images.", "new here"],
  ["im2col", "image to columns", "Copying every window into a row of a matrix, so a convolution becomes one matrix multiply.", "new here"],
];
