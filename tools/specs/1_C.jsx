//@@META
{"unit": "1.C", "module": 1, "title": "Capstone: Train a Tiny Network", "icon": "🏆", "lab": "CoreLab03_Train_a_Real_Network.ipynb", "labNo": "Core Lab 3"}
//@@WIDGETS

// [hours, attendance %, passed]
const CLASS = [
  [0.5, 40, 0], [1.0, 65, 0], [1.5, 85, 0], [2.0, 95, 0], [2.5, 60, 0], [3.0, 45, 0], [3.0, 80, 1],
  [3.5, 70, 1], [4.0, 50, 1], [4.5, 35, 0], [5.0, 40, 1], [5.5, 75, 1], [6.0, 55, 1], [2.5, 92, 1],
  [1.0, 98, 0], [4.0, 90, 1], [2.0, 55, 0], [5.0, 25, 0], [3.5, 40, 0], [1.5, 50, 0],
];
const sig = (z) => 1 / (1 + Math.exp(-z));
function epochStep({ w1, w2, b }, lr) {
  let g1 = 0, g2 = 0, gb = 0, loss = 0, right = 0;
  for (const [h, a, y] of CLASS) {
    const x1 = h / 6, x2 = a / 100, p = sig(w1 * x1 + w2 * x2 + b);
    g1 += (p - y) * x1; g2 += (p - y) * x2; gb += p - y;
    loss += -(y * Math.log(p + 1e-9) + (1 - y) * Math.log(1 - p + 1e-9));
    if ((p >= 0.5 ? 1 : 0) === y) right++;
  }
  const n = CLASS.length;
  return { next: { w1: w1 - lr * g1 / n, w2: w2 - lr * g2 / n, b: b - lr * gb / n }, loss: loss / n, right };
}

// ── Section 1: The Mission ──
const TOOLS = [
  ["Students become numbers: hours / 6 and attendance / 100", "Lesson 1.2"],
  ["A neuron with 2 weights + a bias, sigmoid activation", "Lesson 1.3"],
  ["A loss that measures how wrong the predictions are", "Lesson 1.4"],
  ["Gradient descent to nudge the weights, epoch after epoch", "Lesson 1.4"],
  ["All 20 students at once: X @ w, a matrix multiply", "Lesson 1.5"],
];
function MissionWidget() {
  const [ticks, setTicks] = useState([]);
  return (
    <div>
      <Frame>
        Nila's college wants an early-warning system: from a student's <b style={{ color: C.text }}>daily study hours</b> and
        <b style={{ color: C.text }}> attendance</b>, predict PASS or FAIL so that teachers can help in time. You have last year's records for
        20 students. Nobody gives you the rule; your model must learn it. Tick each tool once you've found where you learned it.
      </Frame>
      {TOOLS.map(([t, u], i) => {
        const on = ticks.includes(i);
        return (
          <div key={i} onClick={() => setTicks((s) => (on ? s.filter((x) => x !== i) : [...s, i]))} style={{ display: "flex", gap: 10, alignItems: "center", background: C.card, border: `1.5px solid ${on ? C.green : C.border}`, borderRadius: 8, padding: "9px 12px", marginBottom: 7, cursor: "pointer" }}>
            <span style={{ fontSize: 16 }}>{on ? "✅" : "⬜"}</span>
            <span style={{ flex: 1, color: C.text, fontSize: 13 }}>{t}</span>
            <span style={{ color: C.accent, fontSize: 12, fontFamily: "monospace" }}>{u}</span>
          </div>
        );
      })}
      <Insight color={C.green} title="Every piece is something you already know.">
        This capstone just connects them: numbers in → neuron → loss → gradient descent → a trained model. That chain is the whole of
        machine learning, at its smallest.
      </Insight>
    </div>
  );
}

