import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab1_AI_Basics.ipynb";

function Insight({ color = C.accent, title, children }) {
  return (
    <div style={{ marginTop: 16, background: color + "18", border: `1px solid ${color}44`, borderRadius: 8, padding: "12px 16px", fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
      🔑 <strong style={{ color }}>{title}</strong> {children}
    </div>
  );
}

function Frame({ children }) {
  return <p style={{ color: C.muted, fontSize: 13, marginBottom: 14, lineHeight: 1.7 }}>{children}</p>;
}

function Code({ children, color = C.border, title }) {
  return (
    <div style={{ background: C.card, border: `1.5px solid ${color}`, borderRadius: 10, padding: 14 }}>
      {title && <div style={{ color, fontWeight: 700, fontSize: 12, marginBottom: 8 }}>{title}</div>}
      <pre style={{ fontFamily: "monospace", fontSize: 12, color: C.text, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{children}</pre>
    </div>
  );
}

function LabCard({ part, title, what, expect }) {
  return (
    <div style={{ marginTop: 18, background: C.card, border: `1.5px solid ${C.orange}66`, borderRadius: 10, padding: 16 }}>
      <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>🧪 TRY IT FOR REAL — LAB 1 · PART {part}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{what}</div>
      <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}><b style={{ color: C.green }}>You should see:</b> {expect}</div>
      <a href={LAB_URL} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", borderRadius: 8, background: C.orange, color: "#0D1117", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Open Lab 1 in Colab ↗</a>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 8 }}>Colab opens in a new tab. Click <b>File → Save a copy in Drive</b> first, then scroll to Part {part}.</div>
    </div>
  );
}

function Btn({ onClick, children, color = C.accentGlow, ghost, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: "8px 16px", borderRadius: 8, background: ghost ? C.card : color, border: ghost ? `1px solid ${C.border}` : "none", color: ghost ? C.muted : "#fff", fontWeight: 600, cursor: disabled ? "default" : "pointer", fontSize: 13, opacity: disabled ? 0.5 : 1 }}>{children}</button>
  );
}

function Slider({ label, value, min, max, step = 1, onChange, color = C.accent }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ color: C.muted, fontSize: 12 }}>{label}</label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", accentColor: color }} />
    </div>
  );
}

