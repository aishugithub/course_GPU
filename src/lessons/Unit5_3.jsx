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

const TEXTBOOK = "H&P Ch 4 (The roofline performance model) · Kirk & Hwu Ch 5 (Arithmetic intensity)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


const PEAK32 = 8.1e12, PEAK16 = 65e12, BW = 320e9;

// ── Section 1: Need — same GPU, wildly different speeds ──
function NeedWidget() {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <Frame>
        Two operations measured on the same T4. Both are "running at full speed", yet one reaches 50% of the GPU's peak FLOPS and the other
        about 0.4%. Is the second one broken? Predict, then reveal.
      </Frame>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[["ReLU on 10 crore numbers", "≈ 3.1 ms", "≈ 32 GFLOPS", "≈ 260 GB/s", C.orange], ["4096 × 4096 matrix multiply", "≈ 34 ms", "≈ 4,000 GFLOPS", "≈ 6 GB/s", C.green]].map(([t, ms, fl, bw, c]) => (
          <div key={t} style={{ background: C.card, borderRadius: 10, padding: 12, border: `1.5px solid ${c}` }}>
            <div style={{ color: c, fontWeight: 700, fontSize: 13 }}>{t}</div>
            <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.8, marginTop: 4 }}>time {ms}<br />FLOPS {fl}<br />{shown && <>memory traffic {bw}</>}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10 }}><Btn onClick={() => setShown(true)} color={C.purple}>Reveal the memory traffic</Btn></div>
      {shown && (
        <Insight color={C.purple} title="ReLU isn't broken: it's using almost all of the memory bandwidth. Its limit is bytes, not FLOPs.">
          ReLU does one tiny operation per 8 bytes moved, so memory is its ceiling. The matrix multiply does thousands of operations per byte, so the
          arithmetic units are its ceiling. To know which limit applies, you need one number: arithmetic intensity. (Illustrative T4 figures.)
        </Insight>
      )}
    </div>
  );
}

// ── Section 2: Arithmetic intensity ──
const OPS = {
  add: { t: "Vector add  c = a + b", flops: (n) => n, bytes: (n) => 12 * n, note: "1 add per 12 bytes (read 2 floats, write 1)." },
  relu: { t: "ReLU  y = max(x, 0)", flops: (n) => n, bytes: (n) => 8 * n, note: "1 operation per 8 bytes." },
  layerB1: { t: "Layer, batch 1  (1 × n) @ (n × n)", flops: (n) => 2 * n * n, bytes: (n) => 4 * (n * n + 2 * n), note: "Each weight is used once: about 2 FLOPs per 4 bytes." },
  matmul: { t: "Matrix multiply  (n × n) @ (n × n)", flops: (n) => 2 * n ** 3, bytes: (n) => 12 * n * n, note: "Each number is reused n times: intensity grows with n." },
};
function IntensityWidget() {
  const [k, setK] = useState("matmul");
  const [n, setN] = useState(1024);
  const o = OPS[k];
  const I = o.flops(n) / o.bytes(n);
  return (
    <div>
      <Frame>
        <b style={{ color: C.text }}>Arithmetic intensity = FLOPs ÷ bytes moved to and from memory.</b> It says how much maths an operation does for each byte it
        has to fetch. Pick an operation and a size.
      </Frame>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
        {Object.entries(OPS).map(([key, v]) => <Btn key={key} ghost={key !== k} onClick={() => setK(key)}>{v.t}</Btn>)}
      </div>
      <Slider label={<>n = <b style={{ color: C.accent }}>{n}</b></>} value={n} min={64} max={8192} step={64} onChange={setN} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="FLOPs" value={o.flops(n).toExponential(2)} color={C.green} />
        <Stat label="BYTES" value={o.bytes(n).toExponential(2)} color={C.teal} />
        <Stat label="INTENSITY (FLOPs/BYTE)" value={I < 10 ? I.toFixed(3) : I.toFixed(0)} color={C.purple} />
      </div>
      <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8 }}>{o.note}</div>
      <Insight color={C.purple} title="Element-wise operations: far below 1 FLOP per byte. Big matrix multiplies: hundreds or thousands.">
        Intensity depends on reuse, the same idea as Unit 3.4 and tiling in Unit 5.1. Note that a layer with batch size 1 is as poor as ReLU: every weight
        is fetched for just one multiply-add.
      </Insight>
    </div>
  );
}

