//@@META
{"unit": "5.5", "module": 5, "title": "Capstone: Speed Up a Training Run", "icon": "🏆", "lab": "CoreLab11_Batch_Size_and_the_Ladder.ipynb", "labNo": "Core Lab 11", "gpu": true}
//@@WIDGETS

// ── Section 1: The Mission ──
const TOOLS = [
  ["Measure honestly: synchronise before reading the clock", "Lesson 4.4"],
  ["No per-step sync points; metrics on the GPU", "Lessons 4.4, 4.C"],
  ["Background workers + pinned memory", "Lessons 4.1, 4.4"],
  ["A batch size that fills the GPU", "Lesson 5.4"],
  ["Mixed precision: FP16 Tensor Cores + loss scaling", "Lesson 5.2"],
  ["Keep the data on the GPU when it fits", "Lessons 4.1, 5.3"],
];
function MissionWidget() {
  const [ticks, setTicks] = useState([]);
  return (
    <div>
      <Frame>
        Your project team must demo a clothing classifier (<b style={{ color: C.text }}>Fashion-MNIST</b>: 60,000 grey 28 × 28 photos of shirts, shoes, bags… in 10 classes)
        tomorrow. The network is a wide version of what you built in Step 1: 784 → 1024 → 1024 → 10. The current code trains far too slowly to try ideas.
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
  { tag: "v2", title: "+ feed the GPU", color: C.yellow, why: "Fix the pipeline (Step 4): background workers, pinned memory, non-blocking copies, a bigger batch, and no per-step sync. The maths is unchanged.", code: `loader = DataLoader(train_data, batch_size=256, shuffle=True,
                    num_workers=2, pin_memory=True)
running = torch.zeros((), device="cuda")
for x, y in loader:
    x = x.to("cuda", non_blocking=True); y = y.to("cuda", non_blocking=True)
    loss = loss_fn(model(x), y)
    opt.zero_grad(set_to_none=True); loss.backward(); opt.step()
    running += loss.detach()                       # stays on the GPU` },
  { tag: "v3", title: "+ Tensor Cores and data on the GPU", color: C.green, why: "Now speed up the work itself: mixed precision (Lesson 5.2) and, since the whole dataset is only about 190 MB, keep it on the GPU and slice batches from it, with no loader at all.", code: `X = train_data.data.float().div(255).view(-1, 784).to("cuda")   # whole dataset, once
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
const LADDER = [   // the book's run on Colab's Tesla T4 (Section 5.5, Core Lab 11 Part B)
  { t: "Baseline: batch 32, .item() every step", s: 9.17, acc: 81.8, why: "The starting point." },
  { t: "Remove the per-step .item() sync", s: 8.23, acc: 81.8, why: "The CPU no longer stops to wait for the GPU every step." },
  { t: "num_workers=2 + pin_memory + non_blocking", s: 10.90, acc: 81.8, why: "SLOWER on Colab! It has only 2 CPU cores, so the two helper processes and the training loop fight over them, and handing tiny batches between processes costs more than loading them saves. Workers pay off when loading is heavy and cores are spare." },
  { t: "Batch size 32 → 256 (learning rate scaled up)", s: 6.30, acc: 79.0, why: "8× fewer steps, so far less per-step overhead; the GPU gets enough work per step." },
  { t: "Mixed precision (autocast + GradScaler)", s: 5.65, acc: 80.1, why: "Only a little help here, and in another T4 run it was slower than rung 3 (6.8 s vs 5.4 s). While the CPU still loads and copies every batch, the GPU's arithmetic isn't what holds these rungs back, so faster arithmetic barely shows. Even with the data on the GPU this network is too small for it: at batch 256 an epoch took 0.32 s in FP32 but 0.54 s mixed; at batch 1,024 mixed was 1.5× faster. A trick only pays when it speeds up the part that is slow." },
  { t: "Whole dataset kept on the GPU", s: 0.47, acc: 81.7, why: "The biggest jump: no DataLoader, no PCIe copies, no waiting at all." },
];
function PlayWidget() {
  const [k, setK] = useState(0);
  const base = LADDER[0].s, maxS = Math.max(...LADDER.map((r) => r.s));
  return (
    <div>
      <Frame>Climb the ladder one rung at a time. Each rung adds ONE change. (One epoch each, from the book's run on Colab's T4; you'll measure your own in Core Lab 11.)</Frame>
      {LADDER.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, opacity: i <= k ? 1 : 0.35 }}>
          <div style={{ width: 22, color: i <= k ? C.green : C.muted, fontWeight: 700 }}>{i}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.text, fontSize: 12.5 }}>{r.t}</div>
            <div style={{ height: 14, background: C.card, borderRadius: 4, marginTop: 3 }}><div style={{ width: `${(r.s / maxS) * 100}%`, height: "100%", borderRadius: 4, background: i === 0 ? C.red : i === k ? C.green : C.accent }} /></div>
          </div>
          <div style={{ width: 120, textAlign: "right", fontFamily: "monospace", fontSize: 12, color: C.text }}>{r.s.toFixed(2)} s · {r.acc}%</div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <Btn onClick={() => setK((v) => Math.min(LADDER.length - 1, v + 1))} color={C.green}>Climb ▶</Btn>
        <Btn ghost onClick={() => setK(0)}>↺ Back to baseline</Btn>
      </div>
      <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8, minHeight: 20 }}>{LADDER[k].why}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
        <Stat label="EPOCH TIME" value={`${LADDER[k].s.toFixed(2)} s`} color={C.green} />
        <Stat label="SPEED-UP" value={`${(base / LADDER[k].s).toFixed(1)}×`} color={base / LADDER[k].s >= 5 ? C.green : C.yellow} />
        <Stat label="TEST ACCURACY" value={`${LADDER[k].acc}%`} color={C.purple} />
      </div>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 4 }}>After a single epoch, accuracy wobbles by a couple of percent from run to run (different shuffles); that's noise, not damage. Compare over 2–3 epochs to be sure.</div>
      <Insight color={C.green} title="About 19× faster, with the same accuracy, and the model never changed.">
        Not every rung helps on every machine, and that is the real lesson: measure each change. Most speed came from feeding the GPU properly. The skills you
        built in Steps 2–5 are exactly these.
      </Insight>
    </div>
  );
}

// ── Section 4: Full code + lab ──
function CodeWidget() {
  return (
    <div>
      <Frame>The finished, fast training script. Core Lab 11, Part B, runs the baseline and each rung of the ladder on the T4, so you'll fill in a table of your own measurements.</Frame>
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
      <Insight color={C.purple} title="One more rung this ladder does not try: kernel fusion.">
        Each element-wise step (add the bias, then ReLU, …) normally runs as a kernel of its own that reads and writes the whole tensor. Fusing them
        into one kernel reads the data once: the memory-bound fix of Lesson 5.3. <code>model = torch.compile(model)</code> does this for you. The first
        steps pay a compile time, and on a model this small the gain may be modest, so measure it like any other rung.
      </Insight>
      <LabCard part="B" title="Climb the ladder for real"
        what="Run the baseline, then add one change at a time (no per-step sync → workers and pinned memory → batch 256 → autocast → data on GPU), timing one epoch and checking test accuracy at each rung."
        expect="most rungs faster than the last, but not all (on Colab, workers and mixed precision may not help); a total speed-up near 19× once the data lives on the GPU; test accuracy around 80%, give or take a few percent." />
      <Insight color={C.orange} title="First half of Step 5 done: you know why GPUs make AI fast, and how to make them go faster.">
        Second half: GPUs in real AI projects. The software stack, sizing memory, fixing 'out of memory', and many GPUs at once.
      </Insight>
    </div>
  );
}
//@@SECTIONS
[["The Mission", "🎯 The Mission — 5× faster by tomorrow", "MissionWidget"],
 ["Build in Steps", "🪜 Build in Steps — feed it, then speed it", "BuildWidget"],
 ["Play It", "▶️ Play It — the speed-up ladder", "PlayWidget"],
 ["Full Code & Lab", "📜 Full Code — and climb the ladder for real", "CodeWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "Why change only ONE thing at a time when optimising?", options: ["It's faster to type", "So you know exactly which change caused which effect on speed and accuracy", "PyTorch requires it", "To save GPU memory"], answer: 1, explain: "Changing several things at once hides which fix helped, which did nothing, and which hurt accuracy." },
  { q: "Going from batch 32 to batch 256 gave the biggest single jump. Why?", options: ["Bigger batches skip the backward pass", "8× fewer steps means 8× less per-step overhead, and each step fills the GPU better", "It lowers the learning rate", "It uses the CPU less"], answer: 1, explain: "Fixed per-step costs (launches, Python, data handling) are paid 8× less often, and larger matrix multiplies use the SMs fully." },
  { q: "Why could the whole Fashion-MNIST dataset be kept on the GPU?", options: ["The GPU has unlimited memory", "It's only about 190 MB as floats, far less than the T4's 16 GB", "PyTorch compresses it", "It's stored on the CPU"], answer: 1, explain: "60,000 × 784 floats × 4 bytes ≈ 188 MB. It fits easily, so the loop needs no loading or copying." },
  { q: "After all the optimisations, the accuracy stayed about the same. What does that show?", options: ["The optimisations were useless", "They changed how the work is done, not what the model computes", "Accuracy can't change", "The test set was too small"], answer: 1, explain: "Feeding, batching and precision change the speed; the model and its maths stay the same (FP16 rounding barely matters, Lesson 5.2)." },
];
const RESULT = {
  perfect: "Perfect! You can make real training runs fast.",
  good: "Good. Replay 'Play It' and explain each rung in your own words.",
  low: "Revisit 'Build in Steps': first feed the GPU, then speed up the work.",
  done: "Lesson 5.5 Complete! 🚀",
  body: "Halfway through Step 5: you know why GPUs make AI fast (tiling, Tensor Cores, low precision, the roofline) and how to apply that to speed up real training.",
  next: "Next up: Lesson 5.6 — The Software Stack.",
  teaser: "The software stack, will-it-fit memory maths, fixing 'CUDA out of memory', and training on many GPUs.",
};
//@@WORDS
const UNIT_WORDS = [
  ["Fashion-MNIST", "a clothing-image dataset", "70,000 grey 28 × 28 photos of clothes in 10 classes, the same shape as MNIST.", "new here"],
  ["momentum", "an optimiser setting", "Lets gradient descent keep some of its previous direction, so it moves faster.", "new here"],
  ["AMP", "Automatic Mixed Precision", "autocast + GradScaler (Lesson 5.2).", "from Lesson 5.2"],
  ["torch.compile", "PyTorch's compiler", "Fuses operations to cut memory traffic (Lesson 5.3).", "from Lesson 5.3"],
];
