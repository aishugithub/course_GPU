//@@META
{"unit": "1.3", "module": 1, "title": "The Neuron", "icon": "⚡", "lab": "Lab01_AI_Basics.ipynb", "labNo": 1}
//@@WIDGETS

const PEOPLE = [
  { n: "KAVYA", h: 4, a: 40, p: 0 }, { n: "RAVI", h: 2, a: 95, p: 1 }, { n: "SURESH", h: 5, a: 90, p: 1 },
  { n: "GEETHA", h: 1, a: 60, p: 0 }, { n: "IMRAN", h: 3.5, a: 85, p: 1 }, { n: "POOJA", h: 2.5, a: 50, p: 0 },
];

// ── Section 1: Need — one input is not enough ──
function NeedWidget() {
  const [both, setBoth] = useState(false);
  const predict = (s) => (both ? (s.h * 1 + s.a * 0.05 - 6.5 >= 0 ? 1 : 0) : (s.h >= 3 ? 1 : 0));
  const right = PEOPLE.filter((s) => predict(s) === s.p).length;
  return (
    <div>
      <Frame>
        In Unit 1.1 the machine learned a rule from <b style={{ color: C.text }}>one</b> input, study hours. But results also depend on
        attendance. Look at KAVYA (4 hours, rarely in class) and RAVI (2 hours, almost never absent). Toggle the rule and watch who it gets wrong.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Btn ghost={both} onClick={() => setBoth(false)}>Rule uses hours only</Btn>
        <Btn ghost={!both} onClick={() => setBoth(true)} color={C.green}>Combine hours + attendance</Btn>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr style={{ color: C.muted, textAlign: "left" }}><th style={{ padding: 6 }}>Student</th><th>Hours / day</th><th>Attendance</th><th>Actual</th><th>Rule says</th></tr></thead>
        <tbody>
          {PEOPLE.map((s) => {
            const pr = predict(s), ok = pr === s.p;
            return (
              <tr key={s.n} style={{ borderTop: `1px solid ${C.border}`, background: ok ? "transparent" : C.red + "14" }}>
                <td style={{ padding: 6, color: C.text }}>{s.n}</td><td style={{ color: C.text }}>{s.h}</td><td style={{ color: C.text }}>{s.a}%</td>
                <td style={{ color: s.p ? C.green : C.red }}>{s.p ? "PASS" : "FAIL"}</td>
                <td style={{ color: ok ? C.green : C.red }}>{pr ? "PASS" : "FAIL"} {ok ? "✓" : "✗"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: 10, fontFamily: "monospace", fontSize: 12.5, color: both ? C.green : C.yellow }}>
        {both ? "score = 1.0 × hours + 0.05 × attendance − 6.5   →  PASS if score ≥ 0" : "PASS if hours ≥ 3"} &nbsp; ({right} / 6 right)
      </div>
      <Insight title="Real decisions weigh several inputs at once.">
        Multiply each input by how much it matters, add everything up, then decide. That small calculation has a name: a
        <b style={{ color: C.accent }}> neuron</b>.
      </Insight>
    </div>
  );
}

// ── Section 2: Anatomy — inputs, weights, bias, sum, activation ──
const PARTS = {
  x: { t: "Inputs (x)", c: C.teal, d: "The numbers going in: features such as hours, attendance, or 784 pixel values." },
  w: { t: "Weights (w)", c: C.accent, d: "One knob per input, saying how much that input matters. A big positive weight pushes towards YES; a negative weight pushes towards NO. Training sets these." },
  b: { t: "Bias (b)", c: C.purple, d: "A single extra number added at the end. It shifts how easily the neuron says YES, like a threshold." },
  sum: { t: "Weighted sum (z)", c: C.yellow, d: "z = w₁x₁ + w₂x₂ + w₃x₃ + b. Multiply each pair, then add. This is the only real arithmetic in a neuron." },
  act: { t: "Activation", c: C.green, d: "Turns z into the output. The simplest one says YES if z ≥ 0, otherwise NO. The next section shows better ones." },
};
function AnatomyWidget() {
  const [part, setPart] = useState("sum");
  const [x, setX] = useState([1, 1, 0]);
  const [w, setW] = useState([2, -4, 1.5]);
  const [b, setB] = useState(-1);
  const labels = ["☀️ Sunny?", "📚 Exam tomorrow?", "👫 Friends going?"];
  const z = x[0] * w[0] + x[1] * w[1] + x[2] * w[2] + b;
  const P = ({ k, x: cx, y, children, r = 0 }) => (
    <g onClick={() => setPart(k)} style={{ cursor: "pointer" }}>{children}</g>
  );
  return (
    <div>
      <Frame>
        Should you go to the IPL match tonight? A neuron decides. Toggle the inputs (1 = yes, 0 = no), change how much each one
        matters, and click any part of the diagram to learn its name.
      </Frame>
      <svg viewBox="0 0 620 220" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <P k="x"><rect x="10" y={30 + i * 60} width="120" height="34" rx="8" fill={C.teal + "22"} stroke={part === "x" ? C.teal : C.border} /><text x="70" y={52 + i * 60} fill={C.text} fontSize="12" textAnchor="middle">x{i + 1} = {x[i]}</text></P>
            <line x1="130" y1={47 + i * 60} x2="320" y2="110" stroke={w[i] >= 0 ? C.accent : C.red} strokeWidth={1 + Math.abs(w[i])} opacity="0.7" />
            <P k="w"><text x="142" y={38 + i * 60} fill={part === "w" ? C.accent : C.muted} fontSize="12">w{i + 1} = {w[i]}</text></P>
          </g>
        ))}
        <P k="sum"><circle cx="350" cy="110" r="34" fill={C.yellow + "22"} stroke={part === "sum" ? C.yellow : C.border} strokeWidth="2" /><text x="350" y="106" fill={C.text} fontSize="18" textAnchor="middle">Σ</text><text x="350" y="125" fill={C.yellow} fontSize="11" textAnchor="middle">z = {z.toFixed(1)}</text></P>
        <P k="b"><text x="350" y="200" fill={part === "b" ? C.purple : C.muted} fontSize="12" textAnchor="middle">+ bias b = {b}</text><line x1="350" y1="186" x2="350" y2="146" stroke={C.purple} strokeDasharray="4 3" /></P>
        <line x1="384" y1="110" x2="440" y2="110" stroke={C.muted} />
        <P k="act"><rect x="440" y="88" width="70" height="44" rx="8" fill={C.green + "22"} stroke={part === "act" ? C.green : C.border} /><text x="475" y="115" fill={C.text} fontSize="11" textAnchor="middle">z ≥ 0 ?</text></P>
        <line x1="510" y1="110" x2="540" y2="110" stroke={C.muted} />
        <text x="580" y="116" fill={z >= 0 ? C.green : C.red} fontSize="15" fontWeight="700" textAnchor="middle">{z >= 0 ? "GO ✓" : "STAY"}</text>
      </svg>
      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: PARTS[part].c + "14", border: `1px solid ${PARTS[part].c}55` }}>
        <b style={{ color: PARTS[part].c, fontSize: 13 }}>{PARTS[part].t}</b>
        <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{PARTS[part].d}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 12 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ background: C.card, borderRadius: 8, padding: 10, border: `1px solid ${C.border}` }}>
            <label style={{ color: C.text, fontSize: 12.5, cursor: "pointer" }}><input type="checkbox" checked={x[i] === 1} onChange={(e) => setX((v) => v.map((q, j) => (j === i ? (e.target.checked ? 1 : 0) : q)))} /> {labels[i]}</label>
            <Slider label={<>w{i + 1} = <b style={{ color: C.accent }}>{w[i]}</b></>} value={w[i]} min={-5} max={5} step={0.5} onChange={(v) => setW((q) => q.map((y, j) => (j === i ? v : y)))} />
          </div>
        ))}
      </div>
      <Slider label={<>bias b = <b style={{ color: C.purple }}>{b}</b></>} value={b} min={-5} max={5} step={0.5} onChange={setB} color={C.purple} />
      <div style={{ fontFamily: "monospace", fontSize: 12.5, color: C.yellow, marginBottom: 12 }}>
        z = ({w[0]})({x[0]}) + ({w[1]})({x[1]}) + ({w[2]})({x[2]}) + ({b}) = {z.toFixed(1)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Code color={C.orange} title="✍️ BY HAND (what really happens)">{`z = w1*x1 + w2*x2 + w3*x3 + b
out = 1 if z >= 0 else 0`}</Code>
        <Code color={C.accent} title="🔥 IN PYTORCH (one line)">{`neuron = torch.nn.Linear(3, 1)
z = neuron(x)   # same multiply-add`}</Code>
      </div>
      <Insight title="A neuron is just multiply, add, decide.">
        <code>nn.Linear</code> looks like magic, but it does exactly the sum you calculated by hand. AI frameworks are mostly very
        fast ways of doing this arithmetic.
      </Insight>
    </div>
  );
}