function Stat({ label, value, color = C.teal }) {
  return (
    <div style={{ background: C.card, border: `1.5px solid ${color}`, borderRadius: 8, padding: "8px 12px", flex: 1, minWidth: 120 }}>
      <div style={{ color: C.muted, fontSize: 11, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ color, fontFamily: "monospace", fontSize: 15, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const TEXTBOOK = "D2L §3.1 (Linear regression: the neuron) · D2L §5.1 (Activation functions)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


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
        Back in Nila's class. In Unit 1.1 the machine learned a rule from <b style={{ color: C.text }}>one</b> input, study hours. But results also depend on
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
  b: { t: "Bias (b)", c: C.purple, d: "Sets WHERE the neuron switches from NO to YES. The neuron flips when z crosses 0. With one input, z = w·x + b is 0 at x = −b ÷ w, so b moves that switching point. Without b the switch is stuck at x = 0, whatever w is. The next section shows this." },
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
        Nila's question tonight: go to the IPL match, or stay home and study? A neuron decides. Toggle the inputs (1 = yes, 0 = no), change how much each one
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
        <Code color={C.orange} title="✍️ BY HAND (what really happens)">{`# each input × its weight, added up, + bias
z = w1*x1 + w2*x2 + w3*x3 + b
# step: 1 (YES) if z >= 0, else 0 (NO)
out = 1 if z >= 0 else 0`}</Code>
        <Code color={C.accent} title="🔥 IN PYTORCH (one line)">{`# a ready-made neuron: 3 inputs → 1 output
neuron = torch.nn.Linear(3, 1)
# the same multiply-add, done by PyTorch
z = neuron(x)`}</Code>
      </div>
      <Insight title="A neuron is just multiply, add, decide.">
        <code>nn.Linear</code> looks like magic, but it does exactly the sum you calculated by hand. AI frameworks are mostly very
        fast ways of doing this arithmetic.
      </Insight>
    </div>
  );
}

// ── Section 3: Why a bias? — the bias sets where the cut-off sits ──
const CLASS01 = [
  ["SNEHA", 0.5, 0], ["ARUN", 1, 0], ["ARJUN", 1.5, 0], ["DIVYA", 2, 0], ["RAHUL", 2.5, 0], ["VIJAY", 3, 0],
  ["NISHA", 3, 1], ["KARTHIK", 3.5, 1], ["MEENA", 4, 1], ["ANU", 4.5, 1], ["PRIYA", 5.5, 1], ["LAKSHMI", 6, 1],
];
function BiasWidget() {
  const [w, setW] = useState(1);
  const [bSet, setB] = useState(-1);
  const [noBias, setNoBias] = useState(false);
  const b = noBias ? 0 : bSet;
  const cut = -b / w;
  const pred = (h) => (w * h + b >= 0 ? 1 : 0);
  const right = CLASS01.filter(([, h, p]) => pred(h) === p).length;
  const X = (h) => 30 + h * 80;
  const cutX = X(Math.max(-0.3, Math.min(6.8, cut)));
  return (
    <div>
      <Frame>
        In Unit 1.1 the machine learned the rule <b style={{ color: C.text }}>"PASS if hours ≥ 3"</b>. Can a neuron with one input do the same?
        It computes <code style={{ color: C.yellow }}>z = w × hours + b</code> and says PASS when z ≥ 0. Move w and b and watch where the
        neuron switches from FAIL to PASS. Then switch the bias off.
      </Frame>
      <svg viewBox="0 0 600 150" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <rect x={cutX} y="20" width={Math.max(0, 580 - cutX)} height="90" fill={C.green + "18"} />
        <text x={Math.min(560, cutX + 6)} y="34" fill={C.green} fontSize="11">neuron says PASS →</text>
        <line x1="30" y1="100" x2="580" y2="100" stroke={C.border} />
        {[0, 1, 2, 3, 4, 5, 6].map((h) => <g key={h}><line x1={X(h)} y1="96" x2={X(h)} y2="104" stroke={C.muted} /><text x={X(h)} y="120" fill={C.muted} fontSize="10" textAnchor="middle">{h} h</text></g>)}
        {CLASS01.map(([n, h, p], i) => {
          const y = h === 3 ? (p ? 60 : 82) : 72, ok = pred(h) === p;
          return <g key={n}><circle cx={X(h)} cy={y} r="8" fill={p ? C.green : C.red} />{!ok && <circle cx={X(h)} cy={y} r="12" fill="none" stroke={C.yellow} strokeWidth="2" />}</g>;
        })}
        <line x1={cutX} y1="16" x2={cutX} y2="108" stroke={C.purple} strokeWidth="2.5" strokeDasharray="5 3" />
        <text x={cutX} y="140" fill={C.purple} fontSize="11" textAnchor="middle">cut-off = −b ÷ w = {cut.toFixed(2)} h</text>
      </svg>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 4 }}>Green dot = really passed, red dot = really failed, yellow ring = the neuron gets this student wrong.</div>
      <Slider label={<>weight w = <b style={{ color: C.accent }}>{w}</b> (how much each hour counts)</>} value={w} min={0.5} max={3} step={0.5} onChange={setW} />
      <Slider label={<>bias b = <b style={{ color: C.purple }}>{b}</b> {noBias ? "(switched off)" : ""}</>} value={bSet} min={-12} max={2} step={0.5} onChange={(v) => { setB(v); setNoBias(false); }} color={C.purple} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <Btn ghost={!noBias} color={C.red} onClick={() => setNoBias((v) => !v)}>{noBias ? "✓ No bias (b = 0)" : "Remove the bias (b = 0)"}</Btn>
        <Btn ghost onClick={() => { setW(1); setB(-3); setNoBias(false); }}>Show me w = 1, b = −3</Btn>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, fontFamily: "monospace", marginBottom: 8 }}>
        <tbody>
          <tr style={{ color: C.muted }}><td style={{ padding: 4 }}>hours</td>{[1, 2, 3, 4, 5].map((h) => <td key={h} style={{ textAlign: "right" }}>{h}</td>)}</tr>
          <tr style={{ color: C.yellow }}><td style={{ padding: 4 }}>z = {w}×hours {b < 0 ? "−" : "+"} {Math.abs(b)}</td>{[1, 2, 3, 4, 5].map((h) => <td key={h} style={{ textAlign: "right" }}>{(w * h + b).toFixed(1)}</td>)}</tr>
          <tr><td style={{ padding: 4, color: C.muted }}>neuron says</td>{[1, 2, 3, 4, 5].map((h) => <td key={h} style={{ textAlign: "right", color: pred(h) ? C.green : C.red }}>{pred(h) ? "PASS" : "FAIL"}</td>)}</tr>
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="CUT-OFF (−b ÷ w)" value={`${cut.toFixed(2)} hours`} color={C.purple} />
        <Stat label="CORRECT" value={`${right} / 12`} color={right >= 11 ? C.green : C.yellow} />
      </div>
      {noBias ? (
        <Insight color={C.red} title="Without a bias, the cut-off is stuck at 0 hours.">
          z = w × hours is 0 only when hours = 0. So every student who studied at all gets z &gt; 0 and PASSES. Changing w only makes the
          numbers bigger or smaller; it can never move the switching point. That is exactly why every neuron has a bias.
        </Insight>
      ) : (
        <Insight color={C.purple} title="The weight says how much each hour counts. The bias says where the pass mark is.">
          Think of b = −3 as starting <b>3 hours in debt</b>: each hour of study earns +1 (that is w), and you pass once the debt is paid off,
          at exactly 3 hours. In general the neuron switches at <b>hours = −b ÷ w</b>. Training finds both numbers for you.
        </Insight>
      )}
    </div>
  );
}

