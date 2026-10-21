import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab5A_Why_GPUs_Make_AI_Fast.ipynb";

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
      <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>🧪 TRY IT FOR REAL — LAB 5A · PART {part}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{what}</div>
      <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}><b style={{ color: C.green }}>You should see:</b> {expect}</div>
      <a href={LAB_URL} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", borderRadius: 8, background: C.orange, color: "#0D1117", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Open Lab 5A in Colab ↗</a>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 8 }}>Colab opens in a new tab. Click <b>File → Save a copy in Drive</b> first, then scroll to Part {part}. Then choose <b>Runtime → Change runtime type → T4 GPU</b>.</div>
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

const TEXTBOOK = "Kirk & Hwu Ch 16 (Deep learning) · D2L Ch 13";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// ── Section 1: The Mission ──
const TOOLS = [
  ["Measure honestly: synchronise before reading the clock", "Unit 4.4"],
  ["No per-step sync points; metrics on the GPU", "Units 4.4, 4.C"],
  ["Background workers + pinned memory", "Units 4.1, 4.4"],
  ["A batch size that fills the GPU", "Unit 5.4"],
  ["Mixed precision: FP16 Tensor Cores + loss scaling", "Unit 5.2"],
  ["Keep the data on the GPU when it fits", "Units 4.1, 5.3"],
];
function MissionWidget() {
  const [ticks, setTicks] = useState([]);
  return (
    <div>
      <Frame>
        Your project team must demo a clothing classifier (<b style={{ color: C.text }}>Fashion-MNIST</b>: 60,000 grey 28 × 28 photos of shirts, shoes, bags… in 10 classes)
        tomorrow. The network is a wide version of what you built in Module 0: 784 → 1024 → 1024 → 10. The current code trains far too slowly to try ideas.
        Your target: <b style={{ color: C.green }}>at least 5× faster per epoch, with the same accuracy</b>.
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
      <Insight color={C.green} title="One rule above all: change ONE thing at a time, and measure after each change.">
        Otherwise you won't know which fix helped, which did nothing, and which quietly hurt accuracy.
      </Insight>
    </div>
  );
}

