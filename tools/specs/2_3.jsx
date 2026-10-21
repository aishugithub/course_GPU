//@@META
{"unit": "2.3", "module": 2, "title": "SIMD → SIMT", "icon": "➗", "lab": "Lab2_CPU_vs_GPU.ipynb", "labNo": "2", "gpu": true}
//@@WIDGETS

// ── Section 1: Flynn's taxonomy ──
const FLYNN = {
  SISD: { full: "Single Instruction, Single Data", ex: "The processor you studied in COA: one instruction stream working on one piece of data at a time.", c: C.muted },
  SIMD: { full: "Single Instruction, Multiple Data", ex: "ONE instruction applied to MANY data items at once: CPU vector units (Hamacher §12.2) and, underneath, GPUs. This is the AI-friendly box.", c: C.green },
  MISD: { full: "Multiple Instruction, Single Data", ex: "Several instruction streams on the same data. Very rare: used mainly for fault-tolerant systems that run the same input through different checks.", c: C.muted },
  MIMD: { full: "Multiple Instruction, Multiple Data", ex: "Independent processors, each with its own program and data: multicore CPUs, clusters of computers.", c: C.orange },
};
function FlynnWidget() {
  const [k, setK] = useState("SIMD");
  const cell = (key) => (
    <div onClick={() => setK(key)} style={{ cursor: "pointer", background: k === key ? FLYNN[key].c + "33" : C.card, border: `2px solid ${k === key ? FLYNN[key].c : C.border}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
      <div style={{ color: C.text, fontWeight: 700, fontSize: 18, fontFamily: "monospace" }}>{key}</div>
      <div style={{ color: C.muted, fontSize: 11 }}>{FLYNN[key].full}</div>
    </div>
  );
  return (
    <div>
      <Frame>
        In 1966 Michael Flynn sorted computers by two questions: how many <b style={{ color: C.text }}>instruction</b> streams, and how many
        <b style={{ color: C.text }}> data</b> streams? Click each box.
      </Frame>
      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 8, alignItems: "center" }}>
        <div /><div style={{ color: C.muted, fontSize: 12, textAlign: "center" }}>Single Data</div><div style={{ color: C.muted, fontSize: 12, textAlign: "center" }}>Multiple Data</div>
        <div style={{ color: C.muted, fontSize: 12 }}>Single Instruction</div>{cell("SISD")}{cell("SIMD")}
        <div style={{ color: C.muted, fontSize: 12 }}>Multiple Instruction</div>{cell("MISD")}{cell("MIMD")}
      </div>
      <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: FLYNN[k].c + "14", border: `1px solid ${FLYNN[k].c}55`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        <b style={{ color: C.text }}>{k}: {FLYNN[k].full}.</b> {FLYNN[k].ex}
      </div>
      <Insight color={C.green} title="AI's work is 'do the same thing to lots of numbers', which is exactly SIMD.">
        Apply ReLU to a million numbers, multiply every row by the same weights: one instruction, many data. That's the box GPUs live in.
      </Insight>
    </div>
  );
}

// ── Section 2: SIMD lanes — Hamacher's vectorised loop ──
function SimdWidget() {
  const N = 16;
  const [L, setL] = useState(4);
  const [step, setStep] = useState(0);
  const passes = Math.ceil(N / L);
  const doneUpTo = step * L;
  return (
    <div>
      <Frame>
        Hamacher §12.2 uses this example: C[i] = A[i] + B[i] for N elements. A normal loop handles ONE element per pass. A
        <b style={{ color: C.green }}> vector instruction</b> works on L elements at once using L parallel ALU lanes. Choose the vector length, then
        step through.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {[1, 4, 8, 16].map((v) => <Btn key={v} ghost={v !== L} onClick={() => { setL(v); setStep(0); }} color={C.green}>L = {v}{v === 1 ? " (scalar)" : ""}</Btn>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${N}, 1fr)`, gap: 3 }}>
        {Array.from({ length: N }, (_, i) => {
          const done = i < doneUpTo, now = i >= doneUpTo - L && i < doneUpTo;
          return (
            <div key={i} style={{ textAlign: "center", borderRadius: 4, padding: "4px 0", background: now ? C.green + "55" : done ? C.green + "22" : C.card, border: `1px solid ${now ? C.green : C.border}`, fontFamily: "monospace", fontSize: 10.5, color: C.text }}>
              {i}<br />{done ? "✓" : "·"}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Btn onClick={() => setStep((s) => Math.min(passes, s + 1))} color={C.green}>One pass ▶ ({step} / {passes})</Btn>
        <Btn ghost onClick={() => setStep(0)}>↺ Reset</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
        <Code color={C.orange} title="⚙️ SCALAR LOOP: 9 instructions × N passes">{`LOOP: Load     R6, (R2)     ; R6 ← [A[i]]
      Load     R7, (R3)     ; R7 ← [B[i]]
      Add      R8, R6, R7
      Store    R8, (R4)     ; C[i] ← [R8]
      Add      R2, R2, #4
      Add      R3, R3, #4
      Add      R4, R4, #4
      Subtract R5, R5, #1
      Branch_if_[R5]>0  LOOP`}</Code>
        <Code color={C.green} title={`➗ VECTOR LOOP: 9 instructions × N/L passes`}>{`LOOP: VectorLoad  V0, (R2)   ; L elements of A
      VectorLoad  V1, (R3)   ; L elements of B
      VectorAdd   V2, V0, V1 ; L adds at once
      VectorStore V2, (R4)
      Add      R2, R2, #4L
      Add      R3, R3, #4L
      Add      R4, R4, #4L
      Subtract R5, R5, #L
      Branch_if_[R5]>0  LOOP`}</Code>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="INSTRUCTIONS, SCALAR" value={`9 × ${N} = ${9 * N}`} color={C.orange} />
        <Stat label={`INSTRUCTIONS, L = ${L}`} value={`9 × ${passes} = ${9 * passes}`} color={C.green} />
      </div>
      <Insight color={C.green} title="One vector instruction does L additions, so the loop runs N/L times instead of N.">
        This is SIMD inside a CPU. Your laptop's CPU has vector units with 8 or 16 lanes, which is part of why NumPy beat plain Python by
        hundreds of times in Lab 1.
      </Insight>
    </div>
  );
}

// ── Section 3: SIMT — write for one thread, run thousands ──
const KLINES = ["__global__ void add(float *A, float *B, float *C) {", "    int i = blockIdx.x * blockDim.x + threadIdx.x;", "    C[i] = A[i] + B[i];", "}", "", "add<<<N / 256, 256>>>(A, B, C);   // launch N threads"];
const AV = [3, 1, 4, 1, 5, 9, 2, 6], BV = [2, 7, 1, 8, 2, 8, 1, 8];
function SimtWidget() {
  const [s, setS] = useState(0);
  const line = [5, 1, 2, 3][s];
  return (
    <div>
      <Frame>
        A GPU flips the idea around. You write the code for <b style={{ color: C.text }}>ONE</b> element, called a <b style={{ color: C.accent }}>kernel</b>,
        and launch it on thousands of <b style={{ color: C.accent }}>threads</b>. Every thread runs the same instructions, but each has its own
        number i and its own registers. NVIDIA calls this <b style={{ color: C.green }}>SIMT</b>: Single Instruction, Multiple Threads. Step through with 8 threads.
      </Frame>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <Code color={C.orange} title="🐢 CPU: one loop, one element after another">{`for i in range(N):
    C[i] = A[i] + B[i]`}</Code>
        <pre style={{ margin: 0, background: C.card, border: `1.5px solid ${C.accent}`, borderRadius: 10, padding: 12, fontFamily: "monospace", fontSize: 11, lineHeight: 1.7, color: C.text, whiteSpace: "pre-wrap" }}>
          <div style={{ color: C.accent, fontWeight: 700, fontSize: 12, marginBottom: 6, fontFamily: "'Segoe UI', sans-serif" }}>⚡ GPU: a kernel, run by N threads (CUDA C)</div>
          {KLINES.map((l, k) => <div key={k} style={{ background: k === line ? C.accent + "22" : "transparent", borderLeft: `3px solid ${k === line ? C.accent : "transparent"}`, paddingLeft: 4 }}>{l || " "}</div>)}
        </pre>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 5 }}>
        {AV.map((a, i) => (
          <div key={i} style={{ background: C.card, border: `1.5px solid ${s >= 1 ? C.teal : C.border}`, borderRadius: 8, padding: 6, fontFamily: "monospace", fontSize: 10.5, color: C.muted, textAlign: "center" }}>
            <div style={{ color: C.text, fontWeight: 700 }}>thread {i}</div>
            <div style={{ color: s >= 2 ? C.teal : C.border }}>i = {s >= 2 ? i : "?"}</div>
            <div style={{ color: s >= 3 ? C.green : C.border }}>C = {s >= 3 ? a + BV[i] : "?"}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, minHeight: 36, color: C.text, fontSize: 13, lineHeight: 1.6 }}>
        {["The CPU launches the kernel with N threads (here 8 of them; really thousands).", "All threads start the same instruction at the same time.", "Each thread works out ITS OWN index i from its built-in IDs: same instruction, different data.", "Each thread adds its own pair. All 8 additions happen in one step. No loop!"][s]}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={() => setS((v) => Math.min(3, v + 1))}>Step ▶ ({s + 1} / 4)</Btn>
        <Btn ghost onClick={() => setS(0)}>↺ Reset</Btn>
      </div>
      <Insight title="SIMD: you write one wide instruction. SIMT: you write a normal program for one thread, and the GPU runs thousands of copies.">
        The loop disappears: it's replaced by "how many threads to launch". You'll write this exact kernel yourself in Module 4.
      </Insight>
    </div>
  );
}

// ── Section 4: Warps — SIMT on SIMD hardware ──
function WarpWidget() {
  const [n, setN] = useState(10000);
  const warps = Math.ceil(n / 32);
  const sms = 40;
  return (
    <div>
      <Frame>
        Underneath, the GPU really is SIMD hardware. It groups threads into bundles of <b style={{ color: C.purple }}>32 called warps</b>; the 32
        threads of a warp share one instruction unit and move in lock-step. Warps are spread across the GPU's
        <b style={{ color: C.text }}> streaming multiprocessors</b> (the T4 has 40). Choose how many elements to process.
      </Frame>
      <Slider label={<>Elements (one thread each) = <b style={{ color: C.accent }}>{n.toLocaleString("en-IN")}</b></>} value={n} min={32} max={1000000} step={32} onChange={setN} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="THREADS" value={n.toLocaleString("en-IN")} color={C.accent} />
        <Stat label="WARPS (÷ 32)" value={warps.toLocaleString("en-IN")} color={C.purple} />
        <Stat label="WARPS PER SM (40 SMs)" value={(warps / sms).toFixed(1)} color={C.green} />
      </div>
      <table style={{ width: "100%", marginTop: 14, borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead><tr style={{ color: C.muted, textAlign: "left" }}><th style={{ padding: 6 }}></th><th>CPU SIMD</th><th>GPU SIMT</th></tr></thead>
        <tbody style={{ color: C.text }}>
          {[["You write", "wide vector instructions (or the compiler does)", "an ordinary program for ONE thread"], ["Width", "4–16 lanes", "32 threads per warp × thousands of warps"], ["Each lane has", "a slot in a vector register", "its own registers and its own index"], ["Good for", "short bursts inside a CPU program", "huge, regular, independent work, like AI"]].map((r) => (
            <tr key={r[0]} style={{ borderTop: `1px solid ${C.border}` }}><td style={{ padding: 6, color: C.muted }}>{r[0]}</td><td style={{ color: C.orange }}>{r[1]}</td><td style={{ color: C.green }}>{r[2]}</td></tr>
          ))}
        </tbody>
      </table>
      <Insight color={C.purple} title="A warp of 32 threads is the GPU's real unit of execution.">
        Remember "32". It explains a lot in Module 3: why if/else inside a kernel can be slow, and why GPUs like jobs with thousands of threads.
      </Insight>
      <LabCard part="C" title="Vector add: CPU vs GPU"
        what="Add two arrays of growing size, first with NumPy on the CPU, then with PyTorch on the GPU, timing both correctly (with torch.cuda.synchronize)."
        expect="the CPU wins for small arrays and the GPU wins clearly for arrays of millions of elements." />
    </div>
  );
}
//@@SECTIONS
[["Flynn's Taxonomy", "🗂️ Flynn's Taxonomy — SISD, SIMD, MISD, MIMD", "FlynnWidget"],
 ["SIMD Lanes", "➗ SIMD — one instruction, many lanes (Hamacher §12.2)", "SimdWidget"],
 ["SIMT Threads", "🧵 SIMT — write for one thread, run thousands", "SimtWidget"],
 ["Warps", "📦 Warps — 32 threads in lock-step", "WarpWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "A multicore CPU running different programs on each core is which Flynn class?", options: ["SISD", "SIMD", "MISD", "MIMD"], answer: 3, explain: "Multiple independent instruction streams on multiple data streams: MIMD." },
  { q: "Hamacher's loop has 9 instructions per pass. With N = 64 and vector length L = 8, how many instructions run?", options: ["9", "72", "576", "64"], answer: 1, explain: "The vectorised loop runs N/L = 8 passes × 9 instructions = 72, compared with 9 × 64 = 576 for the scalar loop." },
  { q: "In a CUDA kernel, how does each thread know which element to work on?", options: ["It reads a loop counter", "It computes its own index from built-in IDs (blockIdx, threadIdx)", "The CPU tells each thread separately", "It picks one at random"], answer: 1, explain: "i = blockIdx.x * blockDim.x + threadIdx.x gives every thread a unique index: same code, different data." },
  { q: "How many threads are in one warp on NVIDIA GPUs?", options: ["8", "16", "32", "1024"], answer: 2, explain: "A warp is 32 threads that share one instruction unit and execute in lock-step." },
];
const RESULT = {
  perfect: "Perfect! You understand how GPUs run code.",
  good: "Good. Replay 'SIMT Threads' and watch each thread find its own i.",
  low: "Revisit 'SIMD Lanes' then 'SIMT Threads': one instruction, many data is the heart of it.",
  done: "Unit 2.3 Complete!",
  body: "You can place machines in Flynn's taxonomy, explain vectorisation (Hamacher §12.2), and describe SIMT threads and warps.",
  next: "Next up: Unit 2.4 — Amdahl's Law.",
  teaser: "The GPU makes the matrix multiply 100× faster, but the whole program only 3× faster. Why?",
};
//@@WORDS
const UNIT_WORDS = [
  ["SISD / SIMD / MISD / MIMD", "Flynn's four classes", "Single or Multiple Instruction streams × Single or Multiple Data streams.", "new here"],
  ["SIMT", "Single Instruction, Multiple Threads", "NVIDIA's model: one program, thousands of threads, each with its own data.", "new here"],
  ["L", "vector length", "How many elements one vector instruction handles at once (Hamacher §12.2).", "new here"],
  ["SM", "Streaming Multiprocessor", "One of the GPU's 'mini-processors'; the T4 has 40. Unit 3.1 opens one up.", "new here"],
  ["RTN", "Register Transfer Notation", "R6 ← [A[i]] means 'load the value at A[i] into R6'.", "from COA"],
];