// ── Section 3: The roofline ──
function RooflineWidget() {
  const [fp16, setFp16] = useState(false);
  const [n, setN] = useState(1024);
  const peak = fp16 ? PEAK16 : PEAK32, bpe = fp16 ? 2 : 4;
  const ridge = peak / BW;
  const pts = [
    { t: "vector add", I: 1 / (3 * bpe), c: C.orange },
    { t: "ReLU", I: 1 / (2 * bpe), c: C.yellow },
    { t: "layer, batch 1", I: (2 * n * n) / (bpe * (n * n + 2 * n)), c: C.red },
    { t: `matmul n=${n}`, I: (2 * n ** 3) / (3 * bpe * n * n), c: C.green },
  ];
  const X = (I) => 40 + ((Math.log10(I) + 2) / 6) * 450, Y = (p) => 190 - ((Math.log10(p) - 9) / 5.2) * 175;
  const perf = (I) => Math.min(peak, BW * I);
  return (
    <div>
      <Frame>
        The <b style={{ color: C.text }}>roofline</b> (Hennessy & Patterson Ch 4) puts it in one picture: x = intensity, y = achievable FLOPS. The slanted part is the memory
        limit (bandwidth × intensity); the flat part is the compute limit (peak). An operation can never rise above the roof. Drag n, and switch on FP16.
      </Frame>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
        <label style={{ color: C.text, fontSize: 12.5, cursor: "pointer" }}><input type="checkbox" checked={fp16} onChange={(e) => setFp16(e.target.checked)} /> FP16 Tensor Cores (65 TFLOPS, 2 bytes per number)</label>
      </div>
      <Slider label={<>Matrix size n = <b style={{ color: C.accent }}>{n}</b></>} value={n} min={16} max={8192} step={16} onChange={setN} />
      <svg viewBox="0 0 520 215" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        {[1e9, 1e10, 1e11, 1e12, 1e13, 1e14].map((p) => <g key={p}><line x1="40" x2="500" y1={Y(p)} y2={Y(p)} stroke={C.border} /><text x="4" y={Y(p) + 3} fill={C.muted} fontSize="9">{p >= 1e12 ? `${p / 1e12}T` : `${p / 1e9}G`}</text></g>)}
        {[0.01, 0.1, 1, 10, 100, 1000, 10000].map((I) => <text key={I} x={X(I)} y="210" fill={C.muted} fontSize="9" textAnchor="middle">{I}</text>)}
        <polyline fill="none" stroke={C.text} strokeWidth="2.5" points={`${X(0.01)},${Y(BW * 0.01)} ${X(ridge)},${Y(peak)} ${X(10000)},${Y(peak)}`} />
        <text x={X(ridge) + 6} y={Y(peak) - 6} fill={C.text} fontSize="10">ridge ≈ {ridge.toFixed(0)} FLOPs/byte</text>
        <text x={X(0.03)} y={Y(BW * 0.03) - 8} fill={C.teal} fontSize="10" transform={`rotate(-33 ${X(0.03)} ${Y(BW * 0.03) - 8})`}>memory roof: 320 GB/s × intensity</text>
        {pts.map((p, k) => <g key={p.t}><circle cx={X(p.I)} cy={Y(perf(p.I))} r="6" fill={p.c} /><text x={X(p.I) + 8} y={Y(perf(p.I)) + (k === 1 ? -8 : 14)} fill={p.c} fontSize="10">{p.t}</text></g>)}
        <text x="44" y="14" fill={C.muted} fontSize="9">y: achievable FLOPS (log) · x: intensity, FLOPs per byte (log)</text>
      </svg>
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        {pts.map((p) => <Stat key={p.t} label={p.t.toUpperCase()} value={p.I < ridge ? "memory-bound" : "compute-bound"} color={p.c} />)}
      </div>
      <Insight title="Left of the ridge: memory-bound, so more FLOPS won't help. Right of the ridge: compute-bound, so more bandwidth won't help.">
        Notice that switching to FP16 raises the roof AND moves every point right (fewer bytes), but it also moves the ridge right, so more operations
        end up memory-bound. Small matrices (drag n down) slide left into memory-bound territory.
      </Insight>
    </div>
  );
}

// ── Section 4: What to do about it ──
function ActWidget() {
  const [params, setParams] = useState(1);
  const bytes = params * 1e9 * 2;
  const msPerToken = (bytes / BW) * 1000;
  return (
    <div>
      <Frame>The roofline tells you which fix will work. Then a real example: a chatbot writing one word at a time.</Frame>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: C.card, borderRadius: 10, padding: 12, border: `1.5px solid ${C.teal}` }}>
          <b style={{ color: C.teal, fontSize: 13 }}>If memory-bound</b>
          <ul style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.7, margin: "6px 0 0", paddingLeft: 18 }}>
            <li><b style={{ color: C.text }}>Fuse operations</b>: do matmul + bias + ReLU in one kernel, so the intermediate never goes to memory (torch.compile does this)</li>
            <li><b style={{ color: C.text }}>Fewer bytes</b>: FP16 / INT8 (Unit 5.2)</li>
            <li><b style={{ color: C.text }}>More reuse</b>: bigger batches, tiling</li>
          </ul>
        </div>
        <div style={{ background: C.card, borderRadius: 10, padding: 12, border: `1.5px solid ${C.green}` }}>
          <b style={{ color: C.green, fontSize: 13 }}>If compute-bound</b>
          <ul style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.7, margin: "6px 0 0", paddingLeft: 18 }}>
            <li><b style={{ color: C.text }}>Tensor Cores</b>: FP16 / BF16 matmuls</li>
            <li><b style={{ color: C.text }}>A bigger GPU</b> or several (Unit 5.9)</li>
            <li><b style={{ color: C.text }}>Fewer FLOPs</b>: a smaller or smarter model</li>
          </ul>
        </div>
      </div>
      <div style={{ marginTop: 14, background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Case study: chatbot word generation (batch 1, FP16)</div>
        <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.7, marginBottom: 8 }}>To produce each new token, the model multiplies a single vector by every weight matrix: that's "layer, batch 1", deep in memory-bound
          territory. So every token must read ALL the weights from memory once.</div>
        <Slider label={<>Model size = <b style={{ color: C.accent }}>{params} B</b> parameters (FP16 = {(params * 2).toFixed(0)} GB)</>} value={params} min={0.5} max={7} step={0.5} onChange={setParams} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Stat label="TIME PER TOKEN ≥ BYTES ÷ 320 GB/s" value={`${msPerToken.toFixed(1)} ms`} color={C.teal} />
          <Stat label="MAX TOKENS PER SECOND" value={(1000 / msPerToken).toFixed(0)} color={C.green} />
        </div>
      </div>
      <Insight color={C.teal} title="Chatbot speed is set by memory bandwidth, not FLOPS. That's why INT8/INT4 quantisation makes chatbots faster.">
        Halve the bytes per weight and you double the tokens per second. This is also why Unit 1.C's FLOPs-only estimate was too optimistic, as
        promised.
      </Insight>
      <LabCard part="C" title="Plot your own roofline"
        what="Measure vector add, ReLU, a batch-1 layer and matrix multiplies of several sizes on the T4, compute each one's intensity and achieved FLOPS, and plot them under the T4's roofline."
        expect="element-wise operations hugging the slanted memory roof, and large matrix multiplies close to the flat compute roof." />
    </div>
  );
}