// ── Section 2: Build in Steps ──
const VERSIONS = [
  { tag: "v1", title: "Forward pass only", color: C.teal, why: "First make the model produce SOME prediction. With all weights at 0, the sigmoid says 0.5 (\"no idea\") for everyone. That's a model, just an untrained one.", code: `import numpy as np                        # NumPy: fast arithmetic on whole lists of numbers
hours  = np.array([0.5, 1.0, 1.5, ...])   # study hours per day of the 20 students
att    = np.array([40, 65, 85, ...])      # their attendance %
passed = np.array([0, 0, 0, ...])         # the real results: 1 = passed, 0 = failed

X = np.column_stack([hours / 6, att / 100])   # Lesson 1.2: scale both to 0..1, side by side
w = np.zeros(2); b = 0.0                      # start with every knob at zero

def sigmoid(z):                               # the sigmoid activation...
    return 1 / (1 + np.exp(-z))               # ...squashes any z into 0..1

p = sigmoid(X @ w + b)     # Lessons 1.3 + 0.5: one neuron for all 20 students at once
print(p)                   # all 0.5 — the model knows nothing yet` },
  { tag: "v2", title: "+ measure the loss", color: C.yellow, why: "Before improving, we need a score for 'how wrong'. For YES/NO answers we use cross-entropy loss: it punishes a confident wrong answer very hard. At p = 0.5 for everyone, the loss is about 0.69.", code: `# ...v1 code...
# cross-entropy loss: the average penalty, huge for confident wrong answers
loss = -np.mean(passed * np.log(p) + (1 - passed) * np.log(1 - p))
print(loss)                # 0.693 — the 'knows nothing' loss` },
  { tag: "v3", title: "+ the training loop", color: C.green, why: "Now the loop from Lesson 1.4. For a sigmoid neuron with cross-entropy, the gradient works out to a neat formula: (prediction − answer) × input. Repeat 500 times and the weights find the rule.", code: `lr = 2.0                                        # the learning rate (step size)
for epoch in range(500):                        # 500 rounds of the training loop
    p = sigmoid(X @ w + b)                      # 1. predict
    # 2. loss: how wrong are the predictions?
    loss = -np.mean(passed*np.log(p) + (1-passed)*np.log(1-p))
    grad_w = X.T @ (p - passed) / len(passed)   # 3. slopes for the two weights...
    grad_b = np.mean(p - passed)                #    ...and for the bias
    w -= lr * grad_w                            # 4. nudge the weights against their slopes...
    b -= lr * grad_b                            #    ...and the bias
    if epoch % 100 == 0:                        # every 100 rounds...
        print(epoch, round(loss, 3))            # ...show how the loss is falling

accuracy = np.mean((p >= 0.5) == passed)        # fraction of students predicted right
print("accuracy:", accuracy)                    # show it` },
];
function BuildWidget() {
  const [v, setV] = useState(0);
  const cur = VERSIONS[v];
  return (
    <div>
      <Frame>Real programmers grow a program one idea at a time. Click through the three versions; each adds ONE idea.</Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {VERSIONS.map((x, i) => <Btn key={x.tag} ghost={i !== v} onClick={() => setV(i)} color={x.color}>{x.tag}: {x.title}</Btn>)}
      </div>
      <div style={{ padding: "10px 14px", borderRadius: 8, background: cur.color + "14", border: `1px solid ${cur.color}55`, color: C.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
        <b style={{ color: cur.color }}>{cur.tag}: </b>{cur.why}
      </div>
      <Code color={cur.color}>{cur.code}</Code>
      <Insight title="Predict, measure, correct: three versions, three ideas.">
        Version 3 is a complete machine-learning program. It's under 20 lines, because the hard part is ideas, not code.
      </Insight>
    </div>
  );
}

// ── Section 3: Play It — train live ──
function PlayWidget() {
  const [m, setM] = useState({ w1: 0, w2: 0, b: 0 });
  const [hist, setHist] = useState([]);
  const [lr, setLr] = useState(2);
  const stat = epochStep(m, lr);
  const train = (k) => {
    let cur = m; const h = [];
    for (let i = 0; i < k; i++) { const r = epochStep(cur, lr); h.push(r.loss); cur = r.next; }
    setM(cur); setHist((p) => [...p, ...h].slice(-600));
  };
  const reset = () => { setM({ w1: 0, w2: 0, b: 0 }); setHist([]); };
  const PX = (h) => 30 + (h / 6.5) * 300, PY = (a) => 200 - ((a - 20) / 85) * 185;
  // decision boundary: w1*h/6 + w2*a/100 + b = 0 → a = -(w1*h/6 + b) * 100 / w2
  let line = null;
  if (Math.abs(m.w2) > 1e-6) {
    const aAt = (h) => -(m.w1 * h / 6 + m.b) * 100 / m.w2;
    line = [PX(0), PY(aAt(0)), PX(6.5), PY(aAt(6.5))];
  }
  const maxL = Math.max(0.7, ...hist);
  return (
    <div>
      <Frame>
        Press Train and watch gradient descent work. The blue line is where the model switches from FAIL to PASS. Each press runs epochs
        on all 20 students. Try a tiny learning rate, then a huge one.
      </Frame>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <svg viewBox="0 0 340 215" style={{ flex: 1.4, minWidth: 260, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
          <defs><clipPath id="plot"><rect x="30" y="10" width="300" height="190" /></clipPath></defs>
          <line x1="30" y1="200" x2="335" y2="200" stroke={C.border} /><line x1="30" y1="10" x2="30" y2="200" stroke={C.border} />
          <text x="300" y="212" fill={C.muted} fontSize="9">hours →</text><text x="2" y="14" fill={C.muted} fontSize="9">att%</text>
          {line && <line x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} stroke={C.accent} strokeWidth="2.5" clipPath="url(#plot)" />}
          {CLASS.map(([h, a, y], i) => {
            const p = sig(m.w1 * h / 6 + m.w2 * a / 100 + m.b), ok = (p >= 0.5 ? 1 : 0) === y;
            return <g key={i}><circle cx={PX(h)} cy={PY(a)} r="6" fill={y ? C.green : C.red} />{!ok && <circle cx={PX(h)} cy={PY(a)} r="9.5" fill="none" stroke={C.yellow} strokeWidth="1.5" />}</g>;
          })}
        </svg>
        <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 8 }}>
          <Stat label="EPOCHS RUN" value={hist.length} color={C.purple} />
          <Stat label="LOSS" value={stat.loss.toFixed(3)} color={C.yellow} />
          <Stat label="ACCURACY" value={`${stat.right} / 20`} color={stat.right >= 19 ? C.green : C.orange} />
          <div style={{ fontFamily: "monospace", fontSize: 11.5, color: C.muted }}>w₁={m.w1.toFixed(2)} w₂={m.w2.toFixed(2)} b={m.b.toFixed(2)}</div>
        </div>
      </div>
      <svg viewBox="0 0 340 60" style={{ width: "100%", marginTop: 8, background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
        <text x="6" y="12" fill={C.yellow} fontSize="9">loss over epochs</text>
        {hist.length > 1 && <polyline fill="none" stroke={C.yellow} strokeWidth="1.5" points={hist.map((l, i) => `${10 + (i / Math.max(1, hist.length - 1)) * 320},${55 - (Math.min(l, maxL) / maxL) * 40}`).join(" ")} />}
      </svg>
      <Slider label={<>learning rate = <b style={{ color: C.orange }}>{lr}</b></>} value={lr} min={0.1} max={30} step={0.1} onChange={setLr} color={C.orange} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Btn onClick={() => train(1)}>Train 1 epoch</Btn>
        <Btn onClick={() => train(50)} color={C.green}>Train 50 epochs</Btn>
        <Btn onClick={() => train(500)} color={C.purple}>Train 500</Btn>
        <Btn ghost onClick={reset}>↺ Reset</Btn>
      </div>
      <Insight color={C.green} title="You just watched a machine learn.">
        Nobody told it "hours + attendance". It found the boundary by itself, from data, by gradient descent. One student stays wrong
        however long you train: real data is messy (remember VIJAY and NISHA?). A good model is right most of the time, not always.
      </Insight>
    </div>
  );
}

// ── Section 4: Full code + the real lab ──
// ── Section: Memorising vs learning — train, validation and test (book: 1.C, Core Lab 3 Part B2) ──
// The book's run: 784 → 128 → 10, only 200 training images, 10,000 validation images, 100 epochs.
const OF_EP = [1, 5, 10, 19, 20, 40, 60, 80, 100];
const OF_TR = [2.010, 0.722, 0.273, 0.085, 0.077, 0.023, 0.012, 0.008, 0.006];
const OF_VA = [2.096, 1.094, 0.781, 0.698, 0.705, 0.742, 0.780, 0.808, 0.833];
function ofAt(arr, e) {
  for (let i = 0; i < OF_EP.length - 1; i++) {
    if (e <= OF_EP[i + 1]) { const t = (e - OF_EP[i]) / (OF_EP[i + 1] - OF_EP[i]); return arr[i] + t * (arr[i + 1] - arr[i]); }
  }
  return arr[arr.length - 1];
}
function OverfitWidget() {
  const [ep, setEp] = useState(100);
  const [split, setSplit] = useState(false);
  const X = (e) => 40 + (e - 1) * 5.0, Y = (l) => 170 - l * 70;
  const line = (arr) => Array.from({ length: 100 }, (_, i) => `${X(i + 1)},${Y(ofAt(arr, i + 1))}`).join(" ");
  const tr = ofAt(OF_TR, ep), va = ofAt(OF_VA, ep);
  const verdict = ep < 19 ? ["Learning: both losses are still falling.", C.green]
    : ep === 19 ? ["The best moment: the lowest validation loss (0.698). Stop here.", C.purple]
    : ["Memorising: training loss still falls, but validation loss is rising.", C.red];
  return (
    <div>
      <Frame>
        A student who memorises last year's answers scores 100% on last year's paper and fails the real exam. A network can do the same. Here the
        digit network of this lesson gets only <b style={{ color: C.text }}>200</b> training images, and 10,000 other images it never trains on
        (the <b style={{ color: C.accent }}>validation set</b>). We trained it for 100 epochs and recorded both losses. Move the slider.
      </Frame>
      <Slider label={<>epoch <b style={{ color: C.accent }}>{ep}</b></>} value={ep} min={1} max={100} onChange={setEp} />
      <svg viewBox="0 0 560 200" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <line x1="40" y1="170" x2="540" y2="170" stroke={C.border} />
        <line x1="40" y1="20" x2="40" y2="170" stroke={C.border} />
        {[0, 1, 2].map((l) => <text key={l} x="34" y={Y(l) + 4} fill={C.muted} fontSize="10" textAnchor="end">{l}</text>)}
        {[1, 20, 40, 60, 80, 100].map((e) => <text key={e} x={X(e)} y="185" fill={C.muted} fontSize="10" textAnchor="middle">{e}</text>)}
        <polyline points={line(OF_TR)} fill="none" stroke={C.accent} strokeWidth="2.5" />
        <polyline points={line(OF_VA)} fill="none" stroke={C.red} strokeWidth="2.5" />
        <line x1={X(19)} y1="20" x2={X(19)} y2="170" stroke={C.green} strokeDasharray="5 4" />
        <text x={X(19) + 5} y="30" fill={C.green} fontSize="10.5">stop here: epoch 19</text>
        <line x1={X(ep)} y1="20" x2={X(ep)} y2="170" stroke={C.yellow} />
        <circle cx={X(ep)} cy={Y(tr)} r="5" fill={C.accent} /><circle cx={X(ep)} cy={Y(va)} r="5" fill={C.red} />
        <text x="380" y="50" fill={C.accent} fontSize="11">training loss (200 images)</text>
        <text x="380" y="66" fill={C.red} fontSize="11">validation loss (10,000 images)</text>
      </svg>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <Stat label="TRAINING LOSS" value={tr.toFixed(3)} color={C.accent} />
        <Stat label="VALIDATION LOSS" value={va.toFixed(3)} color={C.red} />
      </div>
      <div style={{ color: verdict[1], fontSize: 13.5, fontWeight: 600, marginTop: 8 }}>{verdict[0]}</div>
      <div style={{ marginTop: 10 }}><Btn ghost onClick={() => setSplit((v) => !v)}>{split ? "▲ Hide" : "▼ Three piles of data: train, validation, test"}</Btn></div>
      {split && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginTop: 8 }}>
          <tbody>
            {[["Training set", "50,000 (here only 200)", "the practice papers the model learns from", C.accent],
              ["Validation set", "10,000", "a mock exam used to make choices (when to stop, which learning rate)", C.yellow],
              ["Test set", "the official 10,000", "the final exam: used once, at the very end", C.green]].map(([a, b, c, col]) => (
              <tr key={a}><td style={{ padding: "5px 8px", color: col, fontWeight: 700 }}>{a}</td><td style={{ padding: "5px 8px", color: C.text }}>{b}</td><td style={{ padding: "5px 8px", color: C.muted }}>{c}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      <Insight color={C.purple} title="Overfitting: fitting the practice papers so closely that it does worse on new ones.">
        At epoch 19 the validation loss is lowest (0.698); by epoch 100 it has risen to 0.833, about 19% worse, while the training loss fell to 0.006.
        So we keep the epoch-19 model (<b>early stopping</b>) and only then look at the test set: 75.6% correct. The same network trained on all 60,000
        images reaches about 95% in 3 epochs: more data is the best cure for memorising.
      </Insight>
      <Insight color={C.orange} title="⚠️ Slippery step: '100% on the training data' is not good news by itself.">
        Our 200-image model is 100% right on its training images and only about 76% right on new ones. Always report the score on data the model has
        never seen, and never tune anything on the test set, or it stops being an exam and becomes another practice paper.
      </Insight>
    </div>
  );
}

function CodeWidget() {
  return (
    <div>
      <Frame>
        Here is the complete program. It runs as-is in any Python with NumPy. In Core Lab 3, Part B, you'll go one big step further: a machine that
        reads the marks handwritten on answer sheets, a real digit-reading network trained with PyTorch and timed on the CPU.
      </Frame>
      <Code color={C.green} title="🧠 tiny_network.py — the whole capstone">{`import numpy as np                                  # NumPy: fast arithmetic on whole lists of numbers

# study hours per day of the 20 students
hours  = np.array([0.5,1.0,1.5,2.0,2.5,3.0,3.0,3.5,4.0,4.5,5.0,5.5,6.0,2.5,1.0,4.0,2.0,5.0,3.5,1.5])
# their attendance %
att    = np.array([40, 65, 85, 95, 60, 45, 80, 70, 50, 35, 40, 75, 55, 92, 98, 90, 55, 25, 40, 50])
# the real results: 1 = passed, 0 = failed
passed = np.array([0,  0,  0,  0,  0,  0,  1,  1,  1,  0,  1,  1,  1,  1,  0,  1,  0,  0,  0,  0])

X = np.column_stack([hours / 6, att / 100])         # scale both features to 0..1, side by side
w, b, lr = np.zeros(2), 0.0, 2.0                    # knobs start at zero; learning rate 2.0
sigmoid = lambda z: 1 / (1 + np.exp(-z))            # the sigmoid activation, as a one-line function

for epoch in range(500):                            # 500 rounds of the training loop
    p = sigmoid(X @ w + b)                          # 1. predict all 20 students at once
    # 2. loss (the tiny 1e-9 stops log(0) from crashing the program)
    loss = -np.mean(passed*np.log(p + 1e-9) + (1-passed)*np.log(1 - p + 1e-9))
    w -= lr * X.T @ (p - passed) / len(passed)      # 3 + 4. slopes for the weights, then nudge them
    b -= lr * np.mean(p - passed)                   #        the same for the bias
    if epoch % 100 == 0:                            # every 100 rounds...
        print(f"epoch {epoch:3d}  loss {loss:.3f}") # ...show the loss

print("weights:", w.round(2), "bias:", round(b, 2))   # the knobs that training found
print("accuracy:", np.mean((p >= 0.5) == passed))     # fraction of students predicted right
# ask the trained model about a new student: 4 hours a day, 85% attendance
print("New student, 4 h & 85%:", "PASS" if sigmoid(np.array([4/6, 0.85]) @ w + b) >= 0.5 else "FAIL")`}</Code>
      <div style={{ marginTop: 12, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        <b style={{ color: C.text }}>Challenge upgrades:</b> (1) add a third feature, homework submitted (0/1); (2) print the loss every 10 epochs and
        plot it; (3) try lr = 0.1 and lr = 50 and explain what you see.
      </div>
      <LabCard part="B" title="Your first real AI: a machine that reads handwritten marks"
        what="Teach a computer to read the digits a teacher writes on answer sheets. Load the 60,000-image MNIST dataset, build a 784 → 128 → 10 network in PyTorch, train it for 3 epochs on the CPU, and time each epoch. Write down the time: Step 2 asks where it all goes."
        expect="accuracy around 95–97%, and each epoch taking several seconds on Colab's CPU." />
      <Insight color={C.orange} title="Twenty students trained instantly. Sixty thousand images take seconds. A chatbot takes months.">
        It's the same multiply-add arithmetic at every scale. Step 2 counts exactly how much of it there is, and why an ordinary CPU starts to choke.
      </Insight>
    </div>
  );
}
// ── Section 4: How sure is it? Answers as probabilities ──
const GRADES = ["A", "B", "C", "F"];
const NEXT_WORDS = ["easy", "hard", "long", "cancelled"];
const softmax = (zs, T = 1) => { const e = zs.map((z) => Math.exp(z / T)), t = e.reduce((a, b) => a + b, 0); return e.map((v) => v / t); };
function ProbBar({ label, p, color, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <div style={{ width: 86, color: right ? C.green : C.text, fontSize: 13, fontWeight: right ? 700 : 400 }}>{label}{right ? " ✓" : ""}</div>
      <div style={{ flex: 1, height: 16, background: C.surface, borderRadius: 4 }}>
        <div style={{ width: `${p * 100}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.3s" }} />
      </div>
      <div style={{ width: 54, textAlign: "right", fontFamily: "monospace", fontSize: 13, color: C.text }}>{p.toFixed(3)}</div>
    </div>
  );
}
function ProbWidget() {
  const [view, setView] = useState("sig");
  const [hours, setHours] = useState(4);
  const [att, setAtt] = useState(85);
  const [zs, setZs] = useState([2.0, 1.0, 0.1, -1.0]);
  const [truth, setTruth] = useState(1);
  const [T, setT] = useState(1);
  const [tally, setTally] = useState([0, 0, 0, 0]);
  const z = 10.67 * (hours / 6) + 8.0 * (att / 100) - 11.19, ps = sig(z);
  const probs = softmax(zs), tProbs = softmax([2.0, 1.0, 0.1, -1.0], T);
  const sample = (n) => {
    const t = [...tally];
    for (let k = 0; k < n; k++) { let r = Math.random(), i = 0; while (i < 3 && r > tProbs[i]) { r -= tProbs[i]; i++; } t[i]++; }
    setTally(t);
  };
  const total = tally.reduce((a, b) => a + b, 0);
  return (
    <div>
      <Frame>
        The trained model never says PASS. It says a number like <b style={{ color: C.text }}>0.94</b>, and we call it PASS because 0.94 &gt; 0.5. That number is a
        <b style={{ color: C.accent }}> probability</b>: 0 means "never", 1 means "certain", and the probabilities of all the possible answers add up to 1.
        Almost every AI answers this way: a camera app is 0.97 sure it's a cat; a chatbot picks each next word from a list of probabilities.
      </Frame>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <Btn ghost={view !== "sig"} onClick={() => setView("sig")}>① Two answers: sigmoid</Btn>
        <Btn ghost={view !== "soft"} onClick={() => setView("soft")}>② Many answers: softmax</Btn>
        <Btn ghost={view !== "chat"} onClick={() => setView("chat")}>③ 🥾 Side Trail: chatbots and temperature</Btn>
      </div>
      {view === "sig" && (
        <div>
          <Frame>Our trained neuron: z = 10.67 × hours/6 + 8.0 × attendance/100 − 11.19, then p = sigmoid(z). Move a new student's numbers.</Frame>
          <Slider label={<>Hours of study a day: <b style={{ color: C.accent }}>{hours}</b></>} value={hours} min={0} max={6} step={0.5} onChange={setHours} />
          <Slider label={<>Attendance: <b style={{ color: C.accent }}>{att}%</b></>} value={att} min={20} max={100} step={5} onChange={setAtt} />
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 10, fontFamily: "monospace" }}>z = {z.toFixed(2)} → p = sigmoid(z) = {ps.toFixed(2)}</div>
          <ProbBar label="PASS" p={ps} color={C.green} />
          <ProbBar label="FAIL" p={1 - ps} color={C.red} />
          <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginTop: 8 }}>
            The two always add up to 1. The model says <b style={{ color: ps >= 0.5 ? C.green : C.red }}>{ps >= 0.5 ? "PASS" : "FAIL"}</b>, {Math.round(Math.max(ps, 1 - ps) * 100)}% sure.
            A teacher should worry more about a student at 0.51 than one at 0.99, though both are "PASS". And a smooth probability is what lets gradient descent learn:
            a plain PASS/FAIL step has slope 0 (Lesson 1.4).
          </div>
        </div>
      )}
      {view === "soft" && (
        <div>
          <Frame>
            Now predict a <b style={{ color: C.text }}>grade</b>: four output neurons, one per grade, each giving a score. Scores can be negative and don't add up to 1.
            <b style={{ color: C.accent }}> Softmax</b> fixes both: raise e to each score (all positive), then divide by the total (they add up to 1). Change the scores.
          </Frame>
          {GRADES.map((g, i) => (
            <Slider key={g} label={<>Score for {g}: <b style={{ color: C.accent }}>{zs[i].toFixed(1)}</b> → e<sup>z</sup> = {Math.exp(zs[i]).toFixed(3)}</>} value={zs[i]} min={-3} max={4} step={0.1}
              onChange={(v) => setZs(zs.map((x, k) => (k === i ? v : x)))} />
          ))}
          {GRADES.map((g, i) => <ProbBar key={g} label={`grade ${g}`} p={probs[i]} color={C.purple} right={i === truth} />)}
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
            <span style={{ color: C.muted, fontSize: 12 }}>The student really got:</span>
            {GRADES.map((g, i) => <Btn key={g} color={C.green} ghost={i !== truth} onClick={() => setTruth(i)}>{g}</Btn>)}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <Stat label="TOTAL OF THE 4 PROBABILITIES" value={probs.reduce((a, b) => a + b, 0).toFixed(3)} />
            <Stat label={`LOSS = −log(p of ${GRADES[truth]})`} value={(-Math.log(probs[truth])).toFixed(3)} color={C.orange} />
          </div>
          <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginTop: 8 }}>
            The same cross-entropy as the capstone: the penalty is −log of the probability given to the <b>right</b> answer. Push that probability up and the loss
            falls; because all four add up to 1, the wrong ones come down.
          </div>
        </div>
      )}
      {view === "chat" && (
        <div>
          <Frame>
            A chatbot has one output neuron per token in its dictionary (50,000 or more) and uses softmax to get the probability of each possible
            <b style={{ color: C.text }}> next word</b>. It then <b style={{ color: C.accent }}>draws</b> one at random, using those odds. The <b style={{ color: C.yellow }}>temperature</b> T
            divides every score by T first. "The exam was …"
            <span style={{ color: C.muted }}> (🥾 An optional Side Trail: Appendix A.3 of the book. Nothing later needs it.)</span>
          </Frame>
          <Slider label={<>Temperature T = <b style={{ color: C.yellow }}>{T.toFixed(1)}</b></>} value={T} min={0.2} max={3} step={0.1} onChange={(v) => { setT(v); setTally([0, 0, 0, 0]); }} color={C.yellow} />
          {NEXT_WORDS.map((w, i) => <ProbBar key={w} label={`"${w}"`} p={tProbs[i]} color={C.yellow} />)}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            <Btn onClick={() => sample(1)}>Ask once</Btn>
            <Btn onClick={() => sample(20)}>Ask 20 times</Btn>
            <Btn ghost onClick={() => setTally([0, 0, 0, 0])}>↺</Btn>
          </div>
          {total > 0 && (
            <div style={{ color: C.muted, fontSize: 13, marginTop: 10, fontFamily: "monospace" }}>
              {total} answers: {NEXT_WORDS.map((w, i) => `${w} ${tally[i]}`).join(" · ")}
            </div>
          )}
          <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginTop: 8 }}>
            Low T: the favourite wins almost every time (safe, repeatable). High T: the odds flatten, and "cancelled" turns up more often (varied, and more often wrong).
            That's why the same question can get two different answers.
          </div>
        </div>
      )}
      <Insight color={C.purple} title="AI answers with probabilities.">
        Sigmoid gives the probability of YES for a two-way question; softmax turns many scores into probabilities that add up to 1; the loss is −log(probability of the
        right answer). A chatbot is softmax over its whole dictionary, one token at a time. "94% sure" is not "certain": a model trained on poor data can be
        confidently wrong. Underneath, every score still comes from multiply-adds.
      </Insight>
    </div>
  );
}
//@@SECTIONS
[["The Mission", "🎯 The Mission — an early-warning system for Nila's college", "MissionWidget"],
 ["Build in Steps", "🪜 Build in Steps — predict, measure, correct", "BuildWidget"],
 ["Play It", "▶️ Play It — train the network live", "PlayWidget"],
 ["How Sure Is It?", "🎲 How Sure Is It? — answers as probabilities", "ProbWidget"],
 ["Memorising vs Learning", "📉 Memorising vs Learning — train, validation and test", "OverfitWidget"],
 ["Full Code & Lab", "📜 Full Code — and your first real AI", "CodeWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "After epoch 19 the training loss keeps falling but the validation loss starts rising. What is happening, and which model do you keep?", options: ["It is still learning; keep the last one", "It is memorising its training images; keep the epoch-19 model", "The validation set is broken; ignore it", "The learning rate is too small; train longer"], answer: 1, explain: "A rising validation loss while the training loss falls is overfitting. Keep the model with the lowest validation loss (early stopping), then check it once on the test set." },
  { q: "Why divide hours by 6 and attendance by 100 before training?", options: ["To save memory", "To put both features on a similar 0–1 scale so that one doesn't dominate the steps", "Because PyTorch requires it", "To make the data private"], answer: 1, explain: "Unscaled, attendance (up to 100) would swamp hours (up to 6) and gradient descent would zig-zag. Scaling keeps the steps balanced." },
  { q: "Training stops improving at 19 / 20 correct. What's the best explanation?", options: ["The code has a bug", "One student doesn't follow the pattern; no straight line can fit everyone", "The learning rate must be 0", "It needs a GPU"], answer: 1, explain: "Real data is noisy. With one neuron the boundary is a straight line, and an 'unusual' student (only 4 hours and 50% attendance, yet passed) falls on the wrong side." },
  { q: "Four grade neurons give the scores A = 2.0, B = 1.0, C = 0.1, F = −1.0. What does softmax do with them?", options: ["Keeps the biggest and sets the rest to 0", "Turns them into positive probabilities that add up to 1 (A ≈ 0.64)", "Adds them up", "Makes F's negative score an error"], answer: 1, explain: "e to each score makes them all positive; dividing by the total makes them add up to 1. A gets 7.389 ÷ 11.580 ≈ 0.64." },
];
const RESULT = {
  perfect: "Perfect! You can build and train a neural network from scratch.",
  good: "Good. Replay 'Play It' and try different learning rates.",
  low: "Revisit 'Build in Steps': predict, measure, correct is the whole story.",
  done: "Step 1 Complete! 🧠",
  body: "You know what AI really is: numbers in, multiply-adds, a loss, and gradient descent to learn the weights.",
  next: "Next up: Step 2 — Why AI Needs a GPU.",
  teaser: "Count the multiply-adds in a real model and discover why an ordinary CPU starts gasping for breath.",
};
//@@WORDS
const UNIT_WORDS = [
  ["probability", "how likely, from 0 to 1", "0 = never, 1 = certain. The probabilities of all the possible answers add up to 1.", "new here"],
  ["softmax", "scores → probabilities", "e to each score, then divide by the total. Used for 'which of many?' answers.", "new here"],
  ["temperature", "a chatbot's randomness setting", "Divides the scores before softmax: low = safe and repeatable, high = varied. (A Side Trail.)", "new here"],
  ["validation set", "the mock exam", "Labelled examples kept out of training, used to decide when to stop.", "new here"],
  ["BCE", "Binary Cross-Entropy", "The loss for YES/NO predictions. It punishes confident wrong answers hard.", "new here"],
  ["MNIST", "the handwritten-digit dataset", "60,000 training images of digits, 28 × 28 each.", "from Lesson 1.2"],
  ["CPU", "Central Processing Unit", "The main processor of a computer, the one you studied in COA.", "from COA"],
];
