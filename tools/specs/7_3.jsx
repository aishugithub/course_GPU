//@@META
{"unit": "7.3", "module": 7, "title": "nvidia-smi & Out-of-Memory", "icon": "🩺", "lab": "Lab07_GPUs_in_Real_Projects.ipynb", "labNo": 7, "gpu": true}
//@@WIDGETS

// ── Section 1: Read the dashboard ──
const SMI = [
  { k: "driver", txt: "| NVIDIA-SMI 550.54     Driver Version: 550.54     CUDA Version: 12.4     |", d: "The driver version and the newest CUDA version it supports (Unit 7.1). PyTorch's CUDA build must not be newer than this." },
  { k: "sep", txt: "|-----------------------------+----------------------+----------------------|", d: null },
  { k: "name", txt: "|   0  Tesla T4         Off  | 00000000:00:04.0 Off |                    0 |", d: "GPU number 0, its name, and its PCIe bus address (Unit 5.1). Servers with several GPUs list each one on its own row." },
  { k: "status", txt: "| N/A   67C    P0    52W /  70W |  9817MiB / 15360MiB |     87%      Default |", d: null },
  { k: "sep2", txt: "+-----------------------------+----------------------+----------------------+", d: null },
  { k: "proc", txt: "|    0   N/A  N/A    1234      C   /usr/bin/python3                 9814MiB |", d: "Which processes are using the GPU and how much memory each holds. On Colab, that's your notebook's Python." },
];
const FIELDS = [
  { k: "temp", t: "67C", d: "Temperature. GPUs slow themselves down if they get too hot (above about 85 °C for many cards)." },
  { k: "power", t: "52W / 70W", d: "Power now / power limit. The T4's 70 W limit is low, which is why it's so common in cloud servers (Unit 3.2: power is the real constraint)." },
  { k: "mem", t: "9817MiB / 15360MiB", d: "Memory used / total. Includes PyTorch's cache and the CUDA context, so it's usually MORE than your tensors need (section 2)." },
  { k: "util", t: "87%", d: "GPU-Util: the share of recent time in which at least one kernel was running. NOT the share of cores busy: a tiny kernel running non-stop shows 100%. Low numbers mean a starving GPU (Unit 5.C)." },
];
function SmiWidget() {
  const [sel, setSel] = useState("util");
  const f = FIELDS.find((x) => x.k === sel);
  const line = SMI.find((x) => x.k === sel);
  return (
    <div>
      <Frame>
        <code style={{ color: C.accent }}>nvidia-smi</code> is the GPU's dashboard. Here's what it typically shows during training on Colab. Click the highlighted parts
        of the status line, and the other lines.
      </Frame>
      <pre style={{ margin: 0, background: "#000", border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, fontFamily: "monospace", fontSize: 10.5, lineHeight: 1.6, color: "#c9d1d9", overflowX: "auto" }}>
        {SMI.map((l) => {
          if (l.k === "status") {
            return (
              <div key={l.k}>
                {"| N/A   "}<span onClick={() => setSel("temp")} style={{ cursor: "pointer", background: sel === "temp" ? C.yellow + "55" : C.yellow + "18" }}>67C</span>
                {"    P0    "}<span onClick={() => setSel("power")} style={{ cursor: "pointer", background: sel === "power" ? C.yellow + "55" : C.yellow + "18" }}>52W /  70W</span>
                {" |  "}<span onClick={() => setSel("mem")} style={{ cursor: "pointer", background: sel === "mem" ? C.yellow + "55" : C.yellow + "18" }}>9817MiB / 15360MiB</span>
                {" |     "}<span onClick={() => setSel("util")} style={{ cursor: "pointer", background: sel === "util" ? C.yellow + "55" : C.yellow + "18" }}>87%</span>{"      Default |"}
              </div>
            );
          }
          return <div key={l.k} onClick={() => l.d && setSel(l.k)} style={{ cursor: l.d ? "pointer" : "default", background: sel === l.k ? C.accent + "33" : "transparent" }}>{l.txt}</div>;
        })}
      </pre>
      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        {f ? <><b style={{ color: C.yellow }}>{f.t}</b>: {f.d}</> : <>{line.d}</>}
      </div>
      <Insight color={C.teal} title="Two numbers to watch: memory used (are you near the limit?) and GPU-Util (is the GPU being fed?).">
        Run <code>!nvidia-smi</code> in a Colab cell any time. The memory number looks larger than your tensors need; the next section explains why.
      </Insight>
    </div>
  );
}

