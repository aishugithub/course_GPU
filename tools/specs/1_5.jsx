//@@META
{"unit": "1.5", "module": 1, "title": "Layers = Matrix Multiplication", "icon": "🧱", "lab": "CoreLab03_Train_a_Real_Network.ipynb", "labNo": "Core Lab 3"}
//@@WIDGETS

// ── Section 1: Need — one neuron gives one cut-off; a B grade needs two ──
// Marks of 17 students in Nila's class. A B grade means marks from 60 to 75.
const MARKS = [35, 41, 46, 50, 54, 58, 62, 64, 66, 68, 70, 72, 78, 82, 86, 91, 96];
const IS_B = (m) => (m >= 60 && m <= 75 ? 1 : 0);
const MX = (m) => 20 + (m - 30) * 7.4;                               // mark → x pixel (30…100)
function MarksLine({ yes, marks = [], height = 92 }) {
  // a number line of marks: dots = students (green got a B, orange did not), shaded = where the network says B
  const spans = [];
  let start = null;
  for (let m = 30; m <= 100.001; m += 0.25) {
    const on = yes(m);
    if (on && start === null) start = m;
    if (!on && start !== null) { spans.push([start, m]); start = null; }
  }
  if (start !== null) spans.push([start, 100]);
  return (
    <svg viewBox={`0 0 560 ${height}`} style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
      {spans.map(([a, b], i) => <rect key={i} x={MX(a)} y="8" width={MX(b) - MX(a)} height="48" fill={C.green + "22"} />)}
      <line x1={MX(30)} y1="50" x2={MX(100)} y2="50" stroke={C.border} />
      {[30, 40, 50, 60, 75, 90, 100].map((m) => <g key={m}><line x1={MX(m)} y1="46" x2={MX(m)} y2="54" stroke={C.muted} /><text x={MX(m)} y="68" fill={C.muted} fontSize="10" textAnchor="middle">{m}</text></g>)}
      {MARKS.map((m) => {
        const ok = (yes(m) ? 1 : 0) === IS_B(m);
        return <g key={m}><circle cx={MX(m)} cy="34" r="6" fill={IS_B(m) ? C.green : C.orange} />{!ok && <circle cx={MX(m)} cy="34" r="9.5" fill="none" stroke={C.red} strokeWidth="2" />}</g>;
      })}
      {marks.map(([m, label, col], i) => <g key={i}><line x1={MX(m)} y1="6" x2={MX(m)} y2="58" stroke={col} strokeWidth="2.5" strokeDasharray="5 3" /><text x={MX(m)} y={80 + (i % 2) * 11} fill={col} fontSize="10.5" textAnchor="middle">{label}</text></g>)}
    </svg>
  );
}
function GradeNeedWidget() {
  const [sign, setSign] = useState(1);
  const [cut, setCut] = useState(60);
  const [strip, setStrip] = useState(false);
  const w = sign, b = -sign * cut;
  const yes = (m) => w * m + b >= 0;
  const right = MARKS.filter((m) => (yes(m) ? 1 : 0) === IS_B(m)).length;
  return (
    <div>
      <Frame>
        Back to Nila's class, with a new question: <b style={{ color: C.text }}>who got a B?</b> In this college a B means marks from
        <b style={{ color: C.green }}> 60 to 75</b>. A neuron reading a student's marks m computes <code style={{ color: C.yellow }}>z = w × m + b</code> and
        says YES when z ≥ 0. From Lesson 1.3 you know two things: it switches at one cut-off (−b ÷ w), and the <b style={{ color: C.text }}>sign</b> of w
        decides which side means YES. Make it say YES only for the green dots (the B students).
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        <Btn ghost={sign !== 1} onClick={() => setSign(1)}>w = +1: YES for higher marks</Btn>
        <Btn ghost={sign !== -1} onClick={() => setSign(-1)}>w = −1: YES for lower marks</Btn>
      </div>
      <Slider label={<>cut-off = <b style={{ color: C.purple }}>{cut} marks</b> &nbsp;(so b = {b})</>} value={cut} min={30} max={100} step={0.5} onChange={setCut} color={C.purple} />
      <MarksLine yes={yes} marks={[[cut, `cut-off ${cut}`, C.purple]]} />
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="NEURON" value={`z = ${w === 1 ? "" : "−"}m ${b < 0 ? "−" : "+"} ${Math.abs(b)}`} color={C.yellow} />
        <Stat label="CORRECT" value={`${right} / 17`} color={right === 17 ? C.green : C.yellow} />
      </div>
      <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8 }}>Red ring = wrong. Try every setting: the best one neuron can do is 12 / 17, hardly better than saying NO to everyone (11 / 17). It can cut off the low marks OR the high marks, never both.</div>
      <Insight color={C.purple} title="One neuron = one cut-off. A B grade has two edges: 60 at the bottom and 75 at the top.">
        No choice of w and b fixes that, because a single neuron only ever has one switching point. That is the only reason a second
        neuron appears. Next section: split the question into two smaller ones.
      </Insight>
      <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: C.teal + "12", border: `1px dashed ${C.teal}88`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        <b style={{ color: C.teal }}>Same idea, different world:</b> a room feels comfortable between 20 °C and 28 °C. Too cold and too hot are two
        edges, so "is the room comfortable?" also needs two cut-offs, two neurons and a third to combine them, exactly like the B grade.
      </div>
      <div style={{ marginTop: 14 }}>
        <Btn ghost onClick={() => setStrip((v) => !v)}>{strip ? "▲ Hide the 2-D version" : "▼ The same problem with two inputs: hours and attendance"}</Btn>
        {strip && <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: `1px dashed ${C.border}` }}><StripWidget /></div>}
      </div>
    </div>
  );
}