// ── Section 4: Activation functions ──
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
        <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
          With one neuron it looks optional: "z ≥ 0" and "z" carry the same information. It starts to matter when one neuron's answer
          feeds into another. <b style={{ color: C.text }}>Unit 1.5</b> shows it with a real example (who got a B grade?): take the
          activation out and two neurons quietly merge back into one, and the second neuron becomes useless.
        </div>
      </div>
      <Insight color={C.green} title="The activation turns z into a firm answer, and it is what makes a second neuron worth having.">
        Step gives a hard YES/NO, sigmoid a smooth "how sure", ReLU a cheap "negative becomes 0". Unit 1.4 shows why real networks
        prefer the smooth ones, and Unit 1.5 shows what goes wrong with no activation at all.
      </Insight>
    </div>
  );
}

// ── Section 5: Tune a neuron + count its work ──
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

const QUESTIONS = [
  { q: "Inputs x = [2, 3], weights w = [4, −1], bias b = 1. What is z?", options: ["6", "8", "9", "12"], answer: 0, explain: "z = 4×2 + (−1)×3 + 1 = 8 − 3 + 1 = 6." },
  { q: "A neuron reads one input, hours, with w = 2 and b = −8. From how many hours does it say PASS?", options: ["2", "4", "6", "8"], answer: 1, explain: "It switches where z = 2 × hours − 8 = 0, so at hours = −b ÷ w = 8 ÷ 2 = 4. The weight sets how much each hour counts; the bias sets where the cut-off is." },
  { q: "ReLU gives 0 for negative z and z itself otherwise. What is ReLU(−3) and ReLU(2.5)?", options: ["−3 and 2.5", "0 and 2.5", "0 and 1", "3 and 2.5"], answer: 1, explain: "Negative values become 0 and positive values pass through unchanged: ReLU(−3) = 0, ReLU(2.5) = 2.5." },
  { q: "A neuron has 784 inputs. How many multiplications does it do for one image?", options: ["1", "28", "784", "784 × 784"], answer: 2, explain: "One multiply per input-weight pair: 784 multiplications (plus 784 additions). One neuron is cheap. Millions of them aren't." },
];
const RESULT = {
  perfect: "Perfect! You can compute a neuron by hand.",
  good: "Good. Replay 'Anatomy' and redo the z calculation yourself.",
  low: "Revisit 'Anatomy': z = w₁x₁ + w₂x₂ + … + b is the heart of this unit.",
  done: "Unit 1.3 Complete!",
  body: "You can build a neuron from weights, a bias and an activation, place its cut-off with the bias (−b ÷ w), and count its multiply-adds.",
  next: "Next up: Unit 1.4 — Learning = Reducing Error.",
  teaser: "You set w and b by hand. How does a machine find them by itself, even when there are a million of them?",
};

