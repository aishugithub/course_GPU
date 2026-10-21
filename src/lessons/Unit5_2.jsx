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

const TEXTBOOK = "Hamacher Ch 9 (Floating-point numbers) · Stallings Ch 10 (Computer arithmetic) · Kirk & Hwu Ch 16";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// Round x to a binary float with `mbits` mantissa bits, minimum normal exponent `minExp`, and largest finite value `maxVal`
function toFloat(x, mbits, minExp, maxVal) {
  if (x === 0 || !isFinite(x)) return x;
  const a = Math.abs(x);
  let e = Math.floor(Math.log2(a));
  if (e < minExp) e = minExp;                  // subnormal range: fixed spacing
  const step = Math.pow(2, e - mbits);
  let r = Math.round(a / step) * step;
  if (r > maxVal) return x > 0 ? Infinity : -Infinity;
  return x < 0 ? -r : r;
}
const FMT = {
  fp32: { name: "FP32", bits: [1, 8, 23], f: (x) => Math.fround(x), bytes: 4, c: C.accent },
  fp16: { name: "FP16", bits: [1, 5, 10], f: (x) => toFloat(x, 10, -14, 65504), bytes: 2, c: C.green },
  bf16: { name: "BF16", bits: [1, 8, 7], f: (x) => toFloat(x, 7, -126, 3.39e38), bytes: 2, c: C.purple },
};

// ── Section 1: Need — will the model even fit? ──
function NeedWidget() {
  const [params, setParams] = useState(7);
  const rows = [["FP32", 4, C.accent], ["FP16 / BF16", 2, C.green], ["INT8", 1, C.orange], ["INT4", 0.5, C.red]];
  return (
    <div>
      <Frame>
        Every parameter is stored as a number with some number of bits. Fewer bits per number = less memory. Will a model's weights fit in the
        T4's <b style={{ color: C.text }}>16 GB</b>? (Weights only; training needs several times more, Unit 5.7.)
      </Frame>
      <Slider label={<>Model size = <b style={{ color: C.accent }}>{params} billion</b> parameters</>} value={params} min={1} max={70} onChange={setParams} />
      {rows.map(([n, b, c]) => {
        const gb = params * b;
        return (
          <div key={n} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
              <span style={{ color: C.text }}>{n} <span style={{ color: C.muted }}>({b * 8} bits = {b} byte{b === 1 ? "" : "s"} per number)</span></span>
              <span style={{ fontFamily: "monospace", color: gb <= 16 ? C.green : C.red }}>{gb.toFixed(1)} GB {gb <= 16 ? "✓ fits" : "✗ too big"}</span>
            </div>
            <div style={{ position: "relative", height: 12, background: C.card, borderRadius: 4 }}>
              <div style={{ width: `${Math.min(100, (gb / 140) * 100)}%`, height: "100%", background: c, borderRadius: 4 }} />
              <div style={{ position: "absolute", left: `${(16 / 140) * 100}%`, top: -3, bottom: -3, width: 2, background: C.yellow }} />
            </div>
          </div>
        );
      })}
      <div style={{ color: C.yellow, fontSize: 11.5 }}>│ yellow line = the T4's 16 GB</div>
      <Insight color={C.green} title="Halving the bits halves the memory, and as you'll see, roughly doubles the speed.">
        A 7-billion-parameter model doesn't fit on a T4 in FP32 (28 GB) but does in FP16 (14 GB) or INT8 (7 GB). The question is whether the
        model still works with less exact numbers.
      </Insight>
    </div>
  );
}

