//@@META
{"unit": "5.2", "module": 5, "title": "The Five Steps of Offloading", "icon": "🖐️", "lab": "Lab05_CPU_GPU_Teamwork.ipynb", "labNo": 5, "gpu": true}
//@@WIDGETS

const STEPS = [
  { k: "alloc", t: "1 · Allocate", c: C.purple, d: "The CPU asks the GPU driver to reserve space in GPU memory for the inputs and the output. Nothing is copied yet; it's like booking seats.", cuda: [2, 3], torch: [1] },
  { k: "in", t: "2 · Copy in", c: C.yellow, d: "The input data travels from host RAM to device memory over PCIe, moved by the GPU's DMA engine (COA Unit 5).", cuda: [5, 6], torch: [2] },
  { k: "launch", t: "3 · Launch the kernel", c: C.green, d: "The CPU tells the GPU: run THIS function on THIS many threads. The thousands of threads (Modules 3–4) do the work. The CPU doesn't wait; it carries on (Unit 5.4).", cuda: [8], torch: [3] },
  { k: "out", t: "4 · Copy out", c: C.yellow, d: "The result travels back from device memory to host RAM over PCIe, so the CPU can print it, save it, or use it in decisions.", cuda: [10], torch: [4] },
  { k: "free", t: "5 · Free", c: C.purple, d: "The GPU memory is released so other data can use it. Forget this in a loop and GPU memory slowly fills up (Unit 7.3).", cuda: [12, 13], torch: [5] },
];
const CUDA_LINES = [
  "// host code (runs on the CPU), CUDA C",
  "float *dA, *dB;                                   // device pointers",
  "cudaMalloc(&dA, n * sizeof(float));               // 1 allocate",
  "cudaMalloc(&dB, n * sizeof(float));",
  "",
  "cudaMemcpy(dA, hA, n * sizeof(float),",
  "           cudaMemcpyHostToDevice);               // 2 copy in",
  "",
  "relu<<<(n + 255) / 256, 256>>>(dA, dB, n);        // 3 launch",
  "",
  "cudaMemcpy(hB, dB, n * sizeof(float), cudaMemcpyDeviceToHost);  // 4 copy out",
  "",
  "cudaFree(dA);                                     // 5 free",
  "cudaFree(dB);",
];
const TORCH_LINES = [
  "# the same five steps in PyTorch",
  "b_gpu = torch.empty(n, device='cuda')    # 1 allocate",
  "a_gpu = a_cpu.to('cuda')                 # 2 copy in (allocates too)",
  "torch.clamp(a_gpu, min=0, out=b_gpu)     # 3 launch a kernel (ReLU)",
  "b_cpu = b_gpu.cpu()                      # 4 copy out",
  "del a_gpu, b_gpu                         # 5 free (PyTorch keeps it cached)",
];

// ── Section 1: Need — what hides behind one line ──
function NeedWidget() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Frame>
        In PyTorch, running something on the GPU looks like one innocent line. Behind it, the CPU and GPU go through a fixed routine. Click to
        unfold it.
      </Frame>
      <Code color={C.accent}>{`y = torch.relu(x.to("cuda")).cpu()`}</Code>
      <div style={{ marginTop: 10 }}><Btn onClick={() => setOpen((v) => !v)} color={C.purple}>{open ? "▲ Fold it back" : "▼ What really happens?"}</Btn></div>
      {open && (
        <div style={{ marginTop: 12 }}>
          {STEPS.map((s) => (
            <div key={s.k} style={{ display: "flex", gap: 10, alignItems: "center", background: C.card, border: `1.5px solid ${s.c}`, borderRadius: 8, padding: "8px 12px", marginBottom: 6 }}>
              <b style={{ color: s.c, fontSize: 13, minWidth: 140 }}>{s.t}</b>
              <span style={{ color: C.muted, fontSize: 12.5 }}>{s.d.split(".")[0]}.</span>
            </div>
          ))}
        </div>
      )}
      <Insight color={C.purple} title="Every GPU job, in every framework, follows the same five steps.">
        Allocate → copy in → launch → copy out → free. Knowing them explains GPU errors, slowness and memory problems.
      </Insight>
    </div>
  );
}

