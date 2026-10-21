//@@META
{"unit": "2.1", "module": 2, "title": "Counting the Multiply-Adds", "icon": "🧮", "lab": "Lab02_AI_Is_Hungry.ipynb", "labNo": 2}
//@@WIDGETS

const fmt = (x) => {
  if (x < 1e3) return x.toFixed(0);
  const u = [["", 1], ["thousand", 1e3], ["million", 1e6], ["billion", 1e9], ["trillion", 1e12], ["quadrillion", 1e15], ["quintillion", 1e18], ["sextillion", 1e21]];
  let k = 0; while (k < u.length - 1 && x >= u[k + 1][1]) k++;
  return `${(x / u[k][1]).toFixed(x / u[k][1] < 10 ? 1 : 0)} ${u[k][0]}`;
};

// ── Section 1: Need — guess the work ──
const TASKS = [
  { t: "Read ONE handwritten digit (your Lab 1 network)", macs: 1.0e5, note: "784×128 + 128×10 ≈ 1 lakh MACs." },
  { t: "Recognise ONE photo with ResNet-50 (a classic image model)", macs: 4.1e9, note: "About 4 billion MACs for a single 224 × 224 photo (approximate published figure)." },
  { t: "Generate ONE word (token) with a GPT-3-sized chatbot (175 billion parameters)", macs: 1.75e11, note: "Roughly one MAC per parameter for every token: about 175 billion." },
  { t: "TRAIN GPT-3 once, from scratch", macs: 1.6e23, note: "About 3 × 10²³ arithmetic operations (≈ 1.6 × 10²³ MACs), a published estimate." },
];
const GUESSES = [1e3, 1e6, 1e9, 1e12, 1e15, 1e18, 1e21, 1e24];
function NeedWidget() {
  const [g, setG] = useState({});
  return (
    <div>
      <Frame>
        Every AI answer is multiply-adds (MACs, from Unit 1.3). But how many? Guess the order of magnitude for each job, then check.
        Most people are off by a factor of a million.
      </Frame>
      {TASKS.map((x, i) => {
        const pick = g[i];
        const closest = GUESSES.reduce((a, b) => (Math.abs(Math.log10(b / x.macs)) < Math.abs(Math.log10(a / x.macs)) ? b : a));
        return (
          <div key={i} style={{ background: C.card, border: `1px solid ${pick ? (pick === closest ? C.green : C.yellow) : C.border}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
            <div style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{x.t}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {GUESSES.map((v) => (
                <button key={v} onClick={() => !pick && setG((s) => ({ ...s, [i]: v }))} style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11.5, fontFamily: "monospace", cursor: pick ? "default" : "pointer", border: `1px solid ${pick && v === closest ? C.green : pick === v ? C.yellow : C.border}`, background: pick && v === closest ? C.green + "22" : pick === v ? C.yellow + "22" : C.surface, color: C.text }}>10^{Math.log10(v)}</button>
              ))}
            </div>
            {pick && <div style={{ marginTop: 8, fontSize: 12.5, color: C.muted }}><b style={{ color: C.green }}>≈ {fmt(x.macs)} MACs.</b> {x.note} {pick !== closest && <span style={{ color: C.yellow }}>You were off by about 10^{Math.abs(Math.round(Math.log10(pick / x.macs)))}.</span>}</div>}
          </div>
        );
      })}
      {Object.keys(g).length === TASKS.length && (
        <Insight color={C.orange} title="From 1 lakh to 10²³: AI's appetite spans 18 powers of ten.">
          A digit is easy for anything. A chatbot word needs hundreds of billions of operations, and training one needs more operations than
          there are grains of sand on Earth (about 10¹⁹). This unit gives you the tools to count it yourself.
        </Insight>
      )}
    </div>
  );
}

// ── Section 2: FLOPs vs FLOPS ──
const PREFIX = [["kilo (K)", 3, "thousand"], ["mega (M)", 6, "million / 10 lakh"], ["giga (G)", 9, "billion / 100 crore"], ["tera (T)", 12, "trillion / 1 lakh crore"], ["peta (P)", 15, "quadrillion"], ["exa (E)", 18, "quintillion"]];
function FlopsWidget() {
  const [which, setWhich] = useState("ops");
  const [p, setP] = useState(3);
  return (
    <div>
      <Frame>
        Engineers count AI work in <b style={{ color: C.text }}>floating-point operations</b>: one multiply OR one add on decimal numbers.
        One MAC = <b style={{ color: C.accent }}>2 FLOPs</b>. Watch out for two words that look almost the same:
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Btn ghost={which !== "ops"} onClick={() => setWhich("ops")}>FLOPs (small s)</Btn>
        <Btn ghost={which !== "rate"} onClick={() => setWhich("rate")} color={C.purple}>FLOPS (capital S)</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `1.5px solid ${which === "ops" ? C.accent : C.border}`, opacity: which === "ops" ? 1 : 0.5 }}>
          <div style={{ color: C.accent, fontWeight: 700, fontSize: 13 }}>FLOPs = an amount of WORK</div>
          <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.7, marginTop: 4 }}>"This model needs 8 GFLOPs per photo." Like a distance: <b>how far</b> you must travel. It's a property of the job.</div>
        </div>
        <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `1.5px solid ${which === "rate" ? C.purple : C.border}`, opacity: which === "rate" ? 1 : 0.5 }}>
          <div style={{ color: C.purple, fontWeight: 700, fontSize: 13 }}>FLOPS = FLOPs per SECOND, a SPEED</div>
          <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.7, marginTop: 4 }}>"This GPU does 65 TFLOPS." Like km/h: <b>how fast</b> you can travel. It's a property of the hardware.</div>
        </div>
      </div>
      <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: C.yellow + "14", border: `1px solid ${C.yellow}55`, fontFamily: "monospace", fontSize: 13, color: C.text }}>
        time (seconds) = work (FLOPs) ÷ speed (FLOPS)     ← like  time = distance ÷ speed
      </div>
      <div style={{ marginTop: 16, background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>The prefixes you'll meet</div>
        <Slider label={<>prefix: <b style={{ color: C.accent }}>{PREFIX[p][0]}</b></>} value={p} min={0} max={5} onChange={setP} />
        <div style={{ fontFamily: "monospace", fontSize: 14, color: C.teal }}>1 {PREFIX[p][0].split(" ")[0]}FLOP = 10^{PREFIX[p][1]} = 1{"0".repeat(PREFIX[p][1])}</div>
        <div style={{ color: C.muted, fontSize: 12.5, marginTop: 4 }}>= one {PREFIX[p][2]}</div>
      </div>
      <Insight title="Work ÷ speed = time. Every 'how long will it take?' question in this course is this one division.">
        Count the FLOPs of the job, look up the FLOPS of the chip, divide. The rest of the course is about making that division come out small.
      </Insight>
    </div>
  );
}

// ── Section 3: Count a model's work ──
function CountWidget() {
  const [params, setParams] = useState(7);
  const [words, setWords] = useState(500);
  const P = params * 1e9;
  const perTok = 2 * P;
  const tokens = Math.round(words * 1.3);
  return (
    <div>
      <Frame>
        For a chatbot (a language model) there is a handy rule: generating <b style={{ color: C.text }}>one token costs about 2 FLOPs per parameter</b>,
        because every weight is used in one multiply-add. A token is roughly ¾ of a word. Pick a model size and an answer length.
      </Frame>
      <Slider label={<>Model size = <b style={{ color: C.accent }}>{params} billion</b> parameters {params === 7 ? "(a small open model you can run yourself)" : params >= 175 ? "(GPT-3 class)" : ""}</>} value={params} min={1} max={400} onChange={setParams} />
      <Slider label={<>Answer length = <b style={{ color: C.purple }}>{words}</b> words ≈ {tokens} tokens</>} value={words} min={10} max={3000} step={10} onChange={setWords} color={C.purple} />
      <div style={{ fontFamily: "monospace", fontSize: 13, color: C.text, lineHeight: 2, background: C.card, borderRadius: 10, padding: 12, border: `1px solid ${C.border}` }}>
        <div>FLOPs per token = 2 × {params} billion = <b style={{ color: C.accent }}>{fmt(perTok)}</b></div>
        <div>FLOPs for the answer = {fmt(perTok)} × {tokens} = <b style={{ color: C.orange }}>{fmt(perTok * tokens)}</b></div>
      </div>
      <Insight color={C.orange} title="One chatbot answer can easily be 10¹⁵ FLOPs, a quadrillion operations.">
        And a popular chatbot answers crores of questions a day. That's why AI companies buy chips by the lakh.
      </Insight>
    </div>
  );
}

// ── Section 4: How long on which machine? ──
const DEVICES = [
  { d: "You, with pen and paper", f: 0.1, tag: "1 operation every 10 s" },
  { d: "A single CPU core, plain Python loops", f: 3e7, tag: "≈ 30 MFLOPS (measured in Lab 2)" },
  { d: "A laptop CPU, all cores, NumPy", f: 2e11, tag: "≈ 0.2 TFLOPS (approx.)" },
  { d: "NVIDIA T4 GPU (free Colab), FP32", f: 8.1e12, tag: "8.1 TFLOPS peak" },
  { d: "NVIDIA T4 GPU, FP16 Tensor Cores", f: 6.5e13, tag: "65 TFLOPS peak" },
  { d: "NVIDIA H100 GPU, FP16 Tensor Cores", f: 9.9e14, tag: "≈ 990 TFLOPS peak" },
];
const JOBS = [
  { j: "Classify 10,000 digits (Lab 1 network)", f: 2 * 1e5 * 1e4 },
  { j: "Recognise 1,000 photos (ResNet-50)", f: 2 * 4.1e9 * 1e3 },
  { j: "A 500-word chatbot answer (7 B model)", f: 2 * 7e9 * 650 },
  { j: "Train GPT-3 once", f: 3.14e23 },
];
const human = (s) => s < 1e-3 ? `${(s * 1e6).toFixed(0)} µs` : s < 1 ? `${(s * 1e3).toFixed(0)} ms` : s < 120 ? `${s.toFixed(1)} s` : s < 7200 ? `${(s / 60).toFixed(0)} min` : s < 172800 ? `${(s / 3600).toFixed(0)} hours` : s < 3.15e7 * 2 ? `${(s / 86400).toFixed(0)} days` : `${fmt(s / 3.15e7)} years`;
function DeviceWidget() {
  const [j, setJ] = useState(2);
  return (
    <div>
      <Frame>
        Now do the division: <b style={{ color: C.text }}>time = FLOPs ÷ FLOPS</b>. Pick a job and compare machines. Speeds are approximate
        peak figures; real programs usually reach only a fraction of the peak.
      </Frame>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {JOBS.map((x, i) => <Btn key={i} ghost={i !== j} onClick={() => setJ(i)} color={C.orange}>{x.j}</Btn>)}
      </div>
      <div style={{ color: C.muted, fontSize: 12.5, marginBottom: 8 }}>Work: <b style={{ color: C.orange }}>{fmt(JOBS[j].f)} FLOPs</b></div>
      {DEVICES.map((d) => {
        const t = JOBS[j].f / d.f;
        const w = Math.max(2, Math.min(100, (Math.log10(t) + 6) * 6));
        return (
          <div key={d.d} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
              <span style={{ color: C.text }}>{d.d} <span style={{ color: C.muted }}>({d.tag})</span></span>
              <span style={{ color: t > 3600 ? C.red : t > 1 ? C.yellow : C.green, fontFamily: "monospace", fontWeight: 700 }}>{human(t)}</span>
            </div>
            <div style={{ height: 8, background: C.card, borderRadius: 4 }}><div style={{ width: `${w}%`, height: "100%", borderRadius: 4, background: t > 3600 ? C.red : t > 1 ? C.yellow : C.green }} /></div>
          </div>
        );
      })}
      <div style={{ color: C.muted, fontSize: 11.5 }}>Bar length is on a log scale: each step right = 10× longer.</div>
      <Insight color={C.green} title="Same job, same maths, from days to milliseconds, purely by changing the machine.">
        Notice the jumps: plain Python → NumPy → GPU → GPU Tensor Cores. Each is a different way of doing many multiply-adds at once.
        Modules 3–6 explain each jump.
      </Insight>
      <LabCard part="A" title="Count parameters and FLOPs of real models"
        what="Count the parameters of your Lab 1 network and of ResNet-18 using PyTorch, then estimate FLOPs per input with the 2 × MACs rule and the time it needs at your measured speed."
        expect="about 1 lakh parameters for the Lab 1 network and about 1.17 crore (11.7 million) for ResNet-18." />
    </div>
  );
}
//@@SECTIONS
[["Guess the Work", "🤔 Guess the Work — how many multiply-adds?", "NeedWidget"],
 ["FLOPs vs FLOPS", "📏 FLOPs vs FLOPS — work vs speed", "FlopsWidget"],
 ["Count a Chatbot", "💬 Count a Chatbot — 2 FLOPs per parameter per token", "CountWidget"],
 ["How Long?", "⏱️ How Long? — time = work ÷ speed", "DeviceWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "A layer does 5 million multiply-accumulates (MACs). How many FLOPs is that?", options: ["2.5 million", "5 million", "10 million", "25 million"], answer: 2, explain: "Each MAC is one multiply plus one add, so 2 FLOPs. 5 million MACs = 10 million FLOPs." },
  { q: "'This GPU reaches 65 TFLOPS.' What does that number describe?", options: ["How much memory it has", "How much work a model needs", "How many floating-point operations it can do per second", "How many cores it has"], answer: 2, explain: "FLOPS with a capital S is a speed: operations per second. FLOPs (small s) is an amount of work." },
  { q: "A job needs 10¹² FLOPs. A machine delivers 10¹¹ FLOPS. Roughly how long does it take?", options: ["0.1 s", "1 s", "10 s", "100 s"], answer: 2, explain: "time = work ÷ speed = 10¹² ÷ 10¹¹ = 10 seconds." },
  { q: "Using '2 FLOPs per parameter per token', a 10-billion-parameter model generating 100 tokens needs about…", options: ["2 × 10¹⁰ FLOPs", "2 × 10¹² FLOPs", "10¹¹ FLOPs", "2 × 10⁹ FLOPs"], answer: 1, explain: "2 × 10¹⁰ FLOPs per token × 100 tokens = 2 × 10¹² FLOPs." },
];
const RESULT = {
  perfect: "Perfect! You can estimate the cost of any AI job.",
  good: "Good. Replay 'FLOPs vs FLOPS'; the s matters.",
  low: "Revisit 'FLOPs vs FLOPS' and 'How Long?': work ÷ speed = time is the key tool.",
  done: "Unit 2.1 Complete!",
  body: "You can count multiply-adds, convert to FLOPs, and estimate run time on any machine.",
  next: "Next up: Unit 2.2 — Training vs Inference, Epochs & Batches.",
  teaser: "Using a model is cheap. Teaching it is a lot more expensive. Find out exactly why.",
};
//@@WORDS
const UNIT_WORDS = [
  ["MAC", "Multiply-Accumulate", "One multiply + one add = 2 FLOPs.", "from Unit 1.3"],
  ["FLOP", "FLoating-point OPeration", "One add or one multiply on decimal (floating-point) numbers. FLOPs = an amount of work.", "new here"],
  ["FLOPS", "FLoating-point Operations Per Second", "A speed: how many FLOPs a chip can do each second.", "new here"],
  ["TFLOPS", "tera-FLOPS", "10¹² FLOPs per second, a lakh crore every second.", "new here"],
  ["GPT", "Generative Pre-trained Transformer", "The family of language models behind ChatGPT.", "new here"],
  ["FP32 / FP16", "32-bit / 16-bit floating point", "Number formats with more or fewer bits (IEEE 754, from COA). Unit 6.2 explains why fewer bits run faster.", "from COA"],
];
