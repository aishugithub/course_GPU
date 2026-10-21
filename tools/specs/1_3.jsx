//@@META
{"unit": "1.3", "module": 1, "title": "Every Output Is Independent", "icon": "🧩", "lab": "Lab1_AI_Is_Hungry.ipynb", "labNo": "1"}
//@@WIDGETS

// ── Section 1: Need — one worker, n³ steps ──
function NeedWidget() {
  const [n, setN] = useState(1000);
  const macs = n ** 3;
  const secs = macs / 1e9;
  const show = secs < 1 ? `${(secs * 1000).toFixed(1)} ms` : secs < 120 ? `${secs.toFixed(1)} s` : secs < 7200 ? `${(secs / 60).toFixed(0)} min` : `${(secs / 3600).toFixed(1)} hours`;
  return (
    <div>
      <Frame>
        Multiplying two n × n matrices takes n × n output cells, each a dot product of length n: <b style={{ color: C.text }}>n³ multiply-adds</b>.
        Suppose a single worker does one MAC per nanosecond (10⁹ per second), one after another, the way the CPU in COA steps through
        instructions. Drag n.
      </Frame>
      <Slider label={<>Matrix size n = <b style={{ color: C.accent }}>{n.toLocaleString("en-IN")}</b></>} value={n} min={100} max={20000} step={100} onChange={setN} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="OUTPUT CELLS (n²)" value={(n * n).toLocaleString("en-IN")} color={C.teal} />
        <Stat label="MACs (n³)" value={macs.toExponential(2)} color={C.orange} />
        <Stat label="ONE WORKER, IN ORDER" value={show} color={secs > 60 ? C.red : C.yellow} />
      </div>
      <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8 }}>Double n and the time goes up 8×. A single layer of a big model can be a matrix with a size in the thousands, and it's used again for every token.</div>
      <Insight color={C.red} title="Doing it one step at a time doesn't scale.">
        Making the single worker faster helps only a little (Unit 2.2 shows why clock speeds stopped rising). The real question is: do these
        steps actually <i>have</i> to happen one after another?
      </Insight>
    </div>
  );
}