// ── Section 2: Build in Steps ──
const VERSIONS = [
  { tag: "v1", title: "Baseline + honest timer", color: C.red, why: "Start by measuring the original code correctly. This number is what every improvement is compared against.", code: `loader = DataLoader(train_data, batch_size=32, shuffle=True)
model = make_model().to("cuda")
torch.cuda.synchronize(); t0 = time.perf_counter()
for x, y in loader:
    x, y = x.to("cuda"), y.to("cuda")
    loss = loss_fn(model(x), y)
    opt.zero_grad(); loss.backward(); opt.step()
    log.append(loss.item())                        # sync every step
torch.cuda.synchronize(); print("epoch:", time.perf_counter() - t0)` },
  { tag: "v2", title: "+ feed the GPU", color: C.yellow, why: "Fix the pipeline (Module 4): background workers, pinned memory, non-blocking copies, a bigger batch, and no per-step sync. The maths is unchanged.", code: `loader = DataLoader(train_data, batch_size=256, shuffle=True,
                    num_workers=2, pin_memory=True)
running = torch.zeros((), device="cuda")
for x, y in loader:
    x = x.to("cuda", non_blocking=True); y = y.to("cuda", non_blocking=True)
    loss = loss_fn(model(x), y)
    opt.zero_grad(set_to_none=True); loss.backward(); opt.step()
    running += loss.detach()                       # stays on the GPU` },
  { tag: "v3", title: "+ Tensor Cores and data on the GPU", color: C.green, why: "Now speed up the work itself: mixed precision (Unit 5.2) and, since the whole dataset is only about 190 MB, keep it on the GPU and slice batches from it, with no loader at all.", code: `X = train_data.data.float().div(255).view(-1, 784).to("cuda")   # whole dataset, once
Y = train_data.targets.to("cuda")
scaler = torch.amp.GradScaler("cuda")
for i in torch.randperm(len(X), device="cuda").split(256):    # shuffled batches
    with torch.autocast("cuda", dtype=torch.float16):
        loss = loss_fn(model(X[i]), Y[i])
    opt.zero_grad(set_to_none=True)
    scaler.scale(loss).backward(); scaler.step(opt); scaler.update()` },
];
function BuildWidget() {
  const [v, setV] = useState(0);
  const cur = VERSIONS[v];
  return (
    <div>
      <Frame>Three versions, each built on the last.</Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {VERSIONS.map((x, i) => <Btn key={x.tag} ghost={i !== v} onClick={() => setV(i)} color={x.color}>{x.tag}: {x.title}</Btn>)}
      </div>
      <div style={{ padding: "10px 14px", borderRadius: 8, background: cur.color + "14", border: `1px solid ${cur.color}55`, color: C.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
        <b style={{ color: cur.color }}>{cur.tag}: </b>{cur.why}
      </div>
      <Code color={cur.color}>{cur.code}</Code>
      <Insight title="v2 changes how the work is fed. v3 changes how the work is done.">
        Feeding usually gives the first big win; precision and data placement give the next.
      </Insight>
    </div>
  );
}

// ── Section 3: Play It — the speed-up ladder ──
const LADDER = [
  { t: "Baseline: batch 32, item() every step, no workers", s: 24.0, acc: 82.1, why: "The starting point." },
  { t: "Remove the per-step .item() sync", s: 20.5, acc: 82.1, why: "The CPU no longer stops to wait for the GPU every step." },
  { t: "num_workers=2 + pin_memory + non_blocking", s: 13.0, acc: 82.1, why: "Batches are prepared in the background while the GPU computes." },
  { t: "Batch size 32 → 256 (learning rate scaled up)", s: 4.2, acc: 81.6, why: "8× fewer steps, so far less per-step overhead; the GPU is properly filled." },
  { t: "Mixed precision (autocast + GradScaler)", s: 3.0, acc: 81.7, why: "The big matrix multiplies run on FP16 Tensor Cores." },
  { t: "Whole dataset kept on the GPU", s: 1.3, acc: 82.4, why: "No loading, decoding or PCIe copies in the loop at all." },
];
function PlayWidget() {
  const [k, setK] = useState(0);
  const base = LADDER[0].s, maxS = base;
  return (
    <div>
      <Frame>Climb the ladder one rung at a time. Each rung adds ONE change. (Typical T4 numbers for one epoch; you'll measure your own in the lab.)</Frame>
      {LADDER.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, opacity: i <= k ? 1 : 0.35 }}>
          <div style={{ width: 22, color: i <= k ? C.green : C.muted, fontWeight: 700 }}>{i}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.text, fontSize: 12.5 }}>{r.t}</div>
            <div style={{ height: 14, background: C.card, borderRadius: 4, marginTop: 3 }}><div style={{ width: `${(r.s / maxS) * 100}%`, height: "100%", borderRadius: 4, background: i === 0 ? C.red : i === k ? C.green : C.accent }} /></div>
          </div>
          <div style={{ width: 120, textAlign: "right", fontFamily: "monospace", fontSize: 12, color: C.text }}>{r.s.toFixed(1)} s · {r.acc}%</div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <Btn onClick={() => setK((v) => Math.min(LADDER.length - 1, v + 1))} color={C.green}>Climb ▶</Btn>
        <Btn ghost onClick={() => setK(0)}>↺ Back to baseline</Btn>
      </div>
      <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8, minHeight: 20 }}>{LADDER[k].why}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
        <Stat label="EPOCH TIME" value={`${LADDER[k].s.toFixed(1)} s`} color={C.green} />
        <Stat label="SPEED-UP" value={`${(base / LADDER[k].s).toFixed(1)}×`} color={base / LADDER[k].s >= 5 ? C.green : C.yellow} />
        <Stat label="TEST ACCURACY" value={`${LADDER[k].acc}%`} color={C.purple} />
      </div>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 4 }}>After a single epoch, accuracy wobbles by a couple of percent from run to run (different shuffles); that's noise, not damage. Compare over 2–3 epochs to be sure.</div>
      <Insight color={C.green} title="About 18× faster, with the same accuracy, and the model never changed.">
        This is a normal day for an AI engineer: most speed comes from feeding the GPU properly and using its special hardware. The skills you
        built in Modules 2–5 are exactly these.
      </Insight>
    </div>
  );
}