// ── Section 2: Step through it ──
function StepWidget() {
  const [i, setI] = useState(-1);
  const host = { a: true, b: i >= 3 };
  const dev = { a: i >= 1 && i < 4, slots: i >= 0 && i < 4, b: i >= 2 && i < 4 };
  const col = i >= 0 ? STEPS[i].c : C.border;
  return (
    <div>
      <Frame>Watch the two memories as the steps happen. The job: ReLU on an array A, giving B.</Frame>
      <svg viewBox="0 0 520 200" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <text x="20" y="20" fill={C.orange} fontSize="11" fontWeight="700">HOST RAM</text>
        <text x="350" y="20" fill={C.green} fontSize="11" fontWeight="700">DEVICE MEMORY</text>
        <rect x="20" y="30" width="150" height="150" rx="8" fill="none" stroke={C.orange} />
        <rect x="350" y="30" width="150" height="150" rx="8" fill="none" stroke={C.green} />
        <rect x="35" y="50" width="120" height="40" rx="6" fill={C.teal + "44"} stroke={C.teal} /><text x="95" y="75" fill={C.text} fontSize="12" textAnchor="middle">A (input)</text>
        {host.b && <g><rect x="35" y="120" width="120" height="40" rx="6" fill={C.green + "44"} stroke={C.green} /><text x="95" y="145" fill={C.text} fontSize="12" textAnchor="middle">B (result)</text></g>}
        {dev.slots && <g><rect x="365" y="50" width="120" height="40" rx="6" fill={dev.a ? C.teal + "44" : "none"} stroke={C.purple} strokeDasharray={dev.a ? "0" : "5 4"} /><text x="425" y="75" fill={C.text} fontSize="12" textAnchor="middle">{dev.a ? "A (copy)" : "space for A"}</text></g>}
        {dev.slots && <g><rect x="365" y="120" width="120" height="40" rx="6" fill={dev.b ? C.green + "44" : "none"} stroke={C.purple} strokeDasharray={dev.b ? "0" : "5 4"} /><text x="425" y="145" fill={C.text} fontSize="12" textAnchor="middle">{dev.b ? "B = ReLU(A)" : "space for B"}</text></g>}
        {i === 1 && <g><line x1="175" y1="70" x2="345" y2="70" stroke={C.yellow} strokeWidth="3" /><text x="260" y="62" fill={C.yellow} fontSize="11" textAnchor="middle">PCIe → (DMA)</text></g>}
        {i === 2 && <text x="425" y="112" fill={C.green} fontSize="11" textAnchor="middle">⚡ thousands of threads</text>}
        {i === 3 && <g><line x1="345" y1="140" x2="175" y2="140" stroke={C.yellow} strokeWidth="3" /><text x="260" y="132" fill={C.yellow} fontSize="11" textAnchor="middle">← PCIe (DMA)</text></g>}
        {i === 4 && <text x="425" y="112" fill={C.purple} fontSize="11" textAnchor="middle">memory released ✓</text>}
      </svg>
      <div style={{ marginTop: 10, minHeight: 46, padding: "8px 12px", borderRadius: 8, background: col + "14", border: `1px solid ${col}55`, color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
        {i < 0 ? "Start: A exists only in host RAM. The GPU knows nothing about it yet." : <><b style={{ color: STEPS[i].c }}>{STEPS[i].t}.</b> {STEPS[i].d}</>}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Btn onClick={() => setI((v) => Math.min(4, v + 1))}>Step ▶ ({i + 1} / 5)</Btn>
        <Btn ghost onClick={() => setI(-1)}>↺ Reset</Btn>
      </div>
      <Insight color={C.yellow} title="Two of the five steps cross PCIe, and only one is the actual computing.">
        That's why Unit 5.1's rule matters: copy once, compute many times.
      </Insight>
    </div>
  );
}

// ── Section 3: The steps in code ──
function CodeMapWidget() {
  const [k, setK] = useState(0);
  const s = STEPS[k];
  return (
    <div>
      <Frame>
        Here are the five steps written in <b style={{ color: C.text }}>CUDA C</b> (the low level, what really happens) and in <b style={{ color: C.accent }}>PyTorch</b> (what
        you'll actually write). Click a step to light up its lines in both.
      </Frame>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {STEPS.map((x, i) => <Btn key={x.k} ghost={i !== k} onClick={() => setK(i)} color={x.c}>{x.t}</Btn>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 12 }}>
        <pre style={{ margin: 0, background: C.card, border: `1.5px solid ${C.orange}`, borderRadius: 10, padding: 10, fontFamily: "monospace", fontSize: 10.5, lineHeight: 1.65, color: C.text, overflowX: "auto" }}>
          <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, marginBottom: 4, fontFamily: "'Segoe UI', sans-serif" }}>⚙️ CUDA C (low level)</div>
          {CUDA_LINES.map((l, n) => <div key={n} style={{ background: s.cuda.includes(n) || (s.k === "in" && n === 6) ? s.c + "33" : "transparent", borderLeft: `3px solid ${s.cuda.includes(n) ? s.c : "transparent"}`, paddingLeft: 4 }}>{l || " "}</div>)}
        </pre>
        <pre style={{ margin: 0, background: C.card, border: `1.5px solid ${C.accent}`, borderRadius: 10, padding: 10, fontFamily: "monospace", fontSize: 10.5, lineHeight: 1.65, color: C.text, overflowX: "auto" }}>
          <div style={{ color: C.accent, fontWeight: 700, fontSize: 12, marginBottom: 4, fontFamily: "'Segoe UI', sans-serif" }}>🔥 PyTorch</div>
          {TORCH_LINES.map((l, n) => <div key={n} style={{ background: s.torch.includes(n) ? s.c + "33" : "transparent", borderLeft: `3px solid ${s.torch.includes(n) ? s.c : "transparent"}`, paddingLeft: 4 }}>{l}</div>)}
        </pre>
      </div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginTop: 10 }}>{s.d}</div>
      <Insight title="PyTorch hides the five steps; it doesn't remove them.">
        <code>.to("cuda")</code> = allocate + copy in. Every operation = a kernel launch. <code>.cpu()</code> = copy out. When a tensor is no longer used,
        PyTorch frees it, but keeps the memory cached for reuse, which is why nvidia-smi can show memory 'in use' (Unit 7.3).
      </Insight>
    </div>
  );
}