const UNIT_WORDS = [
  ["ReLU", "Rectified Linear Unit", "Activation: negative → 0, positive → unchanged. The most common activation today.", "new here"],
  ["MAC", "Multiply-Accumulate", "One multiply followed by adding the result to a running sum: the basic step of a neuron.", "new here"],
  ["IPL", "Indian Premier League", "The cricket league. Only used in the example!", "new here"],
];

// ── Quiz ──
function Quiz({ onComplete }) {
  const questions = QUESTIONS;
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const choose = (i) => { if (selected !== null) return; setSelected(i); if (i === questions[current].answer) setScore((s) => s + 1); };
  const next = () => { if (current < questions.length - 1) { setCurrent((c) => c + 1); setSelected(null); } else { setDone(true); onComplete && onComplete(); } };
  if (done) {
    return (
      <div style={{ textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: 52 }}>{score >= 3 ? "🎉" : "👍"}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginTop: 10 }}>You scored {score} / {questions.length}</div>
        <div style={{ color: C.muted, marginTop: 8, marginBottom: 20 }}>{score === 4 ? RESULT.perfect : score >= 2 ? RESULT.good : RESULT.low}</div>
        <div style={{ padding: 20, borderRadius: 12, background: `linear-gradient(135deg, ${C.accentGlow}22, ${C.purple}22)`, border: `1px solid ${C.accent}55` }}>
          <div style={{ color: C.accent, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>🎓 {RESULT.done}</div>
          <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
            {RESULT.body}<br /><br />
            <strong style={{ color: C.accent }}>{RESULT.next}</strong> {RESULT.teaser}
          </div>
        </div>
      </div>
    );
  }
  const q = questions[current];
  const codey = q.q.includes("\n");
  return (
    <div>
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>Question {current + 1} of {questions.length}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 15, marginBottom: 16, whiteSpace: "pre-wrap", fontFamily: codey ? "monospace" : "inherit" }}>{q.q}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {q.options.map((opt, i) => {
          let bg = C.card, border = C.border, col = C.text;
          if (selected !== null) {
            if (i === q.answer) { bg = C.green + "22"; border = C.green; col = C.green; }
            else if (i === selected) { bg = C.red + "22"; border = C.red; col = C.red; }
          }
          return (
            <button key={i} onClick={() => choose(i)} style={{ textAlign: "left", padding: "10px 14px", borderRadius: 8, background: bg, border: `1.5px solid ${border}`, color: col, cursor: selected !== null ? "default" : "pointer", fontSize: 13, transition: "all 0.25s" }}>
              {i === q.answer && selected !== null ? "✓ " : i === selected && selected !== q.answer ? "✗ " : ""}{opt}
            </button>
          );
        })}
      </div>
      {selected !== null && <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: C.purple + "18", border: `1px solid ${C.purple}44`, color: C.muted, fontSize: 13 }}>💡 {q.explain}</div>}
      {selected !== null && <button onClick={next} style={{ marginTop: 14, padding: "10px 24px", borderRadius: 8, background: C.accentGlow, border: "none", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>{current < questions.length - 1 ? "Next Question →" : "See Results"}</button>}
    </div>
  );
}

