import { useState } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab01_AI_Basics.ipynb";

// Study hours per day vs exam result — one deliberately "messy" pair at 3.0 h
const STUDENTS = [
  { n: "SNEHA", h: 0.5, p: 0 }, { n: "ARUN", h: 1.0, p: 0 }, { n: "ARJUN", h: 1.5, p: 0 },
  { n: "DIVYA", h: 2.0, p: 0 }, { n: "RAHUL", h: 2.5, p: 0 }, { n: "VIJAY", h: 3.0, p: 0 },
  { n: "NISHA", h: 3.0, p: 1 }, { n: "KARTHIK", h: 3.5, p: 1 }, { n: "MEENA", h: 4.0, p: 1 },
  { n: "ANU", h: 4.5, p: 1 }, { n: "PRIYA", h: 5.5, p: 1 }, { n: "LAKSHMI", h: 6.0, p: 1 },
];
const correctFor = (t) => STUDENTS.filter((s) => (s.h >= t ? 1 : 0) === s.p).length;

function Insight({ color = C.accent, title, children }) {
  return (
    <div style={{ marginTop: 16, background: color + "18", border: `1px solid ${color}44`, borderRadius: 8, padding: "12px 16px", fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
      🔑 <strong style={{ color }}>{title}</strong> {children}
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

// ── Section 1: Need — try to write rules for "is it a cat?" ──
const CAT_RULES = [
  { rule: "if it has pointy ears → cat", fail: "🦊", why: "A fox has pointy ears. Your program just called it a cat." },
  { rule: "if it has whiskers → cat", fail: "🦭", why: "A seal has whiskers too. Another wrong answer." },
  { rule: "if it has four legs and fur → cat", fail: "🐕", why: "Every dog in the world just became a cat." },
  { rule: "if it is orange and striped → cat", fail: "🐈‍⬛", why: "Now a black cat is NOT a cat. You've fixed one bug and made another." },
];
function NeedWidget() {
  const [tried, setTried] = useState([]);
  const allTried = tried.length === CAT_RULES.length;
  return (
    <div>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.7 }}>
        Programs you've written so far follow <b style={{ color: C.text }}>rules you typed in</b>. That works well for an auto fare
        (₹15 per km — one rule, always right). Now try a harder job: write rules that decide whether a photo shows a cat.
        Click each rule to test it.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: C.card, border: `1.5px solid ${C.green}44`, borderRadius: 10, padding: 16 }}>
          <div style={{ color: C.green, fontWeight: 700, fontSize: 12, marginBottom: 10 }}>✅ EASY: AUTO FARE</div>
          <pre style={{ fontFamily: "monospace", fontSize: 12, color: C.text, margin: 0, whiteSpace: "pre-wrap" }}>{`def fare(km):
    return 15 * km

fare(4)   # ₹60 — always right`}</pre>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 10 }}>You know the rule exactly, so you just write it down.</div>
        </div>
        <div style={{ background: C.card, border: `1.5px solid ${C.red}44`, borderRadius: 10, padding: 16 }}>
          <div style={{ color: C.red, fontWeight: 700, fontSize: 12, marginBottom: 10 }}>❌ HARD: IS IT A CAT? 🐈</div>
          {CAT_RULES.map((r, i) => {
            const on = tried.includes(i);
            return (
              <button key={i} onClick={() => !on && setTried((t) => [...t, i])} style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 6, padding: "7px 10px", borderRadius: 7, background: on ? C.red + "18" : C.surface, border: `1px solid ${on ? C.red : C.border}`, color: C.text, fontFamily: "monospace", fontSize: 11.5, cursor: on ? "default" : "pointer" }}>
                {r.rule}
                {on && <div style={{ fontFamily: "'Segoe UI', sans-serif", color: C.red, fontSize: 12, marginTop: 4 }}><span style={{ fontSize: 18 }}>{r.fail}</span> {r.why}</div>}
              </button>
            );
          })}
        </div>
      </div>
      {allTried && (
        <Insight color={C.purple} title="Some things are easy for you and impossible to write as rules.">
          You recognise a cat instantly, but you can't explain how in <code>if</code> statements. Nobody can. AI takes a different
          route: instead of writing the rules, show the computer thousands of labelled photos and let it <b>find the rules itself</b>.
        </Insight>
      )}
      {!allTried && <div style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>Rules tested: {tried.length} / {CAT_RULES.length}</div>}
    </div>
  );
}

