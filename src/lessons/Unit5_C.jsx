import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab5B_GPUs_in_Real_Projects.ipynb";

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
      <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>🧪 TRY IT FOR REAL — LAB 5B · PART {part}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{what}</div>
      <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}><b style={{ color: C.green }}>You should see:</b> {expect}</div>
      <a href={LAB_URL} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", borderRadius: 8, background: C.orange, color: "#0D1117", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Open Lab 5B in Colab ↗</a>
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

const TEXTBOOK = "Kirk & Hwu Ch 16 · D2L Ch 13";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// Published peak figures (dense FP16 Tensor Core), memory and bandwidth; prices are ASSUMPTIONS for illustration
const GPUS = [
  { k: "t4", n: "T4", mem: 16, tf: 65e12, bw: 320e9, rs: 35 },
  { k: "l4", n: "L4", mem: 24, tf: 121e12, bw: 300e9, rs: 70 },
  { k: "a100", n: "A100 40 GB", mem: 40, tf: 312e12, bw: 1555e9, rs: 250 },
  { k: "a100x", n: "A100 80 GB", mem: 80, tf: 312e12, bw: 2000e9, rs: 350 },
];
const PROJECTS = {
  chat: { t: "💬 Helpdesk chatbot (run a model)", kind: "infer", params: 7, extra: "answers per day", def: 20000 },
  tune: { t: "🎓 Fine-tune a model on college FAQs", kind: "train", params: 1, extra: "training tokens (millions)", def: 50 },
  vision: { t: "📷 Train a small image classifier", kind: "train", params: 0.02, extra: "images × epochs (lakhs)", def: 50 },
};
function planFor(pk, params, amount, prec, g) {
  const P = params * 1e9, p = PROJECTS[pk];
  let memGB, hours;
  if (p.kind === "infer") {
    const bytes = prec === "int8" ? 1 : 2;
    memGB = P * bytes * 1.2 / 1e9 + 0.5;
    const tokPerAnswer = 270;
    const secPerToken = (P * bytes) / (g.bw * 0.6);          // memory-bound decoding (Unit 5.3), 60% of bandwidth
    hours = (amount * tokPerAnswer * secPerToken) / 3600 / 8; // assume 8 answers batched together
  } else {
    memGB = P * 16 / 1e9 + P * 2 / 1e9 + 0.5;                 // mixed-precision Adam + rough activations (Unit 5.7)
    const tokens = pk === "tune" ? amount * 1e6 : amount * 1e5;
    hours = (6 * P * tokens) / (g.tf * 0.35) / 3600;          // 6·N·D at 35% of peak (Unit 1.2)
  }
  const n = Math.max(1, Math.ceil(memGB / g.mem));
  return { memGB, n, hours: hours / n, cost: (hours / n) * n * g.rs };
}

// ── Section 1: The Mission ──
const TOOLS = [
  ["Bytes per parameter: 2 to run (FP16), ~16 to train", "Unit 5.7"],
  ["Training FLOPs ≈ 6 × parameters × tokens", "Unit 1.2"],
  ["Chatbot decoding is memory-bound: time per token ≈ model bytes ÷ bandwidth", "Unit 5.3"],
  ["Real code reaches only part of the peak; Amdahl applies", "Units 1.C, 2.4"],
  ["FP16 / INT8 to save memory and time", "Unit 5.2"],
  ["Several GPUs when it doesn't fit on one", "Unit 5.9"],
];
function MissionWidget() {
  const [ticks, setTicks] = useState([]);
  return (
    <div>
      <Frame>
        Your college's innovation cell has three AI project proposals and a limited budget. For each one they want <b style={{ color: C.text }}>a GPU plan</b>: will it fit,
        which GPU, how many, how long, and roughly what it will cost. You're the only one in the room who's done this course. Your toolkit:
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
      <Insight color={C.green} title="Every tool comes from a different module. This capstone uses the whole course.">
        AI basics → workload → CPU vs GPU → inside the GPU → CPU–GPU teamwork → speed tricks → real-project sizing.
      </Insight>
    </div>
  );
}