// ── Section 2: Anatomy of the OOM message ──
const OOM_PARTS = [
  { t: "torch.OutOfMemoryError: CUDA out of memory.", d: "PyTorch asked the driver for GPU memory (step 1, allocate, Unit 5.2) and didn't get it." },
  { t: "Tried to allocate 2.00 GiB.", d: "The size of the ONE request that failed: often a big activation tensor from a large batch. It's not the total you need." },
  { t: "GPU 0 has a total capacity of 14.74 GiB of which 1.13 GiB is free.", d: "The T4 has 16 GB, but about 15 GiB is usable (GiB = 2³⁰ bytes, a little more than a GB), and only 1.13 GiB is free right now." },
  { t: "Of the allocated memory 12.90 GiB is allocated by PyTorch,", d: "Memory held by live tensors: weights, gradients, optimiser states, activations (Unit 7.2)." },
  { t: "and 398.00 MiB is reserved by PyTorch but unallocated.", d: "PyTorch's caching allocator keeps freed blocks to reuse quickly instead of returning them to the driver. nvidia-smi counts these as 'used'." },
];
function OomWidget() {
  const [i, setI] = useState(1);
  return (
    <div>
      <Frame>Sooner or later everyone meets this message. Each part tells you something. Click through it.</Frame>
      <pre style={{ margin: 0, background: "#2a1214", border: `1px solid ${C.red}`, borderRadius: 10, padding: 10, fontFamily: "monospace", fontSize: 11.5, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
        {OOM_PARTS.map((p, k) => <span key={k} onClick={() => setI(k)} style={{ cursor: "pointer", color: k === i ? "#fff" : C.red, background: k === i ? C.red + "66" : "transparent" }}>{p.t} </span>)}
      </pre>
      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{OOM_PARTS[i].d}</div>
      <Code color={C.teal} title="🔍 PYTORCH'S OWN MEMORY GAUGES">{`torch.cuda.memory_allocated()   # bytes held by live tensors
torch.cuda.memory_reserved()    # allocated + cached (≈ what nvidia-smi shows, minus the context)
torch.cuda.max_memory_allocated()  # the peak since the start (or the last reset)
print(torch.cuda.memory_summary())  # the full report`}</Code>
      <Insight color={C.red} title="'Allocated' = live tensors. 'Reserved' = allocated + PyTorch's cache. nvidia-smi = reserved + the CUDA context.">
        So a big nvidia-smi number after you delete a tensor isn't necessarily a leak: PyTorch is keeping the space for reuse.
        <code> torch.cuda.empty_cache()</code> hands cached blocks back to the driver.
      </Insight>
    </div>
  );
}

// ── Section 3: The classic leaks ──
function LeakWidget() {
  const [bug, setBug] = useState("preds");
  const [fixed, setFixed] = useState(false);
  const steps = 60;
  const grow = bug === "preds" ? 0.6 : 0.12;
  const mem = (s) => (fixed ? 5.2 : 5.2 + grow * s);
  const oomAt = fixed ? null : Math.ceil((14.7 - 5.2) / grow);
  const BUGS = {
    preds: { label: "Keeping outputs that still have a graph", bad: `all_preds = []
for x, y in test_loader:
    out = model(x)                # builds a graph + saves activations
    all_preds.append(out)         # ...and keeps ALL of it alive`, good: `all_preds = []
with torch.no_grad():             # no graph, no saved activations
    for x, y in test_loader:
        all_preds.append(model(x))
# (or: all_preds.append(model(x).detach()))`, why: "Every output tensor remembers how it was computed, including the saved activations needed for a backward pass. Store it in a list and you keep every batch's activations until memory runs out. This one grows fast." },
    total: { label: "Accumulating the loss tensor", bad: `total_loss = 0
for x, y in loader:
    loss = loss_fn(model(x), y)
    loss.backward(); opt.step(); opt.zero_grad()
    total_loss += loss            # chains every step together`, good: `total_loss = 0
for x, y in loader:
    loss = loss_fn(model(x), y)
    loss.backward(); opt.step(); opt.zero_grad()
    total_loss += loss.detach()   # just the value, no history`, why: "total_loss becomes a tensor linked by autograd to every step's loss, so the history keeps growing (the classic example in PyTorch's FAQ). backward() has already freed the big activations, so it grows slowly, but it never stops." },
  };
  const b = BUGS[bug];
  const X = (s) => 30 + (s / steps) * 470, Y = (m) => 150 - (Math.min(m, 16) / 16) * 135;
  return (
    <div>
      <Frame>Two famous ways to leak GPU memory. Pick one, look at the memory curve, then press Fix.</Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {Object.entries(BUGS).map(([k, v]) => <Btn key={k} ghost={bug !== k} onClick={() => { setBug(k); setFixed(false); }}>{v.label}</Btn>)}
      </div>
      <Code color={fixed ? C.green : C.red} title={fixed ? "✅ FIXED" : "❌ LEAKS"}>{fixed ? b.good : b.bad}</Code>
      <svg viewBox="0 0 520 165" style={{ width: "100%", marginTop: 10, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <line x1="30" x2="500" y1={Y(14.7)} y2={Y(14.7)} stroke={C.red} strokeDasharray="5 4" /><text x="34" y={Y(14.7) - 4} fill={C.red} fontSize="10">T4 limit ≈ 14.7 GiB</text>
        <polyline fill="none" stroke={fixed ? C.green : C.orange} strokeWidth="2.5" points={Array.from({ length: steps + 1 }, (_, s) => `${X(s)},${Y(mem(s))}`).join(" ")} />
        {oomAt && oomAt <= steps && <text x={X(oomAt)} y={Y(14.7) + 16} fill={C.red} fontSize="11" textAnchor="middle">💥 OOM at step {oomAt}</text>}
        {oomAt && oomAt > steps && <text x="300" y={Y(mem(steps)) - 8} fill={C.orange} fontSize="11">still climbing… OOM eventually</text>}
        <text x="430" y="160" fill={C.muted} fontSize="10">steps →</text>
      </svg>
      <div style={{ marginTop: 8 }}><Btn onClick={() => setFixed((v) => !v)} color={fixed ? C.red : C.green}>{fixed ? "◀ Show the bug" : "▶ Fix it"}</Btn></div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginTop: 8 }}>{b.why}</div>
      <Insight color={C.orange} title="A memory curve that climbs every step is a leak. A flat curve that's simply too high is a sizing problem.">
        That one observation tells you which fix you need. The cure is always the same idea: keep values, not graphs (detach, .item(), or no_grad). (Illustrative curves.)
      </Insight>
    </div>
  );
}

// ── Section 4: The OOM debugging flowchart ──
const FLOW = {
  start: { q: "When does the OOM happen?", opts: [["On the very first batch", "first"], ["After many steps (it worked at first)", "later"], ["Only during evaluation", "evalq"]] },
  first: { a: "The job is simply too big: a sizing problem (Unit 7.2).", fixes: ["Halve the batch size (then use gradient accumulation to keep the effective batch)", "Turn on mixed precision (autocast)", "Use gradient checkpointing", "For running a big model: quantise to INT8/INT4"] },
  later: { a: "Memory grows step by step: a leak, or inputs that keep getting bigger.", fixes: ["Look for tensors kept across steps: store outputs under no_grad or with .detach()", "Accumulate with total_loss += loss.detach(), not += loss", "Check whether sequence lengths or image sizes vary: the biggest batch sets the peak"] },
  evalq: { a: "Evaluation is building graphs it never uses.", fixes: ["Wrap evaluation in with torch.no_grad(): (or torch.inference_mode())", "Use a smaller evaluation batch if needed", "Call model.eval() too (for layers like dropout), though that alone doesn't save memory"] },
};
function FlowWidget() {
  const [node, setNode] = useState("start");
  const n = FLOW[node];
  return (
    <div>
      <Frame>When you hit "CUDA out of memory", don't guess. Walk through this.</Frame>
      <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `1.5px solid ${C.accent}` }}>
        {node === "start" ? (
          <div>
            <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{n.q}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{n.opts.map(([t, k]) => <Btn key={k} onClick={() => setNode(k)}>{t}</Btn>)}</div>
          </div>
        ) : (
          <div>
            <div style={{ color: C.yellow, fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}>Diagnosis: {n.a}</div>
            {n.fixes.map((f, i) => <div key={i} style={{ color: C.text, fontSize: 13, marginBottom: 4 }}>{i + 1}. {f}</div>)}
            <div style={{ marginTop: 10 }}><Btn ghost onClick={() => setNode("start")}>↺ Start again</Btn></div>
          </div>
        )}
      </div>
      <div style={{ color: C.muted, fontSize: 12.5, marginTop: 10, lineHeight: 1.7 }}>
        <b style={{ color: C.text }}>Colab tip:</b> after an OOM, memory may stay reserved. Delete big tensors (<code>del x</code>), run <code>torch.cuda.empty_cache()</code>,
        and if it's still stuck, <b>Runtime → Restart session</b>.
      </div>
      <Insight color={C.green} title="First batch → too big. Grows over time → leak. Only in evaluation → missing no_grad.">
        Three questions solve the vast majority of out-of-memory errors.
      </Insight>
      <LabCard part="C" title="Cause an OOM, read it, fix it, and catch a leak"
        what="Deliberately trigger an OOM with a huge batch, catch the error and read its numbers, fix it with a smaller batch and with autocast; then reproduce the preds.append(model(x)) leak, watch memory_allocated() climb, and fix it with no_grad."
        expect="a real OutOfMemoryError message, a working run after each fix, and a climbing memory curve that goes flat after the leak fix." />
    </div>
  );
}
//@@SECTIONS
[["Read nvidia-smi", "🩺 Read nvidia-smi — the GPU's dashboard", "SmiWidget"],
 ["The OOM Message", "💥 Anatomy of 'CUDA out of memory'", "OomWidget"],
 ["Classic Leaks", "🕳️ The Classic Leaks", "LeakWidget"],
 ["Debug Flowchart", "🧭 The OOM Debugging Flowchart", "FlowWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "nvidia-smi shows GPU-Util 100%. What does that tell you for certain?", options: ["Every core is busy", "At least one kernel was running nearly all the time", "The GPU is overheating", "Memory is full"], answer: 1, explain: "GPU-Util measures time with a kernel active, not how many cores are busy. A tiny kernel running non-stop also shows 100%." },
  { q: "You delete a big tensor, but nvidia-smi still shows the same memory used. Why?", options: ["It's a leak", "PyTorch's caching allocator keeps the freed memory reserved for reuse", "nvidia-smi is broken", "The CPU is holding it"], answer: 1, explain: "Freed blocks stay reserved in PyTorch's cache. torch.cuda.empty_cache() releases them to the driver." },
  { q: "Memory rises steadily every step until OOM at step 300. The most likely cause is…", options: ["Batch size too large", "A leak: tensors with graphs kept across steps, like preds.append(model(x)) without no_grad", "Wrong learning rate", "The GPU is too slow"], answer: 1, explain: "A too-large batch fails immediately; steady growth means something with a graph is being kept across steps." },
  { q: "OOM happens only in the evaluation loop. The best first fix is…", options: ["Buy a bigger GPU", "Wrap evaluation in torch.no_grad()", "Increase the learning rate", "Use more DataLoader workers"], answer: 1, explain: "Without no_grad, evaluation saves activations for a backward pass that never happens." },
];
const RESULT = {
  perfect: "Perfect! You can diagnose GPU memory problems like a pro.",
  good: "Good. Replay 'Classic Leaks' and fix both bugs.",
  low: "Revisit 'The Debugging Flowchart': first batch, over time, or evaluation only?",
  done: "Unit 7.3 Complete!",
  body: "You can read nvidia-smi, decode an OOM message, tell allocated from reserved memory, and find and fix leaks.",
  next: "Next up: Unit 7.4 — Many GPUs & Other Accelerators.",
  teaser: "How do thousands of GPUs train one model together, and what are TPUs and NPUs?",
};
//@@WORDS
const UNIT_WORDS = [
  ["nvidia-smi", "NVIDIA System Management Interface", "Command-line dashboard for NVIDIA GPUs.", "from Unit 3.1"],
  ["GiB / MiB", "gibibyte / mebibyte", "2³⁰ / 2²⁰ bytes, slightly more than GB / MB.", "new here"],
  ["GPU-Util", "GPU utilisation", "Share of time a kernel was running.", "new here"],
  ["no_grad", "torch.no_grad()", "Turns off graph-building, for evaluation and inference.", "new here"],
  ["detach", "tensor.detach()", "The same numbers, cut off from the computation graph.", "from Unit 5.C"],
];