// ── Section 2: Concept — flip the arrows ──
const PARTS = {
  data: { label: "Examples (data)", color: C.teal, text: "The inputs the computer learns from: photos, sensor readings, study hours. Each measurable property (hours, attendance, pixel brightness) is called a feature." },
  labels: { label: "Answers (labels)", color: C.green, text: "The correct answer for each example: 'cat' or 'not cat', PASS or FAIL. A human usually provides these, and they're what the machine learns to reproduce." },
  model: { label: "Model", color: C.accent, text: "The rule the machine builds, stored as numbers. For now, think of it as a formula with some adjustable knobs." },
  training: { label: "Training", color: C.purple, text: "Turning the knobs until the model's answers match the labels as closely as possible. This is the 'learning' in machine learning." },
  predict: { label: "Prediction", color: C.orange, text: "Using the trained model on a NEW example it has never seen, such as a new student or a new photo." },
};
function ConceptWidget() {
  const [mode, setMode] = useState("ml");
  const [part, setPart] = useState("model");
  const Box = ({ k, children }) => (
    <span onClick={() => setPart(k)} style={{ display: "inline-block", padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${PARTS[k].color}`, background: part === k ? PARTS[k].color + "22" : C.card, color: C.text, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{children}</span>
  );
  const Arrow = () => <span style={{ color: C.muted, margin: "0 8px", fontSize: 16 }}>→</span>;
  return (
    <div>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.7 }}>
        Machine learning turns ordinary programming around. Switch between the two pictures, then click each box in the
        machine-learning picture to see what it means.
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[["rules", "⚙️ Traditional programming"], ["ml", "🧠 Machine learning"]].map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)} style={{ flex: 1, padding: "8px", borderRadius: 7, border: `1px solid ${mode === k ? C.accent : C.border}`, background: mode === k ? C.accentGlow : C.card, color: "#fff", fontSize: 12.5, cursor: "pointer" }}>{l}</button>
        ))}
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, textAlign: "center", lineHeight: 2.4 }}>
        {mode === "rules" ? (
          <div>
            <span style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${C.orange}`, color: C.text, fontSize: 12.5, fontWeight: 600 }}>Rules (you write)</span>
            <span style={{ color: C.muted, margin: "0 6px" }}>+</span>
            <span style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${C.teal}`, color: C.text, fontSize: 12.5, fontWeight: 600 }}>Data</span>
            <Arrow />
            <span style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${C.green}`, color: C.text, fontSize: 12.5, fontWeight: 600 }}>Answers</span>
          </div>
        ) : (
          <div>
            <Box k="data">Examples</Box><span style={{ color: C.muted, margin: "0 6px" }}>+</span><Box k="labels">Answers</Box><Arrow /><Box k="training">Training</Box><Arrow /><Box k="model">Model (rules)</Box>
            <div style={{ marginTop: 6 }}><span style={{ color: C.muted, fontSize: 12 }}>later, on new data:</span> <Box k="model">Model</Box><Arrow /><Box k="predict">Prediction</Box></div>
          </div>
        )}
      </div>
      {mode === "ml" && (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: PARTS[part].color + "14", border: `1px solid ${PARTS[part].color}55` }}>
          <div style={{ color: PARTS[part].color, fontWeight: 700, fontSize: 13 }}>{PARTS[part].label}</div>
          <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginTop: 4 }}>{PARTS[part].text}</div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
        <div style={{ background: C.card, border: `1.5px solid ${C.orange}66`, borderRadius: 10, padding: 14 }}>
          <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, marginBottom: 8 }}>⚙️ YOU WRITE THE RULE</div>
          <pre style={{ fontFamily: "monospace", fontSize: 11.5, color: C.text, margin: 0 }}>{`if hours >= 3:
    result = "PASS"
else:
    result = "FAIL"`}</pre>
          <div style={{ color: C.muted, fontSize: 11.5, marginTop: 8 }}>Where did "3" come from? You guessed it.</div>
        </div>
        <div style={{ background: C.card, border: `1.5px solid ${C.accent}66`, borderRadius: 10, padding: 14 }}>
          <div style={{ color: C.accent, fontWeight: 700, fontSize: 12, marginBottom: 8 }}>🧠 THE MACHINE FINDS IT</div>
          <pre style={{ fontFamily: "monospace", fontSize: 11.5, color: C.text, margin: 0 }}>{`model.fit(hours, results)
model.predict([4.5])
# → "PASS"`}</pre>
          <div style={{ color: C.muted, fontSize: 11.5, marginTop: 8 }}>The "3" is learned from past students' data.</div>
        </div>
      </div>
      <Insight title="Traditional code turns rules into answers. Machine learning turns answers into rules.">
        You supply examples together with their correct answers, and training produces the model.
      </Insight>
    </div>
  );
}

