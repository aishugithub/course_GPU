import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab05_CPU_GPU_Teamwork.ipynb";

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
      <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>🧪 TRY IT FOR REAL — LAB 5 · PART {part}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{what}</div>
      <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}><b style={{ color: C.green }}>You should see:</b> {expect}</div>
      <a href={LAB_URL} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", borderRadius: 8, background: C.orange, color: "#0D1117", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Open Lab 5 in Colab ↗</a>
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

const TEXTBOOK = "Kirk & Hwu Ch 2 · Hamacher §12.2.1";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// Illustrative per-epoch model for a small image classifier on a T4 (50,000 small colour images).
function epochModel(f) {
  const N = 50000, B = f.bigBatch ? 256 : 16;
  const iters = Math.ceil(N / B);
  const prep = f.onGpu ? 0.02 : 0.1 * B;                         // ms of CPU work to prepare a batch
  const prepEff = f.onGpu ? prep : f.workers ? prep / 2 : prep;  // 2 background workers on Colab
  const copy = f.onGpu ? 0 : (B * 12288) / (f.pinned ? 12e6 : 6e6); // ms over PCIe (bytes ÷ bytes-per-ms)
  const metric = f.metricsGpu ? 0 : 1.0;                         // ms: .cpu().numpy() + scikit-learn accuracy every step
  const gpu = 0.3 + 0.02 * B;                                    // ms: launch overheads + real work
  const canOverlap = f.workers && !f.itemEveryStep && f.metricsGpu && !f.onGpu ? true : false;
  const gpuSide = gpu + (f.pinned && canOverlap ? 0 : copy);
  const step = canOverlap ? Math.max(prepEff, gpuSide) : prepEff + copy + metric + gpu + (f.itemEveryStep ? 0.05 : 0);
  const total = (iters * step) / 1000;
  return { B, iters, step, total, util: (iters * gpu) / 1000 / total, prep: prepEff, copy, metric, gpu };
}

// ── Section 1: The Mission ──
const CLUES = [
  ["The five steps: copies cross the slow PCIe bus", "Units 5.1, 5.2"],
  ["Small jobs waste time on launch overhead", "Units 3.1, 4.C"],
  ["Overlap CPU prep with GPU work; avoid sync points", "Unit 5.4"],
  ["The slowest part sets the ceiling (Amdahl)", "Unit 3.4"],
  ["Measure with synchronisation, or with a profiler", "Unit 5.4"],
];
function MissionWidget() {
  const [ticks, setTicks] = useState([]);
  return (
    <div>
      <Frame>
        A final-year team trains an image classifier on Colab's T4. "The GPU is useless," they say. "nvidia-smi shows it busy only about a fifth
        of the time." You're the GPU detective. Your clues:
      </Frame>
      {CLUES.map(([t, u], i) => {
        const on = ticks.includes(i);
        return (
          <div key={i} onClick={() => setTicks((s) => (on ? s.filter((x) => x !== i) : [...s, i]))} style={{ display: "flex", gap: 10, alignItems: "center", background: C.card, border: `1.5px solid ${on ? C.green : C.border}`, borderRadius: 8, padding: "9px 12px", marginBottom: 7, cursor: "pointer" }}>
            <span style={{ fontSize: 16 }}>{on ? "✅" : "⬜"}</span>
            <span style={{ flex: 1, color: C.text, fontSize: 13 }}>{t}</span>
            <span style={{ color: C.accent, fontSize: 12, fontFamily: "monospace" }}>{u}</span>
          </div>
        );
      })}
      <Code color={C.red} title="🐌 THE TEAM'S TRAINING LOOP">{`loader = DataLoader(train_data, batch_size=16, shuffle=True)   # num_workers=0
for images, labels in loader:
    images, labels = images.to("cuda"), labels.to("cuda")
    scores = model(images)
    loss = loss_fn(scores, labels)
    opt.zero_grad(); loss.backward(); opt.step()
    acc = accuracy_score(labels.cpu().numpy(),             # copy out + sync,
                         scores.argmax(1).cpu().numpy())   # every step
    print("loss:", loss.item(), "acc:", acc)               # sync, every step`}</Code>
      <Insight color={C.yellow} title="A GPU that's busy only a fifth of the time isn't slow. It's starving.">
        The GPU is waiting on the CPU, the PCIe bus and Python. Find every culprit in this loop before reading on.
      </Insight>
    </div>
  );
}

