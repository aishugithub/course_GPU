//@@META
{"unit": "7.C", "module": 7, "title": "Grand Capstone: Plan an AI Project", "icon": "🏆", "lab": "Lab07_GPUs_in_Real_Projects.ipynb", "labNo": 7, "gpu": true}
//@@WIDGETS

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
    const secPerToken = (P * bytes) / (g.bw * 0.6);          // memory-bound decoding (Unit 6.3), 60% of bandwidth
    hours = (amount * tokPerAnswer * secPerToken) / 3600 / 8; // assume 8 answers batched together
  } else {
    memGB = P * 16 / 1e9 + P * 2 / 1e9 + 0.5;                 // mixed-precision Adam + rough activations (Unit 7.2)
    const tokens = pk === "tune" ? amount * 1e6 : amount * 1e5;
    hours = (6 * P * tokens) / (g.tf * 0.35) / 3600;          // 6·N·D at 35% of peak (Unit 2.2)
  }
  const n = Math.max(1, Math.ceil(memGB / g.mem));
  return { memGB, n, hours: hours / n, cost: (hours / n) * n * g.rs };
}

// ── Section 1: The Mission ──
const TOOLS = [
  ["Bytes per parameter: 2 to run (FP16), ~16 to train", "Unit 7.2"],
  ["Training FLOPs ≈ 6 × parameters × tokens", "Unit 2.2"],
  ["Chatbot decoding is memory-bound: time per token ≈ model bytes ÷ bandwidth", "Unit 6.3"],
  ["Real code reaches only part of the peak; Amdahl applies", "Units 2.C, 3.4"],
  ["FP16 / INT8 to save memory and time", "Unit 6.2"],
  ["Several GPUs when it doesn't fit on one", "Unit 7.4"],
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
  { tag: "v1", title: "Does it fit?", color: C.teal, why: "Memory first, because a plan that doesn't fit is no plan. Use bytes per parameter for the task (Unit 7.2).", code: `def memory_gb(params, task, precision="fp16"):
    if task == "infer":
        per = {"fp16": 2, "int8": 1, "int4": 0.5}[precision]
        return params * per * 1.2 / 1e9 + 0.5      # +20% activations, +0.5 GB context
    return params * 18 / 1e9 + 0.5                 # 16 B/param (mixed + Adam) + rough activations

gpus = {"T4": 16, "L4": 24, "A100-40": 40, "A100-80": 80}
need = memory_gb(1e9, "train")
print({g: "fits" if need <= m else f"needs {int(-(-need // m))}" for g, m in gpus.items()})` },
  { tag: "v2", title: "+ how long?", color: C.yellow, why: "Training is compute-bound: 6·N·D FLOPs at a realistic share of peak. Chatbot answers are memory-bound: each token reads all the weights (Unit 6.3).", code: `def train_hours(params, tokens, peak_flops, util=0.35):
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
        In Lab 7 Part E you'll run your planner, then put it to a real test: load a real (small) language model, generate text on the CPU and on the T4,
        and compare the measured speed and memory with your predictions.
      </Frame>
      <Code color={C.green} title="🤖 A real language model on the GPU (Lab 7 Part E)">{`from transformers import AutoTokenizer, AutoModelForCausalLM
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
          where the time goes (data vs copy vs compute), and the GPU memory used, (4) apply at least one optimisation from Module 6, and (5) write a one-page report.
        </div>
        <a href="https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/MiniProject_Template.ipynb" target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 10, padding: "8px 16px", borderRadius: 8, background: C.purple, color: "#0D1117", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Open the Mini-Project template in Colab ↗</a>
      </div>
      <LabCard part="E" title="Plan it, then run a real language model"
        what="Run the planner for the three projects; then load distilgpt2, generate 100 tokens on the CPU and on the T4 in FP16, and compare tokens per second and memory with the bandwidth-based prediction from Unit 6.3."
        expect="a big GPU speed-up, memory of a few hundred MB, and real tokens/s well below the bandwidth limit: for a model this small, overheads (Amdahl again) dominate." />
      <Insight color={C.orange} title="🎓 Course complete: from a single neuron to planning real AI on GPUs.">
        You can explain why AI needs GPUs, how a GPU is built, how the CPU hands it work, how to make it fast, and how to plan real projects. Get your footing.
        Keep climbing.
      </Insight>
    </div>
  );
}
//@@SECTIONS
[["The Mission", "🎯 The Mission — three projects, one budget", "MissionWidget"],
 ["Build in Steps", "🪜 Build in Steps — fit → time → cost", "BuildWidget"],
 ["Play It", "▶️ Play It — the AI project planner", "PlayWidget"],
 ["Real Model & Mini-Project", "🤖 A Real Language Model — and your mini-project", "CodeWidget"]]
//@@QUIZ
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
//@@WORDS
const UNIT_WORDS = [
  ["L4", "NVIDIA L4", "A newer, efficient data-centre GPU: 24 GB, FP16 Tensor Cores.", "new here"],
  ["A100", "NVIDIA A100", "A large data-centre GPU: 40 or 80 GB, very high bandwidth.", "from Unit 2.C"],
  ["distilgpt2", "a small GPT-2-style language model", "82 million parameters, small enough to run anywhere.", "new here"],
  ["transformers", "Hugging Face's model library", "Downloads and runs thousands of pretrained models.", "new here"],
  ["GPU-hour", "one GPU used for one hour", "How cloud GPUs are priced.", "from Unit 2.C"],
];