// ── Section 3: Trace — the machine searches for the best threshold ──
const THRESHOLDS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
function TraceWidget() {
  const [mine, setMine] = useState(5);
  const [step, setStep] = useState(-1);
  const t = step >= 0 ? THRESHOLDS[step] : null;
  const scores = THRESHOLDS.map(correctFor);
  const bestSoFar = step >= 0 ? Math.max(...scores.slice(0, step + 1)) : null;
  const bestT = step >= 0 ? THRESHOLDS[scores.slice(0, step + 1).indexOf(bestSoFar)] : null;
  const shownT = t !== null ? t : mine;
  const X = (h) => 20 + (h / 6.5) * 640;
  return (
    <div>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 12, lineHeight: 1.7 }}>
        Here are last year's 12 students: daily study hours and whether they passed. First, drag the slider and find the
        cut-off that gets the most students right. Then press <b>Step</b> to watch the machine search.
      </p>
      <div style={{ marginBottom: 10 }}>
        <label style={{ color: C.muted, fontSize: 12 }}>Your rule: PASS if hours ≥ <strong style={{ color: C.yellow }}>{mine}</strong> → gets <strong style={{ color: C.yellow }}>{correctFor(mine)} / 12</strong> right</label>
        <input type="range" min={0.5} max={6} step={0.5} value={mine} onChange={(e) => { setMine(Number(e.target.value)); setStep(-1); }} style={{ width: "100%", accentColor: C.yellow }} />
      </div>
      <svg viewBox="0 0 680 150" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <line x1="20" y1="100" x2="660" y2="100" stroke={C.border} strokeWidth="2" />
        {[0, 1, 2, 3, 4, 5, 6].map((h) => <text key={h} x={X(h)} y="120" fill={C.muted} fontSize="11" textAnchor="middle">{h} h</text>)}
        <line x1={X(shownT)} y1="20" x2={X(shownT)} y2="108" stroke={t !== null ? C.accent : C.yellow} strokeWidth="2" strokeDasharray="5 4" />
        <text x={X(shownT) + 5} y="30" fill={t !== null ? C.accent : C.yellow} fontSize="11">cut-off {shownT}</text>
        {STUDENTS.map((s, i) => {
          const pred = s.h >= shownT ? 1 : 0, ok = pred === s.p;
          const y = s.h === 3.0 ? (s.p ? 62 : 84) : 80;
          return (
            <g key={i}>
              <circle cx={X(s.h)} cy={y} r="9" fill={s.p ? C.green : C.red} opacity="0.85" />
              {!ok && <circle cx={X(s.h)} cy={y} r="13" fill="none" stroke={C.yellow} strokeWidth="2" />}
            </g>
          );
        })}
        <text x="20" y="143" fill={C.muted} fontSize="11">● green = passed, ● red = failed, yellow ring = the rule got this student wrong</text>
      </svg>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => setStep((s) => Math.min(THRESHOLDS.length - 1, s + 1))} style={{ padding: "8px 16px", borderRadius: 8, background: C.accentGlow, border: "none", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Step ▶ ({step + 1} / {THRESHOLDS.length})</button>
        <button onClick={() => setStep(-1)} style={{ padding: "8px 16px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer" }}>↺ Reset</button>
      </div>
      {step >= 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          <div style={{ background: C.card, border: `1.5px solid ${C.teal}`, borderRadius: 8, padding: 10 }}>
            <div style={{ color: C.muted, fontSize: 11 }}>TRYING NOW</div>
            <div style={{ color: C.text, fontFamily: "monospace", fontSize: 14 }}>cut-off = {t} → {scores[step]} / 12</div>
          </div>
          <div style={{ background: C.card, border: `1.5px solid ${C.green}`, borderRadius: 8, padding: 10 }}>
            <div style={{ color: C.muted, fontSize: 11 }}>BEST SO FAR</div>
            <div style={{ color: C.green, fontFamily: "monospace", fontSize: 14 }}>cut-off = {bestT} → {bestSoFar} / 12</div>
          </div>
        </div>
      )}
      {step === THRESHOLDS.length - 1 && (
        <Insight color={C.green} title="That search through the data IS learning, in its simplest form.">
          The machine tried every candidate rule, scored each against the real answers, and kept the best: PASS if hours ≥ 3,
          11 out of 12 right (3.5 ties, but the search keeps the first best it finds). No rule gets 12 out of 12, because VIJAY and NISHA both studied 3 hours and got different results.
          Real data is messy, so a good model is the one that's right most often, not always.
        </Insight>
      )}
    </div>
  );
}