// ── Section 2: Who waits for whom? ──
function DependWidget() {
  const [task, setTask] = useState("matmul");
  const [cell, setCell] = useState([1, 2]);
  const [day, setDay] = useState(3);
  const N = 4;
  const deposits = [500, -200, 300, -100, 400, 250];
  const bal = deposits.reduce((acc, d) => [...acc, (acc.length ? acc[acc.length - 1] : 1000) + d], []);
  return (
    <div>
      <Frame>
        Two jobs that look alike: both produce a list of answers using additions. Click an answer to see exactly what it needs before it can be
        computed.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Btn ghost={task !== "matmul"} onClick={() => setTask("matmul")}>🧮 Matrix multiply C = A × B</Btn>
        <Btn ghost={task !== "bank"} onClick={() => setTask("bank")} color={C.orange}>🏦 Running bank balance</Btn>
      </div>
      {task === "matmul" ? (
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          {["A", "B", "C"].map((m) => (
            <div key={m}>
              <div style={{ color: C.muted, fontSize: 11, textAlign: "center" }}>{m}</div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${N}, 28px)`, gap: 3 }}>
                {Array.from({ length: N * N }, (_, k) => {
                  const r = Math.floor(k / N), c = k % N;
                  const on = m === "A" ? r === cell[0] : m === "B" ? c === cell[1] : r === cell[0] && c === cell[1];
                  return <div key={k} onClick={() => m === "C" && setCell([r, c])} style={{ width: 28, height: 28, borderRadius: 4, cursor: m === "C" ? "pointer" : "default", background: on ? (m === "C" ? C.green : C.accent) + "55" : C.card, border: `1.5px solid ${on ? (m === "C" ? C.green : C.accent) : C.border}` }} />;
                })}
              </div>
            </div>
          ))}
          <div style={{ flex: 1, minWidth: 200, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
            C[{cell[0]}][{cell[1]}] needs <b style={{ color: C.accent }}>row {cell[0]} of A</b> and <b style={{ color: C.accent }}>column {cell[1]} of B</b>,
            and <b style={{ color: C.green }}>no other cell of C</b>. Click other C cells: none of them ever waits for another.
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 8px", fontFamily: "monospace", fontSize: 12, color: C.muted }}>start ₹1000</div>
            {bal.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: i <= day ? C.orange : C.border }}>→</span>
                <div onClick={() => setDay(i)} style={{ cursor: "pointer", background: i <= day ? C.orange + "33" : C.card, border: `1.5px solid ${i === day ? C.orange : C.border}`, borderRadius: 6, padding: "6px 8px", fontFamily: "monospace", fontSize: 12, color: C.text }}>
                  day {i + 1}<br />₹{b}
                </div>
              </div>
            ))}
          </div>
          <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginTop: 10 }}>
            Day {day + 1}'s balance needs day {day}'s balance{day > 0 ? `, which needs day ${day - 1}'s` : ""}… all the way back to the start. A <b style={{ color: C.orange }}>chain</b>:
            nobody can work on day {day + 1} until every earlier day is done.
          </div>
        </div>
      )}
      <Insight title="Independent outputs can all be computed at the same time. A chain can't.">
        Matrix multiplication, the core of AI (Unit 0.5), is the perfectly independent kind. That's the gift hidden inside AI's huge appetite.
      </Insight>
    </div>
  );
}

// ── Section 3: Hire more workers ──
const WCOL = [C.accent, C.green, C.orange, C.purple, C.teal, C.yellow, C.red, "#F778BA"];
function WorkersWidget() {
  const [w, setW] = useState(4);
  const [job, setJob] = useState("grid");
  const [t, setT] = useState(0);
  const timer = useRef(null);
  const JOBS = 64;
  const steps = job === "grid" ? Math.ceil(JOBS / w) : JOBS;
  useEffect(() => () => clearInterval(timer.current), []);
  const run = () => { clearInterval(timer.current); setT(0); timer.current = setInterval(() => setT((v) => { if (v >= steps) { clearInterval(timer.current); return v; } return v + 1; }), 120); };
  const doneAt = (k) => (job === "grid" ? Math.floor(k / w) + 1 : k + 1);
  return (
    <div>
      <Frame>
        64 pieces of work, and you can hire workers. For the <b style={{ color: C.green }}>grid</b> (independent cells), each worker grabs a cell.
        For the <b style={{ color: C.orange }}>chain</b>, step k must wait for step k − 1. Hire workers and press Run.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <Btn ghost={job !== "grid"} onClick={() => { setJob("grid"); setT(0); }} color={C.green}>Independent grid</Btn>
        <Btn ghost={job !== "chain"} onClick={() => { setJob("chain"); setT(0); }} color={C.orange}>Chain</Btn>
      </div>
      <Slider label={<>Workers = <b style={{ color: C.accent }}>{w}</b></>} value={w} min={1} max={64} onChange={(v) => { setW(v); setT(0); }} />
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 24px)", gap: 3 }}>
          {Array.from({ length: JOBS }, (_, k) => {
            const done = doneAt(k) <= t;
            const owner = job === "grid" ? k % w : 0;
            return <div key={k} style={{ width: 24, height: 24, borderRadius: 4, background: done ? WCOL[owner % 8] : C.card, border: `1px solid ${C.border}`, opacity: done ? 0.9 : 1 }} />;
          })}
        </div>
        <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 8 }}>
          <Btn onClick={run}>▶ Run</Btn>
          <Stat label="TIME STEPS NEEDED" value={steps} color={job === "grid" ? C.green : C.orange} />
          <Stat label="SPEED-UP vs 1 WORKER" value={`${(JOBS / steps).toFixed(1)}×`} color={C.purple} />
          <div style={{ color: C.muted, fontSize: 12 }}>{job === "chain" && w > 1 ? `${w - 1} workers stand idle: they have nothing they're allowed to do.` : job === "grid" ? "Colours show which worker did each cell." : ""}</div>
        </div>
      </div>
      <Insight color={C.green} title="For independent work, N workers ≈ N times faster. For a chain, extra workers do nothing.">
        Remember this picture: Module 2 builds a chip from thousands of workers. That only pays off because AI's work is the grid kind.
      </Insight>
    </div>
  );
}