// ── Section 2: A layer of neurons — split the question, then combine ──
const stepFn = (z) => (z >= 0 ? 1 : 0);
function GradeLayerWidget() {
  const [m, setM] = useState(68);
  const [act, setAct] = useState(true);
  const f = act ? stepFn : (z) => z;
  const run = (mm) => { const z1 = mm - 60, z2 = -mm + 75, a1 = f(z1), a2 = f(z2), z3 = a1 + a2 - 1.5; return { z1, z2, a1, a2, z3, yes: z3 >= 0 }; };
  const r = run(m);
  const box = (x, y, title, line, val, col) => (
    <g>
      <rect x={x} y={y} width="150" height="58" rx="9" fill={col + "1A"} stroke={col} />
      <text x={x + 75} y={y + 17} fill={col} fontSize="11.5" fontWeight="700" textAnchor="middle">{title}</text>
      <text x={x + 75} y={y + 34} fill={C.text} fontSize="11" textAnchor="middle" fontFamily="monospace">{line}</text>
      <text x={x + 75} y={y + 50} fill={C.yellow} fontSize="11" textAnchor="middle" fontFamily="monospace">{val}</text>
    </g>
  );
  const n = (v) => (Number.isInteger(v) ? v : v.toFixed(1));
  return (
    <div>
      <Frame>
        Split the big question into two small ones that a single neuron <b style={{ color: C.text }}>can</b> answer: neuron 1 asks
        <b style={{ color: C.accent }}> "at least 60?"</b> (cut-off 60, YES for higher marks), neuron 2 asks <b style={{ color: C.teal }}>"75 or below?"</b>
        (cut-off 75, YES for lower marks, so its weight is −1). Both read the <b style={{ color: C.text }}>same</b> marks with their own
        weight and bias: together they are a <b style={{ color: C.text }}>layer</b>. Neuron 3 reads their two answers and asks
        <b style={{ color: C.purple }}> "both yes?"</b> Slide the marks.
      </Frame>
      <Slider label={<>marks m = <b style={{ color: C.yellow }}>{m}</b></>} value={m} min={30} max={100} step={1} onChange={setM} color={C.yellow} />
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        <Btn ghost={!act} color={C.green} onClick={() => setAct(true)}>With step activation</Btn>
        <Btn ghost={act} color={C.red} onClick={() => setAct(false)}>Remove the activation</Btn>
      </div>
      <svg viewBox="0 0 620 200" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <rect x="8" y="78" width="70" height="40" rx="8" fill={C.yellow + "22"} stroke={C.yellow} />
        <text x="43" y="103" fill={C.text} fontSize="13" textAnchor="middle">m = {m}</text>
        <line x1="78" y1="98" x2="150" y2="45" stroke={C.muted} /><line x1="78" y1="98" x2="150" y2="150" stroke={C.muted} />
        {box(150, 16, "1 · at least 60?", "z₁ = m − 60", `z₁ = ${n(r.z1)} → a₁ = ${n(r.a1)}`, C.accent)}
        {box(150, 122, "2 · 75 or below?", "z₂ = −m + 75", `z₂ = ${n(r.z2)} → a₂ = ${n(r.a2)}`, C.teal)}
        <line x1="300" y1="45" x2="370" y2="98" stroke={C.muted} /><line x1="300" y1="150" x2="370" y2="98" stroke={C.muted} />
        {box(370, 69, "3 · both yes?", "z₃ = a₁ + a₂ − 1.5", `z₃ = ${n(r.z3)}`, C.purple)}
        <line x1="520" y1="98" x2="535" y2="98" stroke={C.muted} />
        <text x="578" y="94" fill={r.yes ? C.green : C.red} fontSize="12.5" fontWeight="700" textAnchor="middle">{r.yes ? "B" : "NOT B"}</text>
        <text x="578" y="110" fill={r.yes ? C.green : C.red} fontSize="12.5" fontWeight="700" textAnchor="middle">{r.yes ? "✓" : "✗"}</text>
        <text x="225" y="196" fill={C.muted} fontSize="10" textAnchor="middle">layer 1: same input, own weight + bias</text>
        <text x="445" y="150" fill={C.muted} fontSize="10" textAnchor="middle">layer 2: reads the answers</text>
      </svg>
      <div style={{ marginTop: 10 }}>
        <MarksLine yes={(mm) => run(mm).yes} marks={act ? [[60, "neuron 1: 60", C.accent], [75, "neuron 2: 75", C.teal]] : []} />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, fontFamily: "monospace", marginTop: 10 }}>
        <thead><tr style={{ color: C.muted, textAlign: "right" }}><th style={{ textAlign: "left", padding: 4 }}>marks</th><th>z₁</th><th>a₁</th><th>z₂</th><th>a₂</th><th>z₃ = a₁ + a₂ − 1.5</th><th>answer</th></tr></thead>
        <tbody>
          {[52, 68, 81].map((mm) => { const q = run(mm); return (
            <tr key={mm} style={{ borderTop: `1px solid ${C.border}`, textAlign: "right", color: C.text }}>
              <td style={{ textAlign: "left", padding: 4 }}>{mm}</td><td>{n(q.z1)}</td><td>{n(q.a1)}</td><td>{n(q.z2)}</td><td>{n(q.a2)}</td><td style={{ color: C.purple }}>{n(q.z3)}</td>
              <td style={{ color: q.yes ? C.green : C.red, fontWeight: 700 }}>{q.yes ? "B" : "NOT B"}</td>
            </tr>); })}
        </tbody>
      </table>
      {act ? (
        <Insight color={C.green} title="Two small questions, then one combiner: the network now has TWO cut-offs.">
          52 marks: only "75 or below" says yes → 1 − 1.5 &lt; 0 → NOT B. 68: both say yes → 2 − 1.5 ≥ 0 → B. 81: only "at least 60" →
          NOT B. Notice that neurons 1 and 2 never wait for each other: they could be computed at the same moment. Hold on to that
          thought; it is the GPU's whole idea.
        </Insight>
      ) : (
        <Insight color={C.red} title="Without the activation, z₃ is 13.5 for EVERY student. The marks have cancelled out.">
          z₃ = (m − 60) + (75 − m) − 1.5 = <b>13.5</b>. The +m from neuron 1 and the −m from neuron 2 cancel, so the network gives a B
          to a student with 35 marks and to one with 96. Any mix of the two raw sums, a·z₁ + b·z₂ + c, works out to (a − b)·m + a constant:
          one weight and one bias, which is just one neuron again, with at most one cut-off. The activation sits between the layers to
          stop this collapse: it turns each z into a firm answer that can't be added back into a straight line.
        </Insight>
      )}
    </div>
  );
}

