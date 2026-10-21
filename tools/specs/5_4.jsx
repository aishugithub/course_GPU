//@@META
{"unit": "5.4", "module": 5, "title": "Async Launch & Synchronization", "icon": "📬", "lab": "Lab05_CPU_GPU_Teamwork.ipynb", "labNo": 5, "gpu": true}
//@@WIDGETS

// ── Section 1: Need — the impossible timing ──
function NeedWidget() {
  const [synced, setSynced] = useState(false);
  return (
    <div>
      <Frame>
        A student times a 4096 × 4096 matrix multiply on the T4: 137 billion FLOPs. The stopwatch says <b style={{ color: C.red }}>0.03 ms</b>, which would be
        4,500 TFLOPS, about 70× the GPU's peak. Something is wrong. Toggle the fix.
      </Frame>
      <Btn onClick={() => setSynced((v) => !v)} color={synced ? C.green : C.red}>{synced ? "◀ Show the wrong timing" : "▶ Add synchronisation"}</Btn>
      <div style={{ marginTop: 12 }}>
        <Code color={synced ? C.green : C.red} title={synced ? "✅ CORRECT TIMING" : "❌ WRONG TIMING"}>{synced ? `torch.cuda.synchronize()          # wait for earlier GPU work
t0 = time.perf_counter()
c = a @ b                         # launch
torch.cuda.synchronize()          # WAIT until the GPU has finished
t1 = time.perf_counter()
print((t1 - t0) * 1000, "ms")     # ≈ 30 ms  →  ≈ 4.5 TFLOPS  ✓` : `t0 = time.perf_counter()
c = a @ b                         # launch
t1 = time.perf_counter()
print((t1 - t0) * 1000, "ms")     # 0.03 ms ?!`}</Code>
      </div>
      <Insight color={synced ? C.green : C.red} title={synced ? "Now the stopwatch waits for the GPU, and the number is believable." : "The stopwatch measured how long it took to GIVE the order, not to DO the work."}>
        A GPU launch is <b>asynchronous</b>: the CPU drops the job into the GPU's queue and moves straight on, without waiting. This unit explains the
        queue, and why it's a feature, not a bug.
      </Insight>
    </div>
  );
}

// ── Section 2: The command queue ──
const CMDS = ["copy x → GPU", "matmul", "relu", "matmul", "softmax", "copy result → CPU"];
function QueueWidget() {
  const [t, setT] = useState(0);
  const issued = Math.min(CMDS.length, t * 2);       // the CPU issues fast
  const done = Math.max(0, Math.min(CMDS.length, t - 1));  // the GPU finishes one per tick, after a delay
  const cpuWaiting = t >= 3 && done < CMDS.length;
  return (
    <div>
      <Frame>
        Like ordering at a busy restaurant: you hand over your order slip and go back to your table; the kitchen works through the slips
        in order. The CPU puts GPU commands into a queue (CUDA calls it a <b style={{ color: C.accent }}>stream</b>) and carries on. Step through time.
      </Frame>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: C.card, borderRadius: 10, padding: 10, border: `1.5px solid ${C.orange}` }}>
          <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>🧠 CPU (host)</div>
          {CMDS.map((c, i) => <div key={i} style={{ fontFamily: "monospace", fontSize: 11.5, color: i < issued ? C.text : C.border }}>{i < issued ? "✓ queued: " : "   "}{c}</div>)}
          <div style={{ fontFamily: "monospace", fontSize: 11.5, marginTop: 6, color: cpuWaiting ? C.red : t >= 3 ? C.green : C.border }}>{t < 3 ? "" : cpuWaiting ? "⏳ print(result) → must WAIT" : "✓ print(result)"}</div>
        </div>
        <div style={{ background: C.card, borderRadius: 10, padding: 10, border: `1.5px solid ${C.green}` }}>
          <div style={{ color: C.green, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>⚡ GPU queue (stream)</div>
          {CMDS.map((c, i) => <div key={i} style={{ fontFamily: "monospace", fontSize: 11.5, color: i < done ? C.green : i === done && i < issued ? C.yellow : i < issued ? C.text : C.border }}>{i < done ? "✓ done:    " : i === done && i < issued ? "▶ running: " : i < issued ? "  waiting: " : "   "}{c}</div>)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Btn onClick={() => setT((v) => Math.min(8, v + 1))}>Time ▶ ({t})</Btn>
        <Btn ghost onClick={() => setT(0)}>↺ Reset</Btn>
      </div>
      <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8, lineHeight: 1.6 }}>
        {t === 0 ? "Press Time." : t < 3 ? "The CPU races ahead, queuing commands much faster than the GPU runs them." : cpuWaiting ? "The CPU needs an actual VALUE (to print it), so it has to wait for the queue to finish: a synchronisation point." : "Everything finished; the CPU got its value."}
      </div>
      <Insight color={C.accent} title="Launches return immediately. The CPU only waits when it needs a result.">
        Like the interrupt-driven I/O in COA (Hamacher Ch 3): start the device, carry on with other work, and get notified when it's done,
        instead of standing over the device.
      </Insight>
    </div>
  );
}