// ── Section 4: The timeline — where does the time go? ──
function TimelineWidget() {
  const [reps, setReps] = useState(1);
  const alloc = 0.1, cin = 33, kern = 1.3, cout = 33, free = 0.05;
  const total = alloc + cin + kern * reps + cout + free;
  const parts = [["allocate", alloc, C.purple], ["copy in", cin, C.yellow], [`kernel × ${reps}`, kern * reps, C.green], ["copy out", cout, C.yellow], ["free", free, C.purple]];
  return (
    <div>
      <Frame>
        Typical T4 timings for ReLU on 400 MB (approximate). Change how many GPU operations run on the data before it comes back, and watch
        where the time goes.
      </Frame>
      <Slider label={<>Operations on the GPU before copying back = <b style={{ color: C.green }}>{reps}</b></>} value={reps} min={1} max={300} onChange={setReps} color={C.green} />
      <div style={{ display: "flex", height: 34, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
        {parts.map(([t, v, c]) => <div key={t} title={t} style={{ width: `${(v / total) * 100}%`, minWidth: v > 0.5 ? 3 : 0, background: c, display: "flex", alignItems: "center", justifyContent: "center", color: "#0D1117", fontSize: 10.5, fontWeight: 700, overflow: "hidden", whiteSpace: "nowrap" }}>{v / total > 0.12 ? t : ""}</div>)}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="TOTAL" value={`${total.toFixed(1)} ms`} color={C.text} />
        <Stat label="SHARE THAT IS COMPUTING" value={`${((kern * reps / total) * 100).toFixed(0)}%`} color={kern * reps / total > 0.5 ? C.green : C.red} />
      </div>
      <Insight color={C.green} title="With one operation, about 98% of the time is carrying data. With hundreds, the carrying almost disappears.">
        This is exactly what training does: the model and each batch go to the GPU, then thousands of kernels run on them. Real AI code is built
        around keeping data on the device.
      </Insight>
      <LabCard part="B" title="Do the five steps yourself and time each one"
        what="Using PyTorch, do allocate → copy in → ReLU → copy out → free as separate lines and time each step with synchronisation. Then do the same with CuPy, which looks almost exactly like the CUDA C version."
        expect="the two copies taking far longer than the ReLU itself, and a timing bar much like the one in this section." />
    </div>
  );
}
//@@SECTIONS
[["One Line, Five Steps", "🖐️ One Line, Five Steps — what hides behind .to('cuda')", "NeedWidget"],
 ["Watch It Happen", "🎬 Watch It Happen — two memories, five steps", "StepWidget"],
 ["CUDA C vs PyTorch", "⚙️ CUDA C vs PyTorch — the steps in code", "CodeMapWidget"],
 ["Where the Time Goes", "⏱️ Where the Time Goes — copies vs computing", "TimelineWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "What is the correct order of the five steps?", options: ["Launch, allocate, copy in, copy out, free", "Allocate, copy in, launch, copy out, free", "Copy in, launch, allocate, free, copy out", "Allocate, launch, copy in, free, copy out"], answer: 1, explain: "Reserve the space, bring the data in, run the kernel, bring the result back, release the space." },
  { q: "In PyTorch, which line performs the 'copy out' step?", options: ["x.to('cuda')", "torch.relu(x)", "y.cpu()", "torch.empty(n, device='cuda')"], answer: 2, explain: ".cpu() copies a tensor from device memory back to host RAM." },
  { q: "cudaMemcpy(dA, hA, size, cudaMemcpyHostToDevice) does what?", options: ["Frees device memory", "Copies data from host RAM to device memory", "Launches a kernel", "Copies from device to host"], answer: 1, explain: "HostToDevice: from the CPU's memory (hA) into GPU memory (dA)." },
  { q: "A program copies data to the GPU, runs ONE small kernel, and copies it back, inside a loop. What's the best fix?", options: ["Use a faster CPU", "Keep the data on the GPU and run all the operations there before copying back once", "Copy smaller pieces more often", "Free the memory twice"], answer: 1, explain: "Copies dominate. Moving data once and doing many operations on the device is the key optimisation." },
];
const RESULT = {
  perfect: "Perfect! You know exactly how a CPU hands work to a GPU.",
  good: "Good. Replay 'CUDA C vs PyTorch' and match each step.",
  low: "Revisit 'Watch It Happen': allocate, copy in, launch, copy out, free.",
  done: "Unit 5.2 Complete!",
  body: "You can list and explain the five offloading steps, map them to CUDA C and PyTorch, and see where the time goes.",
  next: "Next up: Unit 5.3 — Kernels, Grids, Blocks, Threads.",
  teaser: "Step 3 says 'launch on this many threads'. How do you organise a million of them? Exam halls and roll numbers.",
};
//@@WORDS
const UNIT_WORDS = [
  ["cudaMalloc", "CUDA memory allocate", "Reserves space in GPU memory.", "new here"],
  ["cudaMemcpy", "CUDA memory copy", "Copies between host and device, in the direction you name.", "new here"],
  ["cudaFree", "CUDA free", "Releases GPU memory.", "new here"],
  ["kernel", "a function that runs on the GPU", "Launched on many threads at once (Unit 3.3).", "from Unit 3.3"],
  ["DMA", "Direct Memory Access", "Moves the data over PCIe (COA Unit 5).", "from COA"],
];
