//@@META
{"unit": "5.C", "module": 5, "title": "Capstone: Where Did the Time Go?", "icon": "🏆", "lab": "Lab05_CPU_GPU_Teamwork.ipynb", "labNo": 5, "gpu": true}
//@@WIDGETS

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
//@@SECTIONS
[["The Mission", "🎯 The Mission — the case of the starving GPU", "MissionWidget"],
 ["Build in Steps", "🪜 Build in Steps — measure before you fix", "BuildWidget"],
 ["Play It", "▶️ Play It — fix the pipeline", "PlayWidget"],
 ["Full Code & Lab", "📜 Full Code — and profile it for real", "CodeWidget"]]
//@@QUIZ
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
//@@WORDS
const UNIT_WORDS = [
  ["profiler", "a performance-measuring tool", "Records how long every operation and kernel takes.", "new here"],
  ["utilisation", "busy share", "The percentage of time the GPU is actually computing.", "new here"],
  ["pin_memory", "page-locked memory option", "Makes host-to-GPU copies faster and able to overlap (Unit 5.1).", "from Unit 5.1"],
  ["sync", "synchronisation", "The CPU waiting for the GPU (Unit 5.4).", "from Unit 5.4"],
];