// ── Section 4: Spot the parallelism in AI ──
const OPS = [
  { o: "Apply ReLU to every number in a layer's output", p: true, why: "Each number is changed on its own. Fully parallel." },
  { o: "Run 64 images of a batch through layer 1", p: true, why: "The images don't affect each other inside a layer. Parallel." },
  { o: "Compute layer 2 before layer 1 has finished", p: false, why: "Layer 2's input IS layer 1's output. Layers form a chain, but each layer inside is parallel." },
  { o: "Multiply two big matrices", p: true, why: "Every output cell is an independent dot product." },
  { o: "Start epoch 2 before epoch 1's weight updates are done", p: false, why: "Epoch 2 needs the weights produced by epoch 1. A chain." },
  { o: "A chatbot generating word 5 before word 4", p: false, why: "Each new word depends on the words before it. Generation is a chain, which is why answers appear word by word." },
  { o: "Add the bias to all 128 neurons of a layer", p: true, why: "128 separate additions with nothing shared. Parallel." },
  { o: "Compare 10 lakh predictions with the right answers", p: true, why: "Each comparison is separate. (Adding up the results afterwards can also be done in parallel, in a tree of pairs.)" },
];
function SpotWidget() {
  const [ans, setAns] = useState({});
  const right = OPS.filter((x, i) => ans[i] === x.p).length;
  return (
    <div>
      <Frame>Can each piece of work run at the same time as the others (parallel), or must it wait in line (chain)? Decide for each AI operation.</Frame>
      {OPS.map((x, i) => {
        const a = ans[i];
        return (
          <div key={i} style={{ background: C.card, border: `1px solid ${a === undefined ? C.border : a === x.p ? C.green : C.red}`, borderRadius: 8, padding: "9px 12px", marginBottom: 7 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220, color: C.text, fontSize: 13 }}>{x.o}</div>
              {[[true, "⚡ Parallel", C.green], [false, "⛓️ Chain", C.orange]].map(([v, l, c]) => (
                <button key={l} onClick={() => a === undefined && setAns((s) => ({ ...s, [i]: v }))} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${c}`, background: a === v ? c + "33" : "transparent", color: C.text, fontSize: 12, cursor: a === undefined ? "pointer" : "default" }}>{l}</button>
              ))}
            </div>
            {a !== undefined && <div style={{ marginTop: 5, fontSize: 12, color: a === x.p ? C.green : C.red }}>{a === x.p ? "✓ " : "✗ "}{x.why}</div>}
          </div>
        );
      })}
      {Object.keys(ans).length === OPS.length && (
        <Insight color={C.purple} title={`${right} / ${OPS.length}. Inside every step AI is massively parallel; between steps it's a chain.`}>
          So the winning machine does each step with thousands of workers at once and runs the steps in order. That's exactly a GPU working
          alongside a CPU.
        </Insight>
      )}
      <LabCard part="C" title="Loops vs vectorised code"
        what="Apply ReLU to 10 lakh numbers with a Python for-loop, then with one NumPy call; do the same for a running total. See which job speeds up and which doesn't."
        expect="NumPy's ReLU is far faster than the loop. np.cumsum is fast too (it's compiled code), but it still has to walk the chain one value after another, so it can't be shared out among many workers." />
    </div>
  );
}
//@@SECTIONS
[["One After Another", "🐢 One After Another — n³ steps for one worker", "NeedWidget"],
 ["Who Waits for Whom?", "🔗 Who Waits for Whom? — independent vs chained", "DependWidget"],
 ["Hire More Workers", "👷 Hire More Workers — when does it help?", "WorkersWidget"],
 ["Spot the Parallelism", "🔍 Spot the Parallelism — inside AI", "SpotWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "To compute cell C[2][3] of C = A × B, you need…", options: ["All of C computed first", "Row 2 of A and column 3 of B", "Column 2 of A and row 3 of B", "C[2][2]"], answer: 1, explain: "Each output cell is the dot product of one row of A with one column of B. No other output cell is needed." },
  { q: "64 independent tasks, 16 workers, each task takes 1 time step. How many steps?", options: ["1", "4", "16", "64"], answer: 1, explain: "Each step, 16 tasks finish: 64 ÷ 16 = 4 steps." },
  { q: "A 64-step chain (each step needs the previous one) with 16 workers takes…", options: ["4 steps", "16 steps", "64 steps", "1 step"], answer: 2, explain: "Only one step can ever run at a time, so the extra workers stay idle: still 64 steps." },
  { q: "Which part of a neural network is a CHAIN?", options: ["The neurons within one layer", "The images within one batch", "The layers, one after another", "The cells of a matrix multiply"], answer: 2, explain: "Layer 2 needs layer 1's output. Inside each layer, though, everything is parallel." },
];
const RESULT = {
  perfect: "Perfect! You can see the parallelism hidden in AI.",
  good: "Good. Replay 'Hire More Workers' with the chain.",
  low: "Revisit 'Who Waits for Whom?': independent vs chained is the key idea for the next module.",
  done: "Unit 1.3 Complete!",
  body: "You can tell independent work from chained work, and you know that matrix multiplication is perfectly parallel.",
  next: "Next up: Unit 1.C — Capstone: The Compute Bill.",
  teaser: "Estimate what it really takes to train and run an AI model for your college, and measure your own CPU's speed.",
};
//@@WORDS
const UNIT_WORDS = [
  ["MAC", "Multiply-Accumulate", "One multiply plus one add.", "from Unit 0.3"],
  ["n³", "n cubed", "n × n × n. The number of MACs in an n × n matrix multiply.", "new here"],
  ["ReLU", "Rectified Linear Unit", "Negative → 0, positive stays. Applied to every number on its own.", "from Unit 0.3"],
];