// ── Section 2: The formats (from COA's IEEE 754) ──
function FormatWidget() {
  const [txt, setTxt] = useState("3.14159265");
  const x = Number(txt);
  const valid = txt.trim() !== "" && isFinite(x);
  return (
    <div>
      <Frame>
        You met IEEE 754 floating point in COA: <b style={{ color: C.text }}>sign · exponent · mantissa</b>. The exponent bits decide the <b style={{ color: C.text }}>range</b>
        (how big or small), the mantissa bits the <b style={{ color: C.text }}>precision</b> (how many digits). Type a number and see how each format stores it.
      </Frame>
      {Object.values(FMT).map((f) => (
        <div key={f.name} style={{ display: "flex", gap: 2, height: 20, marginBottom: 4, alignItems: "center" }}>
          <div style={{ width: 52, color: f.c, fontSize: 12, fontWeight: 700 }}>{f.name}</div>
          {f.bits.map((n, k) => <div key={k} style={{ flex: n, minWidth: 14, height: "100%", borderRadius: 3, background: [C.red, C.yellow, f.c][k] + "88", fontSize: 9.5, color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</div>)}
        </div>
      ))}
      <div style={{ color: C.muted, fontSize: 11.5, marginBottom: 10 }}>■ sign · ■ exponent (range) · ■ mantissa (precision). Bar lengths are to scale.</div>
      <input value={txt} onChange={(e) => setTxt(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 14, fontFamily: "monospace", boxSizing: "border-box" }} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0" }}>
        {["3.14159265", "0.1", "70000", "1e-8", "123456.789", "0.0001234"].map((v) => <Btn key={v} ghost onClick={() => setTxt(v)}>{v}</Btn>)}
      </div>
      {valid && Object.values(FMT).map((f) => {
        const r = f.f(x), err = x !== 0 ? Math.abs((r - x) / x) : 0;
        const bad = !isFinite(r) || (r === 0 && x !== 0);
        return (
          <div key={f.name} style={{ display: "flex", gap: 10, alignItems: "center", background: C.card, borderRadius: 8, padding: "7px 10px", marginBottom: 5, border: `1.5px solid ${bad ? C.red : f.c + "66"}` }}>
            <b style={{ color: f.c, width: 46, fontSize: 12.5 }}>{f.name}</b>
            <span style={{ fontFamily: "monospace", fontSize: 13, color: bad ? C.red : C.text, flex: 1 }}>{isFinite(r) ? r.toPrecision(10) : "∞ (overflow!)"}{r === 0 && x !== 0 ? "  (underflow: became 0!)" : ""}</span>
            <span style={{ fontFamily: "monospace", fontSize: 11.5, color: C.muted }}>{isFinite(r) && !bad ? `error ${(err * 100).toPrecision(2)}%` : ""}</span>
          </div>
        );
      })}
      <Insight color={C.purple} title="FP16: 3 digits and a small range (max 65,504). BF16: even fewer digits, but FP32's huge range.">
        Try 70000 (FP16 overflows) and 1e-8 (FP16 underflows to 0). BF16 was invented for AI precisely to keep FP32's range. INT8 goes further:
        whole numbers from −128 to 127, with a scale factor.
      </Insight>
    </div>
  );
}

// ── Section 3: Does AI notice? ──
const CLASS = [[0.5, 40, 0], [1.0, 65, 0], [1.5, 85, 0], [2.0, 95, 0], [2.5, 60, 0], [3.0, 45, 0], [3.0, 80, 1], [3.5, 70, 1], [4.0, 50, 1], [4.5, 35, 0], [5.0, 40, 1], [5.5, 75, 1], [6.0, 55, 1], [2.5, 92, 1], [1.0, 98, 0], [4.0, 90, 1], [2.0, 55, 0], [5.0, 25, 0], [3.5, 40, 0], [1.5, 50, 0]];
const TRAINED = (() => { let w1 = 0, w2 = 0, b = 0; const sg = (z) => 1 / (1 + Math.exp(-z)); for (let e = 0; e < 500; e++) { let g1 = 0, g2 = 0, gb = 0; for (const [h, a, y] of CLASS) { const p = sg(w1 * h / 6 + w2 * a / 100 + b); g1 += (p - y) * h / 6; g2 += (p - y) * a / 100; gb += p - y; } w1 -= 2 * g1 / 20; w2 -= 2 * g2 / 20; b -= 2 * gb / 20; } return [w1, w2, b]; })();
function NoticeWidget() {
  const [bits, setBits] = useState(8);
  const [scaled, setScaled] = useState(false);
  const maxAbs = Math.max(...TRAINED.map(Math.abs));
  const levels = Math.pow(2, bits - 1) - 1;
  const q = TRAINED.map((w) => Math.round((w / maxAbs) * levels) * (maxAbs / levels));
  const acc = CLASS.filter(([h, a, y]) => ((q[0] * h / 6 + q[1] * a / 100 + q[2]) >= 0 ? 1 : 0) === y).length;
  const grad = 2e-8, scale = 65536;
  const g16 = FMT.fp16.f(scaled ? grad * scale : grad);
  return (
    <div>
      <Frame>
        Take the pass/fail neuron you trained in Unit 0.C and store its weights as <b style={{ color: C.orange }}>signed integers</b> with fewer and fewer bits
        (each weight = integer × a shared scale). Does it still predict well?
      </Frame>
      <Slider label={<>Bits per weight = <b style={{ color: C.orange }}>{bits}</b> ({2 * levels + 1} possible values)</>} value={bits} min={2} max={16} onChange={setBits} color={C.orange} />
      <div style={{ fontFamily: "monospace", fontSize: 12.5, color: C.text, background: C.card, borderRadius: 8, padding: 10, border: `1px solid ${C.border}`, lineHeight: 1.8 }}>
        <div style={{ color: C.muted }}>trained (FP32): w₁ = {TRAINED[0].toFixed(4)}, w₂ = {TRAINED[1].toFixed(4)}, b = {TRAINED[2].toFixed(4)}</div>
        <div style={{ color: C.orange }}>stored in {bits} bits: w₁ = {q[0].toFixed(4)}, w₂ = {q[1].toFixed(4)}, b = {q[2].toFixed(4)}</div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="ACCURACY (FP32 GETS 19/20)" value={`${acc} / 20`} color={acc >= 19 ? C.green : acc >= 16 ? C.yellow : C.red} />
      </div>
      <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>On a dataset this tiny, rounding can tip one borderline student either way (you may even see 20/20). That's noise, not magic. The real pattern: accuracy holds until only a handful of bits are left.</div>
      <div style={{ marginTop: 16, background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>The one danger: tiny gradients in FP16</div>
        <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.7 }}>During training some gradients are tiny, like 2 × 10⁻⁸. FP16 can't hold numbers that small: they become 0, and learning silently stops.
          The fix is <b style={{ color: C.green }}>loss scaling</b>: multiply the loss (and so every gradient) by a big number before the backward pass, and divide it back out before the update.</div>
        <label style={{ color: C.text, fontSize: 12.5, cursor: "pointer", display: "block", marginTop: 8 }}><input type="checkbox" checked={scaled} onChange={(e) => setScaled(e.target.checked)} /> Scale by 65,536 before storing in FP16</label>
        <div style={{ fontFamily: "monospace", fontSize: 13, marginTop: 6, color: g16 === 0 ? C.red : C.green }}>gradient {scaled ? "× 65,536 " : ""}in FP16 = {g16 === 0 ? "0  ✗ lost!" : `${g16.toExponential(3)}  ✓ survives`}</div>
      </div>
      <Insight color={C.green} title="Neural networks are remarkably tolerant of rounding. Accuracy holds down to very few bits.">
        The trick in practice, <b>mixed precision</b>: do the heavy multiplies in FP16 (fast), keep a master copy of the weights and the running sums in
        FP32 (safe), and use loss scaling for the gradients. PyTorch's autocast and GradScaler do this for you.
      </Insight>
    </div>
  );
}

// ── Section 4: The speed payoff ──
function SpeedWidget() {
  const [kind, setKind] = useState("compute");
  const rows = [
    { n: "FP32 (CUDA cores)", tf: 8.1, bytes: 4, c: C.accent },
    { n: "FP16 (Tensor Cores)", tf: 65, bytes: 2, c: C.green },
    { n: "INT8 (Tensor Cores)", tf: 130, bytes: 1, c: C.orange },
  ];
  const speed = (r) => (kind === "compute" ? r.tf / 8.1 : 4 / r.bytes);
  return (
    <div>
      <Frame>
        Lower precision helps twice. <b style={{ color: C.text }}>Compute-bound</b> work (big matrix multiplies) gets the Tensor Cores' huge throughput.
        <b style={{ color: C.text }}> Memory-bound</b> work (ReLU, adding, LLM token generation) moves half or a quarter of the bytes. T4 published peaks:
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <Btn ghost={kind !== "compute"} onClick={() => setKind("compute")}>Compute-bound job</Btn>
        <Btn ghost={kind !== "memory"} onClick={() => setKind("memory")} color={C.teal}>Memory-bound job</Btn>
      </div>
      {rows.map((r) => (
        <div key={r.n} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
            <span style={{ color: C.text }}>{r.n} <span style={{ color: C.muted }}>· {kind === "compute" ? `${r.tf} T${r.n.startsWith("INT") ? "OPS" : "FLOPS"} peak` : `${r.bytes} byte${r.bytes > 1 ? "s" : ""} per number`}</span></span>
            <span style={{ fontFamily: "monospace", color: r.c }}>up to {speed(r).toFixed(speed(r) < 10 ? 1 : 0)}× FP32</span>
          </div>
          <div style={{ height: 12, background: C.card, borderRadius: 4 }}><div style={{ width: `${(speed(r) / (kind === "compute" ? 16 : 4)) * 100}%`, height: "100%", background: r.c, borderRadius: 4 }} /></div>
        </div>
      ))}
      <Code color={C.green} title="🔥 MIXED PRECISION IN PYTORCH: a few extra lines">{`scaler = torch.amp.GradScaler("cuda")             # loss scaling
for images, labels in loader:
    with torch.autocast(device_type="cuda", dtype=torch.float16):
        loss = loss_fn(model(images), labels)    # matmuls run in FP16 on Tensor Cores
    opt.zero_grad()
    scaler.scale(loss).backward()                # scaled gradients don't underflow
    scaler.step(opt)                             # unscale, then update FP32 weights
    scaler.update()`}</Code>
      <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Note: the T4 (Turing) has FP16 and INT8 Tensor Cores but no BF16 support; BF16 needs Ampere (A100) or newer. The newest GPUs add FP8 too.</div>
      <Insight color={C.green} title="Fewer bits = more numbers per second, through both the arithmetic units and the memory.">
        Real speed-ups are smaller than these peaks (Amdahl, launch overheads), but 2–3× for training and more for inference is common. That's why
        nearly all modern AI runs in FP16, BF16 or lower.
      </Insight>
      <LabCard part="B" title="Precision in practice"
        what="Time a big matrix multiply in FP32 and FP16 and measure the rounding error; see FP16 overflow and underflow; then train MNIST with and without torch.autocast and compare speed and accuracy."
        expect="FP16 several times faster for the matmul, tiny errors, overflow at 70,000, and autocast training reaching the same accuracy faster." />
    </div>
  );
}

const QUESTIONS = [
  { q: "A 13-billion-parameter model in FP16 needs how much memory for its weights?", options: ["13 GB", "26 GB", "52 GB", "6.5 GB"], answer: 1, explain: "FP16 = 2 bytes per parameter: 13 × 10⁹ × 2 = 26 GB." },
  { q: "Why does BF16 keep 8 exponent bits (like FP32) but only 7 mantissa bits?", options: ["To be more precise than FP32", "To keep FP32's huge range, so values rarely overflow or underflow, while giving up digits AI doesn't need", "Because 7 is lucky", "To run on CPUs only"], answer: 1, explain: "Range matters more than digits for neural networks. BF16 avoids FP16's overflow and underflow problems." },
  { q: "What problem does loss scaling solve in FP16 training?", options: ["Weights becoming too large", "Tiny gradients underflowing to zero in FP16", "Slow data loading", "Branch divergence"], answer: 1, explain: "Multiplying the loss by a large factor lifts small gradients into FP16's range; they're scaled back down before the update." },
  { q: "Why does FP16 also speed up memory-bound operations like ReLU?", options: ["Tensor Cores do ReLU", "Each number takes half the bytes, so twice as many move per second", "It skips the operation", "It uses the CPU"], answer: 1, explain: "Memory-bound speed is bytes ÷ bandwidth. Half the bytes = up to twice the speed." },
];
const RESULT = {
  perfect: "Perfect! You understand why AI runs on fewer bits.",
  good: "Good. Replay 'The Formats' and try 70000 and 1e-8.",
  low: "Revisit 'Will It Fit?' and 'The Formats': bits per number decide memory, range and precision.",
  done: "Unit 5.2 Complete!",
  body: "You can compare FP32, FP16, BF16 and INT8, explain why AI tolerates rounding, use mixed precision, and estimate the speed payoff.",
  next: "Next up: Unit 5.3 — Compute-bound vs Memory-bound.",
  teaser: "One chart, the roofline, tells you the speed limit of any operation on any GPU.",
};

const UNIT_WORDS = [
  ["FP32 / FP16", "32-bit / 16-bit floating point", "IEEE 754 formats (COA): 1 sign + 8/5 exponent + 23/10 mantissa bits.", "from COA"],
  ["BF16", "Brain Floating Point 16", "16 bits with FP32's 8-bit exponent and a 7-bit mantissa. Designed for AI.", "new here"],
  ["INT8 / INT4", "8-bit / 4-bit integers", "Whole numbers plus a scale factor; used to shrink models for inference.", "new here"],
  ["TOPS", "Tera Operations Per Second", "Like TFLOPS, but for integer operations.", "new here"],
  ["AMP", "Automatic Mixed Precision", "PyTorch's autocast + GradScaler: FP16 where safe, FP32 where needed.", "new here"],
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

export default function Unit5_2({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "Will It Fit?" },
    { id: "s1", label: "The Formats" },
    { id: "s2", label: "Does AI Notice?" },
    { id: "s3", label: "The Speed Payoff" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>💾 Will It Fit? — bits per number = memory</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🔢 The Formats — FP32, FP16, BF16 (IEEE 754 from COA)</h3><FormatWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🎯 Does AI Notice? — rounding, quantisation, loss scaling</h3><NoticeWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>⚡ The Speed Payoff — Tensor Cores and fewer bytes</h3><SpeedWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 5.2.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔢</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 5 › UNIT 5.2</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Precision: FP32 → FP16/BF16 → INT8</div>
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