// ── Section 4: Sort the jobs — rules or learning? ──
const JOBS = [
  { job: "Calculate income tax from salary using the government's slabs", ans: "rules", why: "The slabs are written down exactly. Just code them." },
  { job: "Unlock a phone by recognising the owner's face", ans: "learn", why: "No one can write rules for a face. The phone learns it from photos." },
  { job: "Convert a temperature from °C to °F", ans: "rules", why: "F = 9/5 × C + 32. A known formula needs no learning." },
  { job: "Predict tomorrow's rainfall in Chennai", ans: "learn", why: "There are too many factors interacting. Models learn the pattern from years of weather data." },
  { job: "Check that a password has at least 8 characters", ans: "rules", why: "len(password) >= 8. That's one exact rule." },
  { job: "Translate a sentence from Tamil to English", ans: "learn", why: "Languages have far too many exceptions. Translators learn from millions of example sentences." },
  { job: "Flag spam SMS messages", ans: "learn", why: "Spammers keep changing their words. A model trained on labelled messages keeps up better than fixed rules." },
  { job: "Award grades from marks using fixed cut-offs (90+ = O, 80+ = A+ …)", ans: "rules", why: "The cut-offs are fixed and known. An if/elif chain is perfect." },
];
function SortWidget() {
  const [picks, setPicks] = useState({});
  const right = JOBS.filter((j, i) => picks[i] === j.ans).length;
  const done = Object.keys(picks).length === JOBS.length;
  return (
    <div>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 14, lineHeight: 1.7 }}>
        AI isn't the answer to everything. For each job, decide: would you <b style={{ color: C.orange }}>write the rules</b> yourself,
        or <b style={{ color: C.accent }}>learn from data</b>?
      </p>
      {JOBS.map((j, i) => {
        const p = picks[i];
        return (
          <div key={i} style={{ background: C.card, border: `1px solid ${p ? (p === j.ans ? C.green : C.red) : C.border}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220, color: C.text, fontSize: 13 }}>{j.job}</div>
              {[["rules", "⚙️ Rules", C.orange], ["learn", "🧠 Learn", C.accent]].map(([k, l, col]) => (
                <button key={k} onClick={() => p === undefined && setPicks((s) => ({ ...s, [i]: k }))} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${col}`, background: p === k ? col + "33" : "transparent", color: C.text, fontSize: 12, cursor: p === undefined ? "pointer" : "default" }}>{l}</button>
              ))}
            </div>
            {p && <div style={{ marginTop: 6, fontSize: 12, color: p === j.ans ? C.green : C.red }}>{p === j.ans ? "✓ " : "✗ "}{j.why}</div>}
          </div>
        );
      })}
      {done && (
        <Insight color={C.purple} title={`You got ${right} / ${JOBS.length}.`}>
          Use learning when the rule is unknown, too complex to write, or keeps changing. Use plain rules when you know them exactly:
          they're faster, cheaper and easier to trust.
        </Insight>
      )}
      <LabCard part="A" title="Let Python find the cut-off"
        what="Type in the same 12 students, write your own rule, then write a loop that tries every cut-off and keeps the best one: the same search you just watched."
        expect="best cut-off = 3.0, correct = 11 / 12 (3.5 ties)." />
    </div>
  );
}