// ── Section 3: How many neurons? — more neurons, more edges; a second layer makes islands and holes ──
// A first-layer neuron (w1, w2, b) says YES where b − (w1·x + w2·y) ≥ 0: the inner side of one straight line.
function polygonNeurons(n, r, cx = 0, cy = 0, turn = 0) {
  const angs = n === 1 ? [turn] : Array.from({ length: n }, (_, k) => turn + (2 * Math.PI * k) / n);
  return angs.map((a) => [Math.cos(a), Math.sin(a), r + Math.cos(a) * cx + Math.sin(a) * cy]);
}
const yesOf = (nr, x, y) => (nr[0] * -1 * x + nr[1] * -1 * y + nr[2] >= 0 ? 1 : 0);
const insideAll = (neurons, x, y) => (neurons.reduce((s, nr) => s + yesOf(nr, x, y), 0) - (neurons.length - 0.5) >= 0 ? 1 : 0);
const shapeFor = (n) => (n === 2 ? [[1, 0, 0.45], [-1, 0, 0.45]] : polygonNeurons(n, n === 3 ? 0.5 : n === 4 ? 0.6 : 0.7, 0, 0, n === 1 || n === 3 ? Math.PI / 2 : 0));
const TRI = polygonNeurons(3, 0.32, -0.5, 0.35, Math.PI / 2), SQR = polygonNeurons(4, 0.3, 0.5, -0.4);
const BIG = polygonNeurons(8, 0.95, 0, 0, Math.PI / 8), SMALL = polygonNeurons(8, 0.45, 0, 0, Math.PI / 8);
const CELLS = 60;
function HowManyWidget() {
  const [mode, setMode] = useState("edges");
  const [n, setN] = useState(3);
  const S = 300, P = (v) => ((v + 1.2) / 2.4) * S;
  const cell = S / CELLS;
  const neurons = mode === "edges" ? shapeFor(n) : mode === "islands" ? [...TRI, ...SQR] : [...BIG, ...SMALL];
  const yes = (x, y) => {
    if (mode === "edges") return insideAll(neurons, x, y);
    if (mode === "islands") return insideAll(TRI, x, y) + insideAll(SQR, x, y) - 0.5 >= 0 ? 1 : 0;   // OR: either shape
    return insideAll(BIG, x, y) - insideAll(SMALL, x, y) - 0.5 >= 0 ? 1 : 0;                         // big AND NOT small
  };
  const cells = [];
  for (let i = 0; i < CELLS; i++) for (let j = 0; j < CELLS; j++) {
    const x = -1.2 + (i + 0.5) * (2.4 / CELLS), y = 1.2 - (j + 0.5) * (2.4 / CELLS);
    if (yes(x, y)) cells.push(<rect key={i + "-" + j} x={i * cell} y={j * cell} width={cell + 0.3} height={cell + 0.3} fill={C.green} opacity="0.45" />);
  }
  const lineOf = ([w1, w2, b], i, col) => {
    const x0 = w1 * b, y0 = w2 * b;                              // the point on the line closest to the centre
    return <line key={i} x1={P(x0 - w2 * 3)} y1={P(-(y0 + w1 * 3))} x2={P(x0 + w2 * 3)} y2={P(-(y0 - w1 * 3))} stroke={col} strokeWidth="1.6" />;
  };
  const firstLayer = mode === "edges" ? n : mode === "islands" ? 7 : 16;
  const info = {
    edges: [`${n} first-layer neuron${n > 1 ? "s" : ""}, each drawing one line, and a combiner that says YES only inside ALL of them: z = a₁ + … + a${n === 1 ? "₁" : "ₙ"} − ${n - 0.5}.`,
      { 1: "One line: half the map.", 2: "Two lines: a strip. That is the B band from the last section.", 3: "Three lines: a triangle.", 4: "Four lines: a square.", 5: "Five lines: a pentagon.", 6: "Six lines: a hexagon.", 7: "Seven lines: getting round.", 8: "Eight lines: almost a circle." }[n]],
    islands: ["Layer 1: 3 neurons draw a triangle and 4 draw a square. Layer 2: one combiner for each shape. Layer 3: a final neuron that says YES if EITHER shape does: z = triangle + square − 0.5.",
      "Two separate islands. No single shape made from one layer can do this: it is the first real reason for more LAYERS."],
    ring: ["Layer 1: 8 neurons draw a big octagon and 8 draw a small one. Layer 2: one combiner for each. Layer 3: z = big − small − 0.5. The weight −1 on 'small' means NOT, just like the −1 weight of the '75 or below?' neuron.",
      "Inside the big shape AND NOT inside the small one: a ring with a hole."],
  }[mode];
  return (
    <div>
      <Frame>
        Two neurons gave the B band two edges. What do more neurons give? Each first-layer neuron draws <b style={{ color: C.text }}>one straight
        line</b> on a chart of two inputs; a combiner in the next layer says YES only where all of them say YES. Drag the slider, then try the
        two buttons that add a third layer.
      </Frame>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        <Btn ghost={mode !== "edges"} onClick={() => setMode("edges")}>One layer: more edges</Btn>
        <Btn ghost={mode !== "islands"} onClick={() => setMode("islands")} color={C.purple}>Another layer: islands</Btn>
        <Btn ghost={mode !== "ring"} onClick={() => setMode("ring")} color={C.purple}>Another layer: a ring</Btn>
      </div>
      {mode === "edges" && <Slider label={<>first-layer neurons = <b style={{ color: C.accent }}>{n}</b></>} value={n} min={1} max={8} onChange={setN} />}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${S} ${S}`} style={{ width: 300, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
          {cells}
          {neurons.map((nr, i) => lineOf(nr, i, mode === "islands" && i >= 3 ? C.orange : C.accent))}
        </svg>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{info[0]}</div>
          <div style={{ color: C.green, fontSize: 13.5, fontWeight: 700, lineHeight: 1.6, marginTop: 8 }}>{info[1]}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <Stat label="FIRST-LAYER NEURONS" value={firstLayer} color={C.accent} />
            <Stat label="LAYERS" value={mode === "edges" ? 2 : 3} color={C.purple} />
          </div>
        </div>
      </div>
      <Insight color={C.green} title="More neurons give more edges. More layers combine whole shapes: islands, holes, anything.">
        Every shaded cell above is worked out by real neurons: multiply, add, step, again and again. Real networks use smooth bends (ReLU,
        sigmoid) and let training choose the lines, but the idea is the same. Harder shapes need more neurons, and every extra neuron
        is more multiply-adds.
      </Insight>
    </div>
  );
}

// ── Section 4: Who picks the questions? — training finds the cut-offs ──
// x = (marks − 65) ÷ 10 keeps the numbers near 0, which helps training. Cut-off in marks = 65 + 10 × (−b ÷ w).
const TRAIN_X = MARKS.map((m) => (m - 65) / 10);
const TRAIN_Y = MARKS.map(IS_B);
const sig = (z) => 1 / (1 + Math.exp(-z));
const START = { W1: [0.8, -0.6], b1: [-0.5, 0.3], W2: [0.5, 0.4], b2: -0.3, steps: 0 };
function trainSteps(p, k, lr = 1.0) {
  let { W1, b1, W2, b2 } = p; W1 = [...W1]; b1 = [...b1]; W2 = [...W2];
  const n = TRAIN_X.length;
  for (let s = 0; s < k; s++) {
    const gW1 = [0, 0], gb1 = [0, 0], gW2 = [0, 0]; let gb2 = 0;
    for (let i = 0; i < n; i++) {
      const x = TRAIN_X[i], h = [0, 1].map((j) => sig(W1[j] * x + b1[j]));
      const o = sig(W2[0] * h[0] + W2[1] * h[1] + b2);
      const d = (o - TRAIN_Y[i]) / n;                  // slope of the loss at the output (cross-entropy + sigmoid)
      gb2 += d;
      for (let j = 0; j < 2; j++) { gW2[j] += d * h[j]; const dh = d * W2[j] * h[j] * (1 - h[j]); gW1[j] += dh * x; gb1[j] += dh; }
    }
    for (let j = 0; j < 2; j++) { W1[j] -= lr * gW1[j]; b1[j] -= lr * gb1[j]; W2[j] -= lr * gW2[j]; }
    b2 -= lr * gb2;
  }
  return { W1, b1, W2, b2, steps: p.steps + k };
}
function TrainWidget() {
  const [p, setP] = useState(START);
  const outs = TRAIN_X.map((x) => { const h = [0, 1].map((j) => sig(p.W1[j] * x + p.b1[j])); return sig(p.W2[0] * h[0] + p.W2[1] * h[1] + p.b2); });
  const loss = -outs.reduce((s, o, i) => s + (TRAIN_Y[i] ? Math.log(o) : Math.log(1 - o)), 0) / outs.length;
  const right = outs.filter((o, i) => (o >= 0.5 ? 1 : 0) === TRAIN_Y[i]).length;
  const cuts = [0, 1].map((j) => 65 + 10 * (-p.b1[j] / p.W1[j]));
  const outAt = (m) => { const x = (m - 65) / 10, h = [0, 1].map((j) => sig(p.W1[j] * x + p.b1[j])); return sig(p.W2[0] * h[0] + p.W2[1] * h[1] + p.b2) >= 0.5; };
  return (
    <div>
      <Frame>
        In the last section <b style={{ color: C.text }}>we</b> chose the questions (60 and 75) so you could see how it works. A real network is
        different: the designer only decides <b style={{ color: C.text }}>how many</b> neurons (here, 2 in the hidden layer). Their weights and
        biases start as random-looking numbers, so at first they ask meaningless questions. Then gradient descent (Lesson 1.4) nudges every
        weight and bias, using the 17 students' marks and grades. Press Train and watch each hidden neuron's cut-off, −b ÷ w, move.
      </Frame>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <Btn onClick={() => setP((q) => trainSteps(q, 20))}>Train 20 steps ▶</Btn>
        <Btn onClick={() => setP((q) => trainSteps(q, 200))} color={C.green}>Train 200 steps ▶▶</Btn>
        <Btn ghost onClick={() => setP(START)}>↺ Back to the random start</Btn>
      </div>
      <MarksLine yes={outAt} marks={[[Math.max(30, Math.min(100, cuts[0])), `neuron 1: ${cuts[0].toFixed(1)}`, C.accent], [Math.max(30, Math.min(100, cuts[1])), `neuron 2: ${cuts[1].toFixed(1)}`, C.teal]]} height={100} />
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="TRAINING STEPS" value={p.steps} color={C.purple} />
        <Stat label="LOSS" value={loss.toFixed(3)} color={C.yellow} />
        <Stat label="CORRECT" value={`${right} / 17`} color={right === 17 ? C.green : C.yellow} />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        {[0, 1].map((j) => (
          <Stat key={j} label={`HIDDEN NEURON ${j + 1}: CUT-OFF`} value={`${cuts[j].toFixed(1)} marks, YES for ${p.W1[j] > 0 ? "higher" : "lower"} marks`} color={j ? C.teal : C.accent} />
        ))}
      </div>
      <div style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>
        (The marks go in as x = (marks − 65) ÷ 10, so the numbers stay near 0, which helps training. That is why the cut-off in marks is 65 + 10 × (−b ÷ w).)
      </div>
      <Insight color={C.purple} title="Nobody told the neurons '60' and '75'. Training found the useful questions by itself.">
        Both start near 70 marks, asking nothing useful. After a couple of hundred steps one sits at about 60 and the other at about 75.
        A neuron may ask its question the other way round ("above 75?") and let the last neuron subtract it; the cut-offs are what
        matter. That is what "the machine learns" really means: many small questions, which the network finds for itself.
      </Insight>
      <LabCard part="A" title="Build the B-grade network, break it, then let training find the cut-offs"
        what="Code the three grade neurons by hand and test 52, 68 and 81 marks. Remove the activation and print z₃ for several marks. Then train 2 hidden neurons in PyTorch from a random start and print each one's learned cut-off."
        expect="NOT B, B, NOT B; then z₃ = 13.5 every time without the activation; then learned cut-offs close to 60 and 75." />
    </div>
  );
}

// ── The 2-D version of the same problem: hours and attendance ──
// 8 of Nila's classmates, as (hours ÷ 6, (attendance − 40) ÷ 60, got a B?). B students sit in a strip between two parallel lines.
const PTS = [
  [0.15, 0.2, 0], [0.25, 0.12, 0], [0.85, 0.82, 0], [0.75, 0.9, 0],
  [0.15, 0.82, 1], [0.25, 0.9, 1], [0.85, 0.15, 1], [0.78, 0.25, 1],
];
function StripWidget() {
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
        Now two inputs: daily study hours (along the bottom) and attendance (up the side) for 8 of Nila's classmates. The B students 🟢
        are in the middle: few hours but full attendance, or many hours but poor attendance. The others 🟠 got a C (little of both) or an A
        (lots of both). With two inputs, one neuron's cut-off becomes <b style={{ color: C.text }}>one straight line</b> across the chart. Turn and
        slide the line: can you put all the green on one side?
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
          <text x={P(1) - 4} y={P(1) + 6} fill={C.muted} fontSize="10" textAnchor="end">hours →</text>
          <text x={P(0) + 4} y={P(0) + 12} fill={C.muted} fontSize="10">↑ attendance</text>
          <text x={P(0.2)} y={P(1 - 0.03)} fill={C.orange} fontSize="10" textAnchor="middle">C</text>
          <text x={P(0.8)} y={P(1 - 0.99)} fill={C.orange} fontSize="10" textAnchor="middle">A</text>
          {PTS.map(([x, y, c], i) => {
            const ok = pred(x, y) === c;
            return <g key={i}><circle cx={P(x)} cy={P(1 - y)} r="9" fill={c ? C.green : C.orange} />{!ok && <circle cx={P(x)} cy={P(1 - y)} r="13" fill="none" stroke={C.red} strokeWidth="2" />}</g>;
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
          <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8 }}>{two ? "Two neurons each draw a line; a third neuron combines them: 'between the lines = B'." : "Red ring = wrong side. The best one line can do is 6 / 8."}</div>
        </div>
      </div>
      {two && (
        <Insight color={C.purple} title="The same B-grade idea, one dimension up.">
          On the marks line, a B was a band between two cut-offs. On this chart it is a strip between two parallel lines: two neurons
          draw the lines, a third combines them. Stack enough layers and a network can carve out far stranger shapes, enough to tell
          cats from dogs. That's why it's called <b>deep</b> learning.
        </Insight>
      )}
    </div>
  );
}

// ── Section 4: A layer = a matrix ──
const W = [[2, -1, 0.5], [1, 1, 1], [-1, 3, 0], [0.5, 0, -2]];
const XV = [1, 2, 3];
function LayerWidget() {
  const [k, setK] = useState(-1);
  const out = W.map((row) => row.reduce((s, w, j) => s + w * XV[j], 0));
  return (
    <div>
      <Frame>
        A <b style={{ color: C.text }}>layer</b> is several neurons all reading the same inputs. Write each neuron's weights as one row, and the
        rows form a grid of numbers: a <b style={{ color: C.accent }}>matrix</b> W. The B-grade layer is the smallest example: two neurons, one input.
      </Frame>
      <div style={{ fontFamily: "monospace", fontSize: 12.5, color: C.text, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", marginBottom: 14, lineHeight: 1.8 }}>
        W = [[ 1], [−1]] &nbsp;&nbsp; b = [−60, 75] &nbsp;&nbsp; x = [m]<br />
        W @ x + b = [<span style={{ color: C.accent }}>1·m − 60</span>, <span style={{ color: C.teal }}>−1·m + 75</span>] = [z₁, z₂] &nbsp;
        <span style={{ color: C.muted }}>← both neurons in one multiply</span>
      </div>
      <Frame>
        A bigger layer works the same way. Here 4 neurons read 3 inputs, so W has 4 rows and 3 columns. Press Step to compute one
        neuron (one row) at a time.
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
        <Code color={C.orange} title="✍️ BY HAND: a loop of dot products">{`for i in range(4):      # each neuron (row)
    out[i] = b[i]       # start at its bias
    for j in range(3):  # each input
        # add weight × input: 1 MAC
        out[i] += W[i][j] * x[j]`}</Code>
        <Code color={C.accent} title="🧮 AS MATHS / NUMPY">{`# all neurons at once: W × x, plus biases
out = W @ x + b

# W @ x is "matrix times vector"`}</Code>
      </div>
      <Insight title="A whole layer is one matrix multiplication.">
        Every row of W is a neuron; every output number is one row "dotted" with the input. Four neurons × three inputs = 12 MACs.
        This is the operation the rest of the course is about.
      </Insight>
    </div>
  );
}