// ── Section 3: Overlap is the payoff ──
function OverlapWidget() {
  const [mode, setMode] = useState("serial");
  const steps = 5, prep = 6, gpu = 8;
  const serial = steps * (prep + gpu);
  const overlap = prep + steps * Math.max(prep, gpu);
  const T = mode === "serial" ? serial : overlap;
  const X = (v) => (v / serial) * 100;
  return (
    <div>
      <Frame>
        Because launches don't wait, the CPU can prepare the <b style={{ color: C.orange }}>next batch</b> (load and decode images) while the GPU is still training on the
        <b style={{ color: C.green }}> current</b> one. Compare doing them one after the other with overlapping them.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Btn ghost={mode !== "serial"} onClick={() => setMode("serial")} color={C.red}>One after the other</Btn>
        <Btn ghost={mode !== "overlap"} onClick={() => setMode("overlap")} color={C.green}>Overlapped</Btn>
      </div>
      {["CPU", "GPU"].map((lane) => (
        <div key={lane} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 40, color: lane === "CPU" ? C.orange : C.green, fontSize: 12, fontWeight: 700 }}>{lane}</div>
          <div style={{ position: "relative", flex: 1, height: 26, background: C.card, borderRadius: 4 }}>
            {Array.from({ length: steps }, (_, k) => {
              const start = mode === "serial" ? k * (prep + gpu) + (lane === "GPU" ? prep : 0) : lane === "CPU" ? k * Math.max(prep, gpu) : prep + k * Math.max(prep, gpu);
              const len = lane === "CPU" ? prep : gpu;
              return <div key={k} style={{ position: "absolute", left: `${X(start)}%`, width: `${X(len)}%`, top: 2, bottom: 2, background: lane === "CPU" ? C.orange : C.green, borderRadius: 3, fontSize: 9.5, color: "#0D1117", display: "flex", alignItems: "center", justifyContent: "center" }}>{lane === "CPU" ? `prep ${k + 1}` : `train ${k + 1}`}</div>;
            })}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="TOTAL TIME (5 BATCHES)" value={`${T} units`} color={mode === "serial" ? C.red : C.green} />
        <Stat label="GPU BUSY" value={`${Math.round((steps * gpu / T) * 100)}%`} color={mode === "serial" ? C.red : C.green} />
      </div>
      <Insight color={C.green} title="Overlap turns 'prep + train' into 'whichever is slower'.">
        This is what PyTorch's DataLoader does with <code>num_workers</code> (CPU processes preparing batches in the background) and
        <code> pin_memory=True</code> + <code>.to("cuda", non_blocking=True)</code> (copies that run while the GPU computes). It's Amdahl's law (Unit 3.4)
        fought with parallelism.
      </Insight>
    </div>
  );
}

// ── Section 4: Hidden synchronisation points ──
const LOOP = [
  { l: "for images, labels in loader:", sync: false, why: "Fine: loading happens on CPU workers." },
  { l: "    images = images.to('cuda', non_blocking=True)", sync: false, why: "With pinned memory, this copy is queued and doesn't make the CPU wait." },
  { l: "    loss = loss_fn(model(images), labels)", sync: false, why: "Kernel launches: queued, no waiting." },
  { l: "    loss.backward(); opt.step(); opt.zero_grad()", sync: false, why: "More launches: queued." },
  { l: "    total += loss.item()", sync: true, why: "SYNC! .item() needs the actual number on the CPU, so the CPU waits for ALL queued GPU work, every iteration." },
  { l: "    if torch.isnan(loss):", sync: true, why: "SYNC! A Python 'if' needs a real True/False, so the GPU result must be fetched." },
  { l: "    print(loss)", sync: true, why: "SYNC! Printing a GPU tensor copies it to the CPU." },
  { l: "    preds.append(model(images).cpu())", sync: true, why: "SYNC! .cpu() is a copy out, and it must wait for the result." },
];
function HiddenSyncWidget() {
  const [pick, setPick] = useState({});
  const found = LOOP.filter((x, i) => pick[i] && x.sync).length;
  return (
    <div>
      <Frame>
        Some innocent-looking lines force the CPU to stop and wait for the GPU, which kills the overlap. Click every line you think causes a
        synchronisation in this training loop.
      </Frame>
      <pre style={{ margin: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, fontFamily: "monospace", fontSize: 11.5, lineHeight: 1.6 }}>
        {LOOP.map((x, i) => {
          const p = pick[i];
          return (
            <div key={i} onClick={() => setPick((s) => ({ ...s, [i]: true }))} style={{ cursor: "pointer", padding: "2px 6px", borderRadius: 4, color: C.text, background: p ? (x.sync ? C.red + "22" : C.green + "18") : "transparent", borderLeft: `3px solid ${p ? (x.sync ? C.red : C.green) : "transparent"}` }}>
              {x.l}
              {p && <div style={{ fontFamily: "'Segoe UI', sans-serif", fontSize: 11.5, color: x.sync ? C.red : C.green }}>{x.why}</div>}
            </div>
          );
        })}
      </pre>
      <div style={{ color: C.muted, fontSize: 12.5, marginTop: 8 }}>Sync points found: {found} / 4</div>
      <Insight color={C.red} title="Anything that needs a GPU value on the CPU forces a wait: .item(), .cpu(), print, Python if on a tensor.">
        They're fine occasionally (say every 100 steps for logging), but harmful in every iteration. The standard fix: accumulate on the GPU, and fetch
        once at the end of the epoch.
      </Insight>
      <LabCard part="D" title="Wrong vs right timing, and the cost of .item()"
        what="Time a matrix multiply with and without torch.cuda.synchronize(), then train a small model for an epoch calling loss.item() every step vs only at the end, and compare."
        expect="an impossibly fast unsynchronised time, a realistic synchronised one, and the every-step .item() version measurably slower." />
    </div>
  );
}
//@@SECTIONS
[["The Impossible Timing", "⏱️ The Impossible Timing — 70× faster than peak?", "NeedWidget"],
 ["The Command Queue", "📬 The Command Queue — launch and carry on", "QueueWidget"],
 ["Overlap", "🔀 Overlap — prepare the next batch while the GPU trains", "OverlapWidget"],
 ["Hidden Sync Points", "🕵️ Hidden Sync Points — lines that make the CPU wait", "HiddenSyncWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "Why did timing c = a @ b without synchronisation give an impossibly small number?", options: ["The GPU cached the result", "The launch returns immediately; the timer stopped before the GPU finished", "Matrix multiplication is free", "The CPU did the work"], answer: 1, explain: "GPU launches are asynchronous. You must call torch.cuda.synchronize() before reading the clock." },
  { q: "Which line forces the CPU to wait for the GPU?", options: ["y = model(x)", "loss.backward()", "value = loss.item()", "x = x.to('cuda', non_blocking=True)"], answer: 2, explain: ".item() returns a Python number, which requires the GPU's result to be finished and copied over." },
  { q: "CPU prep takes 6 ms per batch and GPU training 8 ms. Overlapped, 100 batches take about…", options: ["1,400 ms", "800 ms", "600 ms", "200 ms"], answer: 1, explain: "Overlapped, each step costs max(6, 8) = 8 ms: about 800 ms (plus one initial prep), instead of 1,400 ms in sequence." },
  { q: "The asynchronous GPU queue is most like which COA idea?", options: ["Polling a device in a loop", "Interrupt-driven I/O: start the device, carry on, get notified when it's done", "Microprogrammed control", "Direct-mapped cache"], answer: 1, explain: "Like interrupt-driven I/O, the CPU doesn't stand and wait. It issues work and continues, synchronising only when it needs the result." },
];
const RESULT = {
  perfect: "Perfect! You won't be fooled by GPU timings.",
  good: "Good. Replay 'Hidden Sync Points' and find all four.",
  low: "Revisit 'The Command Queue': launch and carry on, wait only when needed.",
  done: "Unit 5.4 Complete!",
  body: "You can explain asynchronous launches, streams, synchronisation, overlap, and hidden sync points.",
  next: "Next up: Unit 5.C — Capstone: Where Did the Time Go?",
  teaser: "A team's GPU training is mysteriously slow. Profile it, find the culprits, fix them.",
};
//@@WORDS
const UNIT_WORDS = [
  ["async", "asynchronous", "Doesn't wait for the work to finish before returning.", "new here"],
  ["stream", "a CUDA command queue", "GPU commands in one stream run in order; the CPU keeps going.", "new here"],
  ["sync", "synchronise", "Make the CPU wait until the GPU's queued work is finished.", "new here"],
  ["non_blocking", "a PyTorch copy option", "Lets a copy from pinned memory run without making the CPU wait.", "new here"],
  ["DataLoader", "PyTorch's batch loader", "Prepares batches, optionally with background CPU workers.", "from Unit 3.4"],
];