// ── Section 3: Activation functions ──
const ACTS = {
  step: { name: "Step", f: (z) => (z >= 0 ? 1 : 0), note: "YES/NO only. Simple, but there's no 'almost', so the neuron can't tell how close it was. That makes learning hard." },
  sigmoid: { name: "Sigmoid", f: (z) => 1 / (1 + Math.exp(-z)), note: "Squashes any z into 0…1, a smooth 'how sure am I'. Used when the output is a probability." },
  relu: { name: "ReLU", f: (z) => Math.max(0, z), note: "If z is negative output 0, otherwise pass z through. Very cheap to compute, and the most common choice inside modern networks." },
};
function ActivationWidget() {
  const [k, setK] = useState("sigmoid");
  const [z, setZ] = useState(1);
  const a = ACTS[k];
  const X = (v) => 30 + (v + 5) * 50, Y = (v) => 150 - v * (k === "relu" ? 24 : 110);
  const pts = Array.from({ length: 101 }, (_, i) => -5 + i * 0.1).map((v) => `${X(v)},${Y(a.f(v))}`).join(" ");
  const [stack, setStack] = useState(false);
  return (
    <div>
      <Frame>
        The activation decides what the neuron passes on. Pick one, then slide z to see the output.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {Object.entries(ACTS).map(([key, v]) => <Btn key={key} ghost={key !== k} onClick={() => setK(key)}>{v.name}</Btn>)}
      </div>
      <svg viewBox="0 0 560 175" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <line x1="30" y1="150" x2="530" y2="150" stroke={C.border} /><line x1="280" y1="10" x2="280" y2="165" stroke={C.border} />
        <text x="535" y="154" fill={C.muted} fontSize="11">z</text>
        <polyline points={pts} fill="none" stroke={C.accent} strokeWidth="2.5" />
        <circle cx={X(z)} cy={Y(a.f(z))} r="6" fill={C.yellow} />
        <text x={X(z) + 8} y={Y(a.f(z)) - 8} fill={C.yellow} fontSize="12">out = {a.f(z).toFixed(2)}</text>
      </svg>
      <Slider label={<>z = <b style={{ color: C.yellow }}>{z}</b></>} value={z} min={-5} max={5} step={0.25} onChange={setZ} color={C.yellow} />
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{a.note}</div>
      <div style={{ marginTop: 16, background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Why not skip the activation?</div>
        <Btn onClick={() => setStack((s) => !s)} ghost>{stack ? "Hide" : "Stack two neurons with NO activation"}</Btn>
        {stack && (
          <pre style={{ fontFamily: "monospace", fontSize: 12.5, color: C.text, marginTop: 10, lineHeight: 1.7 }}>{`neuron 1:  y = 3x + 1
neuron 2:  out = 2y − 4
put together: out = 2(3x + 1) − 4 = 6x − 2   ← still ONE straight line!`}</pre>
        )}
      </div>
      <Insight color={C.green} title="The activation is what makes many neurons more powerful than one.">
        Without it, any stack of neurons collapses into a single multiply-add. With a bend like ReLU in between, layers can learn
        curved, complicated patterns.
      </Insight>
    </div>
  );
}

// ── Section 4: Tune a neuron + count its work ──
function TuneWidget() {
  const [w1, setW1] = useState(0.5);
  const [w2, setW2] = useState(0.0);
  const [b, setB] = useState(-2);
  const [n, setN] = useState(784);
  const res = PEOPLE.map((s) => ({ ...s, z: w1 * s.h + w2 * s.a + b }));
  const right = res.filter((s) => (s.z >= 0 ? 1 : 0) === s.p).length;
  return (
    <div>
      <Frame>
        You are the training algorithm. Move the two weights and the bias until the neuron gets all 6 students right
        (hint: attendance is out of 100, so its weight should be small).
      </Frame>
      <Slider label={<>w₁ (hours) = <b style={{ color: C.accent }}>{w1}</b></>} value={w1} min={-1} max={2} step={0.1} onChange={setW1} />
      <Slider label={<>w₂ (attendance) = <b style={{ color: C.accent }}>{w2}</b></>} value={w2} min={-0.1} max={0.1} step={0.01} onChange={setW2} />
      <Slider label={<>bias b = <b style={{ color: C.purple }}>{b}</b></>} value={b} min={-10} max={2} step={0.5} onChange={setB} color={C.purple} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {res.map((s) => {
          const ok = (s.z >= 0 ? 1 : 0) === s.p;
          return (
            <div key={s.n} style={{ background: C.card, borderRadius: 8, padding: 8, border: `1.5px solid ${ok ? C.green : C.red}` }}>
              <div style={{ color: C.text, fontSize: 12.5, fontWeight: 600 }}>{s.n} <span style={{ color: s.p ? C.green : C.red, fontWeight: 400 }}>({s.p ? "passed" : "failed"})</span></div>
              <div style={{ color: C.muted, fontFamily: "monospace", fontSize: 11.5 }}>z = {s.z.toFixed(2)} → {s.z >= 0 ? "PASS" : "FAIL"} {ok ? "✓" : "✗"}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 8, color: right === 6 ? C.green : C.yellow, fontWeight: 700, fontSize: 13 }}>{right} / 6 correct {right === 6 ? "— you trained a neuron! 🎉" : ""}</div>

      <div style={{ marginTop: 18, background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>How much arithmetic is one neuron?</div>
        <Slider label={<>Number of inputs = <b style={{ color: C.orange }}>{n.toLocaleString("en-IN")}</b> {n === 784 ? "(one 28×28 image)" : n === 12288 ? "(a large language model's neuron)" : ""}</>} value={n} min={2} max={12288} step={2} onChange={setN} color={C.orange} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Stat label="MULTIPLICATIONS" value={n.toLocaleString("en-IN")} color={C.orange} />
          <Stat label="ADDITIONS" value={n.toLocaleString("en-IN")} color={C.orange} />
          <Stat label="DIFFICULTY" value="trivial" color={C.green} />
        </div>
      </div>
      <Insight color={C.orange} title="One neuron is easy. The trouble is that AI uses millions of them, over and over.">
        Each multiply-and-add pair is called a <b>MAC</b> (multiply-accumulate). Tuning 3 knobs by hand was fun; a real model has
        billions of knobs. Next unit: how the machine turns them by itself.
      </Insight>
      <LabCard part="C" title="Build a neuron in NumPy"
        what="Write the weighted sum by hand with a loop, then again with np.dot, and check that you get the same answer. Then feed it the six students from this section."
        expect="the loop and np.dot give identical z values, and your weights score 6 / 6." />
    </div>
  );
}
//@@SECTIONS
[["One Input Isn't Enough", "⚖️ One Input Isn't Enough — combine the evidence", "NeedWidget"],
 ["Anatomy", "⚡ Anatomy of a Neuron — multiply, add, decide", "AnatomyWidget"],
 ["Activation", "📈 Activation Functions — the bend that matters", "ActivationWidget"],
 ["Tune It", "🎛️ Tune a Neuron — and count its arithmetic", "TuneWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "Inputs x = [2, 3], weights w = [4, −1], bias b = 1. What is z?", options: ["6", "8", "9", "12"], answer: 0, explain: "z = 4×2 + (−1)×3 + 1 = 8 − 3 + 1 = 6." },
  { q: "What does a large NEGATIVE weight on an input mean?", options: ["That input is ignored", "That input pushes the neuron towards NO", "The neuron will crash", "That input is very small"], answer: 1, explain: "The weight multiplies the input, so a negative weight drags z down. 'Exam tomorrow' got a negative weight for exactly this reason." },
  { q: "ReLU gives 0 for negative z and z itself otherwise. What is ReLU(−3) and ReLU(2.5)?", options: ["−3 and 2.5", "0 and 2.5", "0 and 1", "3 and 2.5"], answer: 1, explain: "Negative values become 0 and positive values pass through unchanged: ReLU(−3) = 0, ReLU(2.5) = 2.5." },
  { q: "A neuron has 784 inputs. How many multiplications does it do for one image?", options: ["1", "28", "784", "784 × 784"], answer: 2, explain: "One multiply per input-weight pair: 784 multiplications (plus 784 additions). One neuron is cheap. Millions of them aren't." },
];
const RESULT = {
  perfect: "Perfect! You can compute a neuron by hand.",
  good: "Good. Replay 'Anatomy' and redo the z calculation yourself.",
  low: "Revisit 'Anatomy': z = w₁x₁ + w₂x₂ + … + b is the heart of this unit.",
  done: "Unit 1.3 Complete!",
  body: "You can build a neuron from weights, a bias and an activation, and count its multiply-adds.",
  next: "Next up: Unit 1.4 — Learning = Reducing Error.",
  teaser: "You tuned 3 knobs by hand. How does a machine tune a billion of them by itself?",
};
//@@WORDS
const UNIT_WORDS = [
  ["ReLU", "Rectified Linear Unit", "Activation: negative → 0, positive → unchanged. The most common activation today.", "new here"],
  ["MAC", "Multiply-Accumulate", "One multiply followed by adding the result to a running sum: the basic step of a neuron.", "new here"],
  ["IPL", "Indian Premier League", "The cricket league. Only used in the example!", "new here"],
];