// ── Section 2: Build in Steps ──
const VERSIONS = [
  { tag: "v1", title: "Does it fit?", color: C.teal, why: "Memory first, because a plan that doesn't fit is no plan. Use bytes per parameter for the task (Unit 5.7).", code: `def memory_gb(params, task, precision="fp16"):
    if task == "infer":
        per = {"fp16": 2, "int8": 1, "int4": 0.5}[precision]
        return params * per * 1.2 / 1e9 + 0.5      # +20% activations, +0.5 GB context
    return params * 18 / 1e9 + 0.5                 # 16 B/param (mixed + Adam) + rough activations

gpus = {"T4": 16, "L4": 24, "A100-40": 40, "A100-80": 80}
need = memory_gb(1e9, "train")
print({g: "fits" if need <= m else f"needs {int(-(-need // m))}" for g, m in gpus.items()})` },
  { tag: "v2", title: "+ how long?", color: C.yellow, why: "Training is compute-bound: 6·N·D FLOPs at a realistic share of peak. Chatbot answers are memory-bound: each token reads all the weights (Unit 5.3).", code: `def train_hours(params, tokens, peak_flops, util=0.35):
    return 6 * params * tokens / (peak_flops * util) / 3600

def chat_hours(params, answers, bandwidth, bytes_per_param=2, tokens=270, batch=8):
    sec_per_token = params * bytes_per_param / (bandwidth * 0.6)
    return answers * tokens * sec_per_token / batch / 3600` },
  { tag: "v3", title: "+ cost and a recommendation", color: C.green, why: "Combine fit, time and price. Recommend the cheapest option that fits and finishes in time, and say what you assumed.", code: `prices = {"T4": 35, "L4": 70, "A100-40": 250, "A100-80": 350}   # ₹/GPU-hour: ASSUMED

def plan(name, mem_needed, hours_one_gpu, gpu, gpu_mem):
    n = max(1, int(-(-mem_needed // gpu_mem)))
    hours = hours_one_gpu / n
    print(f"{name}: {n} × {gpu}, {hours:.1f} h, ≈ ₹{hours * n * prices[gpu]:,.0f}")` },
];
function BuildWidget() {
  const [v, setV] = useState(0);
  const cur = VERSIONS[v];
  return (
    <div>
      <Frame>Grow the project planner one idea at a time.</Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {VERSIONS.map((x, i) => <Btn key={x.tag} ghost={i !== v} onClick={() => setV(i)} color={x.color}>{x.tag}: {x.title}</Btn>)}
      </div>
      <div style={{ padding: "10px 14px", borderRadius: 8, background: cur.color + "14", border: `1px solid ${cur.color}55`, color: C.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
        <b style={{ color: cur.color }}>{cur.tag}: </b>{cur.why}
      </div>
      <Code color={cur.color}>{cur.code}</Code>
      <Insight title="Fit → time → cost. Always in that order, and always with your assumptions written down.">
        A good plan says "about 6 hours on one L4, assuming 35% utilisation and ₹70/hour", not just "about 6 hours".
      </Insight>
    </div>
  );
}

// ── Section 3: Play It — the planner ──
function PlayWidget() {
  const [pk, setPk] = useState("chat");
  const p = PROJECTS[pk];
  const [params, setParams] = useState(p.params);
  const [amount, setAmount] = useState(p.def);
  const [prec, setPrec] = useState("fp16");
  const choose = (k) => { setPk(k); setParams(PROJECTS[k].params); setAmount(PROJECTS[k].def); };
  const rows = GPUS.map((g) => ({ g, ...planFor(pk, params, amount, prec, g) }));
  const best = rows.reduce((a, b) => (b.cost < a.cost ? b : a));
  return (
    <div>
      <Frame>Pick a project, adjust it, and compare GPUs. The planner flags the cheapest option. (Published peak figures; prices are assumptions, so check current rates.)</Frame>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {Object.entries(PROJECTS).map(([k, v]) => <Btn key={k} ghost={k !== pk} onClick={() => choose(k)}>{v.t}</Btn>)}
      </div>
      <Slider label={<>Model size = <b style={{ color: C.accent }}>{params} B</b> parameters</>} value={params} min={pk === "vision" ? 0.005 : 0.1} max={pk === "vision" ? 0.5 : 70} step={pk === "vision" ? 0.005 : 0.1} onChange={setParams} />
      <Slider label={<>{p.extra} = <b style={{ color: C.purple }}>{amount.toLocaleString("en-IN")}</b></>} value={amount} min={1} max={pk === "chat" ? 200000 : 2000} onChange={setAmount} color={C.purple} />
      {p.kind === "infer" && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <Btn ghost={prec !== "fp16"} onClick={() => setPrec("fp16")}>FP16</Btn>
          <Btn ghost={prec !== "int8"} onClick={() => setPrec("int8")} color={C.orange}>INT8</Btn>
        </div>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead><tr style={{ color: C.muted, textAlign: "left" }}><th style={{ padding: 6 }}>GPU</th><th>Memory needed</th><th>GPUs</th><th>{p.kind === "infer" ? "GPU-hours / day" : "Time"}</th><th>Cost</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.g.k} style={{ borderTop: `1px solid ${C.border}`, background: r === best ? C.green + "18" : "transparent", color: C.text }}>
              <td style={{ padding: 6 }}>{r.g.n} {r === best && <span style={{ color: C.green }}>★ cheapest</span>}</td>
              <td style={{ color: r.n > 1 ? C.yellow : C.text }}>{r.memGB.toFixed(1)} GB / {r.g.mem} GB</td>
              <td>{r.n}</td>
              <td style={{ fontFamily: "monospace" }}>{r.hours < 1 / 60 ? `${Math.max(1, Math.round(r.hours * 3600))} s` : r.hours < 1 ? `${(r.hours * 60).toFixed(0)} min` : `${r.hours.toFixed(1)} h`}</td>
              <td style={{ fontFamily: "monospace" }}>{r.cost < 1 ? "< ₹1" : `₹${Math.round(r.cost).toLocaleString("en-IN")}`}{p.kind === "infer" ? "/day" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Insight color={C.green} title="The cheapest GPU isn't always the slowest-per-hour one, and the fastest isn't always the best.">
        Try the chatbot in FP16 vs INT8, and fine-tuning a 7 B model: notice when you're forced onto several GPUs or a bigger card. That judgement,
        backed by numbers, is what this course set out to give you.
      </Insight>
    </div>
  );
}

// ── Section 4: Full code, the real model, and your mini-project ──
function CodeWidget() {
  return (
    <div>
      <Frame>
        In Lab 5B Part E you'll run your planner, then put it to a real test: load a real (small) language model, generate text on the CPU and on the T4,
        and compare the measured speed and memory with your predictions.
      </Frame>
      <Code color={C.green} title="🤖 A real language model on the GPU (Lab 5B Part E)">{`from transformers import AutoTokenizer, AutoModelForCausalLM
name = "distilgpt2"                                   # 82 million parameters
tok = AutoTokenizer.from_pretrained(name)
model = AutoModelForCausalLM.from_pretrained(name, torch_dtype=torch.float16).to("cuda")

ids = tok("The GPU is fast because", return_tensors="pt").to("cuda")
torch.cuda.synchronize(); t0 = time.perf_counter()
out = model.generate(**ids, max_new_tokens=100, do_sample=False)
torch.cuda.synchronize(); dt = time.perf_counter() - t0
print(tok.decode(out[0]))
print(f"{100 / dt:.0f} tokens/s, memory {torch.cuda.max_memory_allocated() / 1e6:.0f} MB")`}</Code>
      <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 10, background: C.purple + "14", border: `1px solid ${C.purple}55` }}>
        <div style={{ color: C.purple, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>🎓 Your mini-project (in pairs)</div>
        <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
          Choose one small AI task (image classification, text sentiment, or running a small pretrained model). Using the
          <b style={{ color: C.text }}> Mini-Project template notebook</b>: (1) plan it with your planner, (2) run it on the CPU and on the GPU, (3) measure the speed-up,
          where the time goes (data vs copy vs compute), and the GPU memory used, (4) apply at least one optimisation from Module 5, and (5) write a one-page report.
        </div>
        <a href="https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/MiniProject_Template.ipynb" target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 10, padding: "8px 16px", borderRadius: 8, background: C.purple, color: "#0D1117", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Open the Mini-Project template in Colab ↗</a>
      </div>
      <LabCard part="E" title="Plan it, then run a real language model"
        what="Run the planner for the three projects; then load distilgpt2, generate 100 tokens on the CPU and on the T4 in FP16, and compare tokens per second and memory with the bandwidth-based prediction from Unit 5.3."
        expect="a big GPU speed-up, memory of a few hundred MB, and real tokens/s well below the bandwidth limit: for a model this small, overheads (Amdahl again) dominate." />
      <Insight color={C.orange} title="🎓 Course complete: from a single neuron to planning real AI on GPUs.">
        You can explain why AI needs GPUs, how a GPU is built, how the CPU hands it work, how to make it fast, and how to plan real projects. Get your footing.
        Keep climbing.
      </Insight>
    </div>
  );
}

const QUESTIONS = [
  { q: "What's the right order for planning the GPU side of a project?", options: ["Cost → time → fit", "Fit (memory) → time → cost", "Time → cost → fit", "Buy the biggest GPU first"], answer: 1, explain: "If it doesn't fit, nothing else matters. Then estimate time, then turn time into cost." },
  { q: "A chatbot is slow on a T4. Which change speeds up its token generation the most, by the roofline logic?", options: ["A GPU with more FLOPS but the same bandwidth", "INT8 weights (half the bytes per token) or a GPU with more memory bandwidth", "A faster CPU", "More DataLoader workers"], answer: 1, explain: "Decoding is memory-bound: tokens/s ≈ bandwidth ÷ model bytes. Fewer bytes or more bandwidth help." },
  { q: "Fine-tuning a 7-billion-parameter model with full mixed-precision Adam needs roughly…", options: ["14 GB: fits a T4", "about 126 GB: several large GPUs, or a trick like LoRA", "7 GB", "1 GB"], answer: 1, explain: "About 18 bytes per parameter (16 for model state + activations) × 7 × 10⁹ ≈ 126 GB. LoRA or sharding across GPUs is needed." },
  { q: "Your measured tokens/s for a tiny model is far below the bandwidth prediction. The best explanation is…", options: ["The GPU is broken", "Fixed overheads (kernel launches, Python) dominate small models, as Amdahl's law predicts", "Bandwidth doesn't matter", "The CPU was used"], answer: 1, explain: "For tiny models each token's real work is microseconds, so per-step overheads dominate. Big models get much closer to the limit." },
];
const RESULT = {
  perfect: "Perfect! You're ready to plan and run AI on GPUs for real.",
  good: "Great work. Replay 'Play It' with different projects.",
  low: "Revisit 'Build in Steps': fit → time → cost, using units from the whole course.",
  done: "Course Complete! 🎓🏆",
  body: "From rules vs learning to multi-GPU training: you understand how AI uses GPUs, and you can measure, speed up and plan GPU work yourself.",
  next: "What next?",
  teaser: "Do your mini-project, keep the notebooks, and try a bigger model on a bigger GPU when you get the chance. Get your footing. Keep climbing.",
};

const UNIT_WORDS = [
  ["L4", "NVIDIA L4", "A newer, efficient data-centre GPU: 24 GB, FP16 Tensor Cores.", "new here"],
  ["A100", "NVIDIA A100", "A large data-centre GPU: 40 or 80 GB, very high bandwidth.", "from Unit 1.C"],
  ["distilgpt2", "a small GPT-2-style language model", "82 million parameters, small enough to run anywhere.", "new here"],
  ["transformers", "Hugging Face's model library", "Downloads and runs thousands of pretrained models.", "new here"],
  ["GPU-hour", "one GPU used for one hour", "How cloud GPUs are priced.", "from Unit 1.C"],
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
    { id: "s3", label: "Real Model & Mini-Project" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🎯 The Mission — three projects, one budget</h3><MissionWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🪜 Build in Steps — fit → time → cost</h3><BuildWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>▶️ Play It — the AI project planner</h3><PlayWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🤖 A Real Language Model — and your mini-project</h3><CodeWidget /></div>,
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
          <div style={{ fontSize: 15, fontWeight: 600 }}>Grand Capstone: Plan an AI Project</div>
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