// ── Word bank: every short name used in this unit, spelled out ──
function UnitWordBank() {
  const [open, setOpen] = useState(false);
  if (!UNIT_WORDS.length) return null;
  return (
    <div style={{ marginBottom: 18, borderRadius: 8, border: `1px solid ${C.teal}44`, background: C.teal + "0D", padding: "8px 12px" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: C.teal, fontSize: 12, fontWeight: 700, textAlign: "left", lineHeight: 1.5 }}>
        📖 Short names in this unit: <span style={{ fontFamily: "monospace", fontWeight: 400 }}>{UNIT_WORDS.map((w) => w[0]).join(" · ")}</span> {open ? "▲" : "▼ tap to see what they mean"}
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          {UNIT_WORDS.map(([w, full, plain, from]) => (
            <div key={w} style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6, marginBottom: 3 }}>
              <span style={{ fontFamily: "monospace", color: C.teal, fontWeight: 700 }}>{w}</span> = <b style={{ color: C.text }}>{full}</b>. {plain}{" "}
              <span style={{ fontSize: 11, color: from === "new here" ? C.yellow : C.muted }}>({from})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TextbookNote() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 18, borderRadius: 8, border: `1px solid ${C.purple}44`, background: C.purple + "0D", padding: "8px 12px" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: C.purple, fontSize: 12, fontWeight: 700, textAlign: "left", lineHeight: 1.6 }}>
        📘 Textbook: <span style={{ fontWeight: 400, color: C.text }}>{TEXTBOOK}</span> {open ? "▲" : "▼ which books?"}
      </button>
      {open && <div style={{ marginTop: 6, fontSize: 12, color: C.muted, lineHeight: 1.7 }}>{TEXTBOOK_KEY}</div>}
    </div>
  );
}

export default function Unit1_3({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "One Input Isn't Enough" },
    { id: "s1", label: "Anatomy" },
    { id: "s2", label: "Why a Bias?" },
    { id: "s3", label: "Activation" },
    { id: "s4", label: "Tune It" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>⚖️ One Input Isn't Enough — combine the evidence</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>⚡ Anatomy of a Neuron — multiply, add, decide</h3><AnatomyWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🎯 Why a Bias? — it decides where the cut-off sits</h3><BiasWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📈 Activation Functions — the bend that matters</h3><ActivationWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🎛️ Tune a Neuron — and count its arithmetic</h3><TuneWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 1.3.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 1 › UNIT 1.3</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>The Neuron</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>{completed.length} / {sections.length} done</div>
      </div>
      <div style={{ height: 3, background: C.border }}>
        <div style={{ height: "100%", width: `${(completed.length / sections.length) * 100}%`, background: C.green, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: C.surface, borderRadius: 10, padding: 4, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
          {sections.map((s, i) => (
            <button key={i} onClick={() => setActiveSection(i)} style={{ flex: 1, minWidth: 80, padding: "8px 6px", borderRadius: 7, background: activeSection === i ? C.accentGlow : "transparent", border: "none", color: activeSection === i ? "#fff" : C.muted, cursor: "pointer", fontSize: 11, fontWeight: activeSection === i ? 600 : 400, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "all 0.2s" }}>
              {completed.includes(i) && <span style={{ color: C.green }}>✓</span>}{s.label}
            </button>
          ))}
        </div>
        <div style={{ background: C.surface, borderRadius: 12, padding: "24px 20px", border: `1px solid ${C.border}`, minHeight: 300 }}>
          <UnitWordBank />
          <TextbookNote />
          {content[activeSection]}
        </div>
        {activeSection < sections.length - 1 && (
          <button onClick={goNext} style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: 8, background: C.accentGlow, border: "none", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Mark Complete &amp; Continue →</button>
        )}
      </div>
    </div>
  );
}