// ── Section 4: Full code + lab ──
function CodeWidget() {
  return (
    <div>
      <Frame>The finished, fast training script. Lab 5A Part E runs the baseline and each rung of the ladder on the T4, so you'll fill in a table of your own measurements.</Frame>
      <Code color={C.green} title="🚀 fast_fashion.py">{`import torch, time
from torch import nn
from torchvision import datasets

data = datasets.FashionMNIST("data", train=True, download=True)
X = data.data.float().div(255).view(-1, 784).to("cuda")     # whole dataset on the GPU
Y = data.targets.to("cuda")

model = nn.Sequential(nn.Linear(784, 1024), nn.ReLU(),
                      nn.Linear(1024, 1024), nn.ReLU(),
                      nn.Linear(1024, 10)).to("cuda")
opt = torch.optim.SGD(model.parameters(), lr=0.2, momentum=0.9)
loss_fn = nn.CrossEntropyLoss()
scaler = torch.amp.GradScaler("cuda")

for epoch in range(5):
    torch.cuda.synchronize(); t0 = time.perf_counter()
    running = torch.zeros((), device="cuda")
    for idx in torch.randperm(len(X), device="cuda").split(256):
        with torch.autocast("cuda", dtype=torch.float16):
            loss = loss_fn(model(X[idx]), Y[idx])
        opt.zero_grad(set_to_none=True)
        scaler.scale(loss).backward(); scaler.step(opt); scaler.update()
        running += loss.detach()
    torch.cuda.synchronize()
    print(f"epoch {epoch}: {time.perf_counter() - t0:.2f} s, loss {running.item() / (len(X) // 256):.3f}")`}</Code>
      <div style={{ marginTop: 12, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        <b style={{ color: C.text }}>Challenge upgrades:</b> (1) add <code>model = torch.compile(model)</code> and measure (the first epoch is slower while it compiles);
        (2) try batch 1024 with a larger learning rate: does accuracy hold?
      </div>
      <LabCard part="E" title="Climb the ladder for real"
        what="Run the baseline, then add one change at a time (no per-step sync → workers and pinned memory → batch 256 → autocast → data on GPU), timing one epoch and checking test accuracy at each rung."
        expect="each rung faster than the last (or about the same), a total speed-up of roughly 5–20×, and test accuracy staying around 82%, give or take a few percent." />
      <Insight color={C.orange} title="First half of Module 5 done: you know why GPUs make AI fast, and how to make them go faster.">
        Second half: GPUs in real AI projects. The software stack, sizing memory, fixing 'out of memory', and many GPUs at once.
      </Insight>
    </div>
  );
}

const QUESTIONS = [
  { q: "Why change only ONE thing at a time when optimising?", options: ["It's faster to type", "So you know exactly which change caused which effect on speed and accuracy", "PyTorch requires it", "To save GPU memory"], answer: 1, explain: "Changing several things at once hides which fix helped, which did nothing, and which hurt accuracy." },
  { q: "Going from batch 32 to batch 256 gave the biggest single jump. Why?", options: ["Bigger batches skip the backward pass", "8× fewer steps means 8× less per-step overhead, and each step fills the GPU better", "It lowers the learning rate", "It uses the CPU less"], answer: 1, explain: "Fixed per-step costs (launches, Python, data handling) are paid 8× less often, and larger matrix multiplies use the SMs fully." },
  { q: "Why could the whole Fashion-MNIST dataset be kept on the GPU?", options: ["The GPU has unlimited memory", "It's only about 190 MB as floats, far less than the T4's 16 GB", "PyTorch compresses it", "It's stored on the CPU"], answer: 1, explain: "60,000 × 784 floats × 4 bytes ≈ 188 MB. It fits easily, so the loop needs no loading or copying." },
  { q: "After all the optimisations, the accuracy stayed about the same. What does that show?", options: ["The optimisations were useless", "They changed how the work is done, not what the model computes", "Accuracy can't change", "The test set was too small"], answer: 1, explain: "Feeding, batching and precision change the speed; the model and its maths stay the same (FP16 rounding barely matters, Unit 5.2)." },
];
const RESULT = {
  perfect: "Perfect! You can make real training runs fast.",
  good: "Good. Replay 'Play It' and explain each rung in your own words.",
  low: "Revisit 'Build in Steps': first feed the GPU, then speed up the work.",
  done: "Unit 5.5 Complete! 🚀",
  body: "Halfway through Module 5: you know why GPUs make AI fast (tiling, Tensor Cores, low precision, the roofline) and how to apply that to speed up real training.",
  next: "Next up: Unit 5.6 — The Software Stack.",
  teaser: "The software stack, will-it-fit memory maths, fixing 'CUDA out of memory', and training on many GPUs.",
};

const UNIT_WORDS = [
  ["Fashion-MNIST", "a clothing-image dataset", "70,000 grey 28 × 28 photos of clothes in 10 classes, the same shape as MNIST.", "new here"],
  ["momentum", "an optimiser setting", "Lets gradient descent keep some of its previous direction, so it moves faster.", "new here"],
  ["AMP", "Automatic Mixed Precision", "autocast + GradScaler (Unit 5.2).", "from Unit 5.2"],
  ["torch.compile", "PyTorch's compiler", "Fuses operations to cut memory traffic (Unit 5.3).", "from Unit 5.3"],
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

export default function Unit5_5({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "The Mission" },
    { id: "s1", label: "Build in Steps" },
    { id: "s2", label: "Play It" },
    { id: "s3", label: "Full Code & Lab" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🎯 The Mission — 5× faster by tomorrow</h3><MissionWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🪜 Build in Steps — feed it, then speed it</h3><BuildWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>▶️ Play It — the speed-up ladder</h3><PlayWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📜 Full Code — and climb the ladder for real</h3><CodeWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 5.5.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏆</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 5 › UNIT 5.5</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Capstone: Speed Up a Training Run</div>
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