// ── Section 5: Stack layers — count parameters and MACs ──
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

// ── Section 6: A batch = matrix × matrix, every cell independent ──
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
      <Code color={C.accent} title="🧮 THE WHOLE LAYER FOR A WHOLE BATCH">{`# the whole layer, for all 64 images at once (W.T = W turned on its side)
# shapes: X (64, 784) · W (128, 784) → Y (64, 128)
Y = X @ W.T + b`}</Code>
      <Insight color={C.green} title="Every cell of a matrix multiply can be computed independently, so they can all be done at the same time.">
        A machine with one worker fills the grid cell by cell. A machine with thousands of workers fills it almost at once. Keep that
        thought: it is exactly the idea behind the GPU.
      </Insight>
      <LabCard part="A" title="A layer is a matrix multiply: prove it"
        what="Make a random batch X and weights W in NumPy, compute X @ W.T + b, and check it matches PyTorch's nn.Linear with the same weights. Then count the MACs."
        expect="the two outputs match (difference ≈ 0) and shape (64, 128)." />
    </div>
  );
}
//@@SECTIONS
[["One Cut-off Isn't Enough", "🎓 One Cut-off Isn't Enough — who got a B?", "GradeNeedWidget"],
 ["A Layer of Neurons", "🧠 A Layer of Neurons — split the question, then combine", "GradeLayerWidget"],
 ["How Many Neurons?", "🔷 How Many Neurons? — more edges, then islands and holes", "HowManyWidget"],
 ["Who Picks the Questions?", "🎯 Who Picks the Questions? — training finds the cut-offs", "TrainWidget"],
 ["A Layer = A Matrix", "🧱 A Layer = A Matrix — many neurons, one multiply", "LayerWidget"],
 ["Stack the Layers", "🏗️ Stack the Layers — count the knobs and the work", "StackWidget"],
 ["Batches", "⚡ Batches — matrix × matrix, every cell independent", "BatchWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "Why does 'did this student get a B (60 to 75 marks)?' need more than one neuron?", options: ["One neuron can't read marks", "One neuron gives only one cut-off, and a B band has two edges", "The learning rate would be too big", "Marks need a matrix"], answer: 1, explain: "A neuron switches at one point, −b ÷ w. A B has two edges, 60 at the bottom and 75 at the top, so it needs two neurons plus one to combine them." },
  { q: "Neuron 1 gives z₁ = m − 60 and neuron 2 gives z₂ = 75 − m. With NO activation, neuron 3 computes z₁ + z₂ − 1.5. What is it for m = 40 and for m = 90?", options: ["−21.5 and 28.5", "13.5 and 13.5", "0 and 1", "−20 and 15"], answer: 1, explain: "(m − 60) + (75 − m) − 1.5 = 13.5 for every m: the marks cancel out. Without the activation the two neurons collapse into one, and the network gives everyone a B." },
  { q: "W = [[1, 2], [3, 4]] and x = [1, 1]. What is W @ x?", options: ["[3, 7]", "[4, 6]", "[1, 2]", "[10]"], answer: 0, explain: "Row 1 · x = 1 + 2 = 3; Row 2 · x = 3 + 4 = 7. Each output is one row dotted with x." },
  { q: "What makes a batch matrix multiply perfect for doing many things at once?", options: ["It uses only integers", "Each output cell is an independent dot product", "It needs no memory", "It is always small"], answer: 1, explain: "No output cell depends on another, so thousands of workers could each compute one cell simultaneously. That's the GPU's whole idea." },
];
const RESULT = {
  perfect: "Perfect! You see neural networks the way hardware does: as matrix multiplies.",
  good: "Good. Replay 'A Layer = A Matrix' and step through the rows again.",
  low: "Revisit 'A Layer = A Matrix': one row = one neuron is the key picture.",
  done: "Lesson 1.5 Complete!",
  body: "You can explain why a second neuron is needed, why the activation must sit between layers, how training picks each neuron's question, and write a layer as W @ x + b.",
  next: "Next up: Lesson 1.6 — Convolution: Looking at Pictures in Small Windows.",
  teaser: "A photo is too big for one ordinary layer. Slide a small window across it instead: the same small dot product, thousands of times.",
};
//@@WORDS
const UNIT_WORDS = [
  ["MAC", "Multiply-Accumulate", "Multiply, then add to a running total. A layer needs (inputs × neurons) of them.", "from Lesson 1.3"],
  ["W @ x", "matrix multiplication", "Python's @ operator multiplies matrices: each output = one row of W dotted with x.", "new here"],
  ["MNIST", "the handwritten-digit dataset", "28 × 28 grey images, so 784 inputs.", "from Lesson 1.2"],
];