// ── Section 2: Build in Steps — how to measure ──
const VERSIONS = [
  { tag: "v1", title: "Time the epoch (correctly)", color: C.teal, why: "First get one honest number. Synchronise before stopping the clock, otherwise queued GPU work is missed (Unit 5.4).", code: `torch.cuda.synchronize(); t0 = time.perf_counter()
train_one_epoch()
torch.cuda.synchronize(); print(f"epoch: {time.perf_counter() - t0:.1f} s")` },
  { tag: "v2", title: "+ time each phase", color: C.yellow, why: "Split the step into waiting for data, copying, and computing. Synchronising after each phase makes the split honest (though a little slower overall).", code: `phase = {"data": 0, "copy": 0, "compute": 0}
t = time.perf_counter()
for images, labels in loader:
    now = time.perf_counter(); phase["data"] += now - t; t = now
    images, labels = images.to("cuda"), labels.to("cuda"); torch.cuda.synchronize()
    now = time.perf_counter(); phase["copy"] += now - t; t = now
    loss = loss_fn(model(images), labels); opt.zero_grad(); loss.backward(); opt.step()
    torch.cuda.synchronize()
    now = time.perf_counter(); phase["compute"] += now - t; t = now
print(phase)` },
  { tag: "v3", title: "+ the PyTorch profiler", color: C.green, why: "The profiler records every CPU operation and GPU kernel with exact timings. It's the professional tool.", code: `from torch.profiler import profile, ProfilerActivity
with profile(activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA]) as prof:
    train_some_steps(20)
print(prof.key_averages().table(sort_by="cuda_time_total", row_limit=10))` },
];
function BuildWidget() {
  const [v, setV] = useState(0);
  const cur = VERSIONS[v];
  return (
    <div>
      <Frame>A detective needs evidence. Grow your measurement tools one idea at a time.</Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {VERSIONS.map((x, i) => <Btn key={x.tag} ghost={i !== v} onClick={() => setV(i)} color={x.color}>{x.tag}: {x.title}</Btn>)}
      </div>
      <div style={{ padding: "10px 14px", borderRadius: 8, background: cur.color + "14", border: `1px solid ${cur.color}55`, color: C.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
        <b style={{ color: cur.color }}>{cur.tag}: </b>{cur.why}
      </div>
      <Code color={cur.color}>{cur.code}</Code>
      <Insight title="Measure first, then fix. Guessing at performance problems usually fixes the wrong thing.">
        Every fix in the next section comes from a measurement like these.
      </Insight>
    </div>
  );
}

// ── Section 3: Play It — fix the pipeline ──
const FIXES = [
  ["metricsGpu", "Compute accuracy on the GPU: (scores.argmax(1) == labels).sum()", "Instead of .cpu().numpy() + scikit-learn every step: no copy out, no sync, no slow Python."],
  ["itemEveryStep", "Call loss.item() every step", "A sync point each step blocks all overlap (keep it ticked to see the damage)."],
  ["workers", "DataLoader(num_workers=2)", "Two CPU worker processes prepare batches in the background."],
  ["pinned", "pin_memory=True + .to('cuda', non_blocking=True)", "Faster copies that can overlap with GPU work."],
  ["bigBatch", "Batch size 256 instead of 16", "Fewer, bigger kernels: less launch overhead per image."],
  ["onGpu", "Keep the whole (small) dataset on the GPU", "Load it once (600 MB fits in 16 GB); no per-step loading or copying."],
];
function PlayWidget() {
  const [f, setF] = useState({ metricsGpu: false, itemEveryStep: true, workers: false, pinned: false, bigBatch: false, onGpu: false });
  const m = epochModel(f);
  const base = epochModel({ metricsGpu: false, itemEveryStep: true, workers: false, pinned: false, bigBatch: false, onGpu: false });
  const parts = [["CPU prep", m.prep, C.orange], ["copy batch", m.copy, C.yellow], ["CPU metrics", m.metric, C.red], ["GPU compute", m.gpu, C.green]];
  const sum = parts.reduce((s, p) => s + p[1], 0);
  return (
    <div>
      <Frame>Switch fixes on and off and watch the epoch time and the GPU's busy share. (Illustrative model with T4-like numbers.) Can you get the GPU above 90% busy?</Frame>
      {FIXES.map(([k, t, d]) => (
        <label key={k} style={{ display: "block", background: C.card, border: `1px solid ${f[k] ? (k === "itemEveryStep" ? C.red : C.green) : C.border}`, borderRadius: 8, padding: "7px 10px", marginBottom: 5, cursor: "pointer" }}>
          <input type="checkbox" checked={f[k]} onChange={(e) => setF((s) => ({ ...s, [k]: e.target.checked }))} /> <span style={{ color: C.text, fontSize: 13, fontFamily: "monospace" }}>{t}</span>
          <div style={{ color: C.muted, fontSize: 11.5, marginLeft: 20 }}>{d}</div>
        </label>
      ))}
      <div style={{ color: C.muted, fontSize: 12, margin: "10px 0 4px" }}>One step, broken into its parts (ms):</div>
      <div style={{ display: "flex", height: 28, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
        {parts.map(([t, v, c]) => <div key={t} title={`${t}: ${v.toFixed(2)} ms`} style={{ width: `${(v / sum) * 100}%`, background: c, fontSize: 10, color: "#0D1117", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", whiteSpace: "nowrap" }}>{v / sum > 0.14 ? t : ""}</div>)}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="EPOCH TIME" value={`${m.total.toFixed(1)} s`} color={m.total < base.total / 5 ? C.green : C.yellow} />
        <Stat label="SPEED-UP vs THE TEAM'S CODE" value={`${(base.total / m.total).toFixed(1)}×`} color={C.purple} />
        <Stat label="GPU BUSY" value={`${Math.min(100, m.util * 100).toFixed(0)}%`} color={m.util > 0.9 ? C.green : m.util > 0.4 ? C.yellow : C.red} />
      </div>
      <Insight color={C.green} title="The GPU's computing hardly changed. Everything around it did.">
        The biggest wins are usually not about the GPU at all: stop needless copies out, overlap the CPU's work, remove sync points, and
        keep the data close. That's the real skill of GPU engineering for AI.
      </Insight>
    </div>
  );
}

// ── Section 4: Full code + lab ──
function CodeWidget() {
  return (
    <div>
      <Frame>The fixed training loop, every lesson of Module 5 applied. In Lab 5 Part E you'll profile the slow and fast versions for real on the T4.</Frame>
      <Code color={C.green} title="🚀 fast_training_loop.py">{`loader = DataLoader(train_data, batch_size=256, shuffle=True,
                    num_workers=2, pin_memory=True)        # overlap + fast copies
model = model.to("cuda")

for epoch in range(epochs):
    running = torch.zeros((), device="cuda")               # accumulate ON the GPU
    correct = torch.zeros((), device="cuda")
    for images, labels in loader:
        images = images.to("cuda", non_blocking=True)
        labels = labels.to("cuda", non_blocking=True)
        scores = model(images)
        loss = loss_fn(scores, labels)
        opt.zero_grad(set_to_none=True); loss.backward(); opt.step()
        running += loss.detach()                           # no sync here
        correct += (scores.argmax(1) == labels).sum()      # accuracy on the GPU
    print(f"epoch {epoch}: loss {running.item() / len(loader):.3f}, "
          f"acc {correct.item() / len(train_data):.1%}")    # syncs once per epoch`}</Code>
      <div style={{ marginTop: 12, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        <b style={{ color: C.text }}>Challenge upgrades:</b> (1) load the whole dataset onto the GPU as one tensor and slice batches from it; (2) watch
        <code> !nvidia-smi</code> in a second cell while training to see the GPU's busy % rise.
      </div>
      <LabCard part="E" title="Profile the slow loop and the fast loop"
        what="Run the team's slow loop and the fixed loop on MNIST for one epoch each, time them correctly, and print the PyTorch profiler table for 20 steps of each."
        expect="the fixed loop several times faster, with the profiler showing far fewer memory copies and much less time where the CPU waits." />
      <Insight color={C.orange} title="Module 5 complete: you understand the whole CPU–GPU partnership.">
        Next: why GPUs are so astonishingly good at AI specifically. Tiling, Tensor Cores, low precision and the roofline.
      </Insight>
    </div>
  );
}

const QUESTIONS = [
  { q: "Why is computing accuracy with labels.cpu().numpy() and scikit-learn at every step slow?", options: ["scikit-learn gives wrong answers", "It copies data out of the GPU and forces a sync every step, then runs slow Python code", "It deletes the gradients", "It's not slow"], answer: 1, explain: "Each step: copy out + wait for the GPU + Python work. Computing (scores.argmax(1) == labels).sum() on the GPU and reading it once per epoch avoids all three." },
  { q: "nvidia-smi shows the GPU only 10% busy during training. The most likely problem is…", options: ["The GPU is too slow", "The GPU is starved: data loading, copies or sync points keep it waiting", "Too many SMs", "The learning rate"], answer: 1, explain: "Low utilisation means the GPU is waiting. Feed it better: workers, pinned memory, bigger batches, fewer sync points." },
  { q: "Which change lets CPU data preparation overlap with GPU training?", options: ["batch_size=1", "DataLoader(num_workers=2) with no per-step .item()", "Calling torch.cuda.synchronize() every step", "Moving the model inside the loop"], answer: 1, explain: "Background workers prepare the next batch while the GPU works, as long as no sync point forces the CPU to wait each step." },
  { q: "Why does a bigger batch (256 vs 16) speed up an epoch on a GPU?", options: ["Fewer images to process", "Fewer, larger kernel launches, so less overhead per image and better use of the SMs", "It uses less memory", "It skips the backward pass"], answer: 1, explain: "Each step has fixed launch costs; bigger batches spread them over more images and give the GPU enough threads (Unit 4.C)." },
];
const RESULT = {
  perfect: "Perfect! You're a qualified GPU detective.",
  good: "Good. Replay 'Play It' and get the GPU above 90%.",
  low: "Revisit 'Build in Steps': measure honestly, then fix the biggest cost first.",
  done: "Module 5 Complete! 🤝",
  body: "You know the whole CPU–GPU partnership: host and device, the five steps, kernels and grids, async queues, and how to profile and fix a pipeline.",
  next: "Next up: Module 6 — Why GPUs Make AI Fast.",
  teaser: "Tiling, Tensor Cores, FP16 and the roofline: the tricks that make a GPU hundreds of times faster at AI.",
};

const UNIT_WORDS = [
  ["profiler", "a performance-measuring tool", "Records how long every operation and kernel takes.", "new here"],
  ["utilisation", "busy share", "The percentage of time the GPU is actually computing.", "new here"],
  ["pin_memory", "page-locked memory option", "Makes host-to-GPU copies faster and able to overlap (Unit 5.1).", "from Unit 5.1"],
  ["sync", "synchronisation", "The CPU waiting for the GPU (Unit 5.4).", "from Unit 5.4"],
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

export default function Unit5_C({ student, onUnitComplete }) {
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
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🎯 The Mission — the case of the starving GPU</h3><MissionWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🪜 Build in Steps — measure before you fix</h3><BuildWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>▶️ Play It — fix the pipeline</h3><PlayWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>📜 Full Code — and profile it for real</h3><CodeWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 5.C.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏆</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 5 › UNIT 5.C</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Capstone: Where Did the Time Go?</div>
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