// ── Quiz ──
function Quiz({ onComplete }) {
  const questions = [
    { q: "In machine learning, what does the programmer supply, and what does the computer produce?", options: ["Rules in → answers out", "Examples with correct answers in → a model (the rules) out", "Answers in → examples out", "Code in → hardware out"], answer: 1, explain: "Traditional programming turns rules into answers. Machine learning takes examples plus their answers and produces the rules, called the model." },
    { q: "Which job is the BEST fit for a hand-written rule rather than machine learning?", options: ["Recognising handwritten digits", "Detecting spam SMS", "Converting kilometres to miles", "Recognising a friend's voice"], answer: 2, explain: "miles = km × 0.621 is an exact, known formula. The others have no rule anyone can write down." },
    { q: "The machine's best rule got 11 / 12 students right, not 12 / 12. Why?", options: ["The machine made a calculation mistake", "Two students studied the same hours but got different results, so no single cut-off can be right for both", "It needed more steps", "Cut-offs only work on even numbers"], answer: 1, explain: "VIJAY and NISHA both studied 3.0 hours, but one failed and one passed. Real data is messy, so the best model is the one that's right most often." },
    { q: "A trained model is used on a student who was NOT in the training data. This step is called…", options: ["Labelling", "Training", "Prediction", "Debugging"], answer: 2, explain: "Training builds the model from known examples. Prediction uses it on new, unseen examples. That's the whole point of learning." },
  ];
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
        <div style={{ color: C.muted, marginTop: 8, marginBottom: 20 }}>
          {score === 4 ? "Perfect! You know what 'learning' means for a machine." : score >= 2 ? "Good. Replay 'Watch It Learn' to see the search once more." : "Revisit 'Flip It Around'. The reversed picture is the key idea of this unit."}
        </div>
        <div style={{ padding: 20, borderRadius: 12, background: `linear-gradient(135deg, ${C.accentGlow}22, ${C.purple}22)`, border: `1px solid ${C.accent}55` }}>
          <div style={{ color: C.accent, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>🎓 Unit 1.1 Complete!</div>
          <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
            You can tell a rules job from a learning job, and you've seen a machine learn a cut-off from data.<br /><br />
            <strong style={{ color: C.accent }}>Next up: Unit 1.2 — Everything Is Numbers.</strong> The machine only understands numbers, so how does it "see" a cat photo or "read" a sentence?
          </div>
        </div>
      </div>
    );
  }
  const q = questions[current];
  return (
    <div>
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>Question {current + 1} of {questions.length}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 15, marginBottom: 16 }}>{q.q}</div>
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

// ── Word bank ──
const UNIT_WORDS = [
  ["AI", "Artificial Intelligence", "Computers doing tasks we'd normally say need human intelligence: seeing, reading, deciding.", "new here"],
  ["ML", "Machine Learning", "The part of AI where the computer learns its rules from examples instead of being told them.", "new here"],
];
function UnitWordBank() {
  const [open, setOpen] = useState(false);
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


const TEXTBOOK = "D2L Ch 1 (Introduction: the key parts of machine learning)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";

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

export default function Unit1_1({ student, onUnitComplete }) {
  const sections = [
    { id: "need", label: "Write the Rules?" },
    { id: "concept", label: "Flip It Around" },
    { id: "trace", label: "Watch It Learn" },
    { id: "sort", label: "Rules or Learning?" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🐈 Write the Rules? — where ordinary programs get stuck</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔄 Flip It Around — what machine learning really is</h3><ConceptWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔍 Watch It Learn — the machine searches for the best rule</h3><TraceWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>⚖️ Rules or Learning? — pick the right tool</h3><SortWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 1.1.</p>
      <Quiz onComplete={() => { markComplete(4); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🧠</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 1 › UNIT 1.1</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Rules vs Learning</div>
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