const QUESTIONS = [
  { q: "An operation does 2 FLOPs for every 8 bytes it moves. What is its arithmetic intensity?", options: ["0.25 FLOPs/byte", "4 FLOPs/byte", "16 FLOPs/byte", "2 FLOPs/byte"], answer: 0, explain: "Intensity = FLOPs ÷ bytes = 2 ÷ 8 = 0.25. Far left of the T4's ridge (≈ 25), so memory-bound." },
  { q: "The T4 has 8.1 TFLOPS (FP32) and 320 GB/s. Where is its ridge point?", options: ["≈ 2.5 FLOPs/byte", "≈ 25 FLOPs/byte", "≈ 250 FLOPs/byte", "≈ 2,600 FLOPs/byte"], answer: 1, explain: "Ridge = peak ÷ bandwidth = 8.1 × 10¹² ÷ 320 × 10⁹ ≈ 25 FLOPs per byte." },
  { q: "An operation is memory-bound. Which change will NOT speed it up?", options: ["Using FP16 instead of FP32", "Fusing it with the next operation", "A GPU with more FLOPS but the same bandwidth", "Increasing data reuse"], answer: 2, explain: "Memory-bound means the bytes are the limit. More FLOPS can't help; fewer or reused bytes can." },
  { q: "A 7-billion-parameter chatbot in FP16 on a 320 GB/s GPU can generate at most about how many tokens per second (batch 1)?", options: ["≈ 2", "≈ 23", "≈ 230", "≈ 2,300"], answer: 1, explain: "Each token reads all 14 GB of weights: 14 GB ÷ 320 GB/s ≈ 44 ms per token, so about 23 tokens per second at most." },
];
const RESULT = {
  perfect: "Perfect! You can predict any operation's speed limit.",
  good: "Good. Replay 'The Roofline' and toggle FP16.",
  low: "Revisit 'Arithmetic Intensity': FLOPs per byte decides everything.",
  done: "Unit 5.3 Complete!",
  body: "You can compute arithmetic intensity, read a roofline, classify operations as compute- or memory-bound, and pick the right fix.",
  next: "Next up: Unit 5.4 — Batch Size & Training on GPU.",
  teaser: "Put it all together in real training: batch size, throughput, memory, and mixed precision.",
};

const UNIT_WORDS = [
  ["intensity", "arithmetic intensity", "FLOPs done per byte moved to or from memory.", "new here"],
  ["roofline", "the roofline model", "A chart of the speed limit: min(peak FLOPS, bandwidth × intensity).", "new here"],
  ["ridge point", "where the two roofs meet", "peak ÷ bandwidth; about 25 FLOPs/byte for the T4 in FP32.", "new here"],
  ["kernel fusion", "combining operations into one kernel", "Avoids writing intermediate results to memory.", "new here"],
  ["torch.compile", "PyTorch's compiler", "Can fuse operations automatically to cut memory traffic.", "new here"],
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

export default function Unit5_3({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "Broken or Not?" },
    { id: "s1", label: "Arithmetic Intensity" },
    { id: "s2", label: "The Roofline" },
    { id: "s3", label: "What To Do" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🤔 Broken or Not? — 50% vs 0.4% of peak</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>⚖️ Arithmetic Intensity — FLOPs per byte</h3><IntensityWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🏠 The Roofline — the speed limit of any operation</h3><RooflineWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🛠️ What To Do — and why chatbots are memory-bound</h3><ActWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 5.3.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏠</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 5 › UNIT 5.3</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Compute-bound vs Memory-bound</div>
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
