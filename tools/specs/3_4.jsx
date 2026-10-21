//@@META
{"unit": "3.4", "module": 3, "title": "GPU Memory & Bandwidth", "icon": "🚰", "lab": "Lab3_Inside_a_GPU.ipynb", "labNo": "3", "gpu": true}
//@@WIDGETS

// ── Section 1: Need — feeding the beast ──
function NeedWidget() {
  const [r, setR] = useState(1);
  const bw = 320e9, peak = 8.1e12;
  const flops = Math.min(peak, (bw * r) / 4);    // 1 FMA = 2 FLOPs needs 2 floats = 8 bytes when nothing is reused
  return (
    <div>
      <Frame>
        The T4 can do 8.1 TFLOPS (FP32), but every FMA needs two numbers to work on. Its main memory delivers <b style={{ color: C.teal }}>320 GB/s</b>.
        If every number had to come fresh from memory and be used once, how fast could the T4 really go? Now let each fetched number be
        <b style={{ color: C.green }}> reused</b> several times from fast on-chip storage.
      </Frame>
      <Slider label={<>Reuse: each number fetched from memory is used in <b style={{ color: C.green }}>{r}</b> FMA{r > 1 ? "s" : ""}</>} value={r} min={1} max={200} onChange={setR} color={C.green} />
      <div style={{ height: 26, background: C.card, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
        <div style={{ width: `${(flops / peak) * 100}%`, height: "100%", background: flops >= peak ? C.green : C.yellow, transition: "width 0.3s" }} />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="ACHIEVABLE SPEED" value={`${(flops / 1e12).toFixed(2)} TFLOPS`} color={flops >= peak ? C.green : C.yellow} />
        <Stat label="SHARE OF PEAK" value={`${((flops / peak) * 100).toFixed(1)}%`} color={C.purple} />
        <Stat label="BANDWIDTH NEEDED WITH NO REUSE" value="≈ 32 TB/s (100× too much)" color={C.red} />
      </div>
      <Insight color={C.yellow} title="Without reuse the T4 runs at about 1% of its peak, starved for data.">
        The arithmetic is cheap; moving the numbers is expensive. Every fast GPU program is really a plan for reusing data held in small, fast
        memories close to the cores. This unit maps those memories.
      </Insight>
    </div>
  );
}

// ── Section 2: The memory hierarchy ──
const LEVELS = [
  { k: "reg", t: "Registers", size: "256 KB per SM (≈ 10 MB on the chip)", lat: "≈ 1 cycle", who: "one thread", c: C.green, coa: "Processor registers R0…Rn" },
  { k: "smem", t: "Shared memory / L1 cache", size: "96 KB per SM", lat: "≈ 20–30 cycles", who: "one thread block, on one SM", c: C.teal, coa: "L1 cache" },
  { k: "l2", t: "L2 cache", size: "4 MB (whole chip)", lat: "≈ 200 cycles", who: "all SMs", c: C.accent, coa: "L2 / L3 cache" },
  { k: "global", t: "Global memory (GDDR6)", size: "16 GB", lat: "≈ 400–600 cycles · 320 GB/s", who: "every thread, and the CPU (by copying)", c: C.purple, coa: "Main memory (RAM)" },
  { k: "host", t: "CPU's RAM, over PCIe", size: "12+ GB on Colab", lat: "microseconds · ≈ 12 GB/s", who: "reached only by explicit copies", c: C.orange, coa: "(like a disk: far away)" },
];
function HierarchyWidget() {
  const [k, setK] = useState("smem");
  const [coa, setCoa] = useState(false);
  const L = LEVELS.find((x) => x.k === k);
  return (
    <div>
      <Frame>
        Like the CPU memory hierarchy in COA (Hamacher Ch 8), a GPU has layers: the closer to the cores, the faster and smaller. Click a level.
        Toggle to see the matching COA level. (Approximate T4 figures.)
      </Frame>
      <label style={{ color: C.muted, fontSize: 12.5, cursor: "pointer" }}><input type="checkbox" checked={coa} onChange={(e) => setCoa(e.target.checked)} /> Show the matching CPU (COA) level</label>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 10 }}>
        {LEVELS.map((x, i) => (
          <div key={x.k} onClick={() => setK(x.k)} style={{ width: `${40 + i * 15}%`, cursor: "pointer", padding: "8px 10px", borderRadius: 6, textAlign: "center", background: x.c + (k === x.k ? "44" : "1A"), border: `1.5px solid ${x.c}`, color: C.text, fontSize: 12.5, fontWeight: k === x.k ? 700 : 400 }}>
            {x.t}{coa && <span style={{ color: C.muted, fontWeight: 400 }}> · COA: {x.coa}</span>}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <Stat label="SIZE" value={L.size} color={L.c} />
        <Stat label="SPEED" value={L.lat} color={L.c} />
        <Stat label="WHO CAN SEE IT" value={L.who} color={L.c} />
      </div>
      <Insight color={C.teal} title="Same idea as COA: keep the data you're using in the small, fast levels.">
        The difference is who manages it. A CPU's caches work automatically. On a GPU, the fastest shared level (shared memory) is a
        scratchpad that the programmer fills deliberately. Unit 5.1 does exactly that.
      </Insight>
    </div>
  );
}

// ── Section 3: Who shares what — confusing names ──
const SPACES = {
  register: { t: "Registers", who: "one thread only", scope: (sm, b, th) => sm === 0 && b === 0 && th === 0, note: "Each thread's own variables, like i in the vector-add kernel. The fastest storage there is." },
  shared: { t: "'Shared' memory", who: "the threads of ONE block (on one SM)", scope: (sm, b) => sm === 0 && b === 0, note: "The name misleads: it's shared only inside one thread block, a team of threads that runs together on one SM (Unit 4.3 shows how you pick block sizes). Hennessy & Patterson point out that it's really LOCAL to the block." },
  global: { t: "'Global' memory", who: "EVERY thread on the GPU, plus the CPU by copying", scope: () => true, note: "The big 16 GB memory. This is the one that's truly shared: every thread, in every block, on every SM, can read and write it. Your tensors live here." },
};
function ScopeWidget() {
  const [k, setK] = useState("shared");
  const s = SPACES[k];
  return (
    <div>
      <Frame>
        CUDA's memory names are famously confusing. Pick one and see which threads can reach it. The picture shows 2 SMs, each running 2
        thread blocks of 8 threads.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {Object.entries(SPACES).map(([key, v]) => <Btn key={key} ghost={key !== k} onClick={() => setK(key)}>{v.t}</Btn>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[0, 1].map((sm) => (
          <div key={sm} style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 8 }}>
            <div style={{ color: C.muted, fontSize: 11, marginBottom: 6 }}>SM {sm}</div>
            {[0, 1].map((b) => (
              <div key={b} style={{ border: `1px dashed ${C.border}`, borderRadius: 8, padding: 6, marginBottom: 6 }}>
                <div style={{ color: C.muted, fontSize: 10, marginBottom: 4 }}>block {b}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 3 }}>
                  {Array.from({ length: 8 }, (_, th) => {
                    const on = s.scope(sm, b, th);
                    return <div key={th} style={{ height: 18, borderRadius: 3, background: on ? C.green : C.card, border: `1px solid ${on ? C.green : C.border}` }} />;
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        <b style={{ color: C.green }}>{s.t}: visible to {s.who}.</b> {s.note}
      </div>
      <Insight color={C.purple} title="'Shared' = shared by one block. 'Global' = shared by everyone.">
        A handy memory trick: global is like the college library (anyone can go there, but it's a walk); shared memory is your department's
        cupboard (only your team, but right next to you); registers are your own pocket.
      </Insight>
    </div>
  );
}

// ── Section 4: Coalescing + bandwidth ──
function CoalesceWidget() {
  const [pattern, setPattern] = useState("seq");
  const [mb, setMb] = useState(400);
  const addr = Array.from({ length: 32 }, (_, i) => (pattern === "seq" ? i : pattern === "stride" ? i * 32 : [5, 900, 33, 412, 77, 640, 2, 1000, 300, 150, 820, 64, 501, 13, 700, 222, 999, 45, 380, 610, 91, 870, 256, 128, 777, 18, 560, 430, 330, 950, 60, 705][i]));
  const segs = new Set(addr.map((a) => Math.floor(a / 32)));   // 32 floats = one 128-byte segment
  const eff = 1 / segs.size;
  return (
    <div>
      <Frame>
        Memory delivers data in chunks of <b style={{ color: C.text }}>128 bytes</b> (32 floats). When the 32 threads of a warp read 32 neighbouring
        floats, one chunk serves them all. That's <b style={{ color: C.green }}>coalesced</b>. If their addresses are far apart, the memory must fetch
        many chunks and throw most of each away. Choose how the warp reads.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        <Btn ghost={pattern !== "seq"} onClick={() => setPattern("seq")} color={C.green}>x[i]: neighbours</Btn>
        <Btn ghost={pattern !== "stride"} onClick={() => setPattern("stride")} color={C.red}>x[i * 32]: strided</Btn>
        <Btn ghost={pattern !== "rand"} onClick={() => setPattern("rand")} color={C.orange}>random</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(32, 1fr)", gap: 1 }}>
        {Array.from({ length: 32 }, (_, s) => <div key={s} style={{ height: 16, background: segs.has(s) ? (pattern === "seq" ? C.green : C.red) : C.card, border: `1px solid ${C.border}` }} />)}
      </div>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 4 }}>Each box = one 128-byte chunk of memory (32 shown). Coloured = fetched for this one warp read.</div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="CHUNKS FETCHED" value={segs.size} color={segs.size === 1 ? C.green : C.red} />
        <Stat label="USEFUL BYTES" value={`${(eff * 100).toFixed(0)}%`} color={segs.size === 1 ? C.green : C.red} />
      </div>
      <div style={{ marginTop: 16, background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Bandwidth calculator</div>
        <Slider label={<>Data to read + write = <b style={{ color: C.teal }}>{mb} MB</b></>} value={mb} min={1} max={4000} onChange={setMb} color={C.teal} />
        <div style={{ fontFamily: "monospace", fontSize: 13, color: C.text }}>
          time ≥ {mb} MB ÷ 320 GB/s = <b style={{ color: C.green }}>{((mb / 320000) * 1000).toFixed(2)} ms</b> (coalesced) · ≈ <b style={{ color: C.red }}>{((mb / 320000) * 1000 / Math.max(eff, 1 / 32)).toFixed(1)} ms</b> ({pattern === "seq" ? "same" : "this pattern"})
        </div>
      </div>
      <Insight color={C.green} title="Neighbouring threads should read neighbouring addresses.">
        Simple operations like ReLU or vector add are limited by memory, not maths, so their speed is set by bytes ÷ bandwidth, and only if access is
        coalesced. PyTorch's built-in operations are written to coalesce.
      </Insight>
      <LabCard part="D" title="Measure your GPU's memory bandwidth"
        what="Copy a large tensor inside the GPU and compute GB/s, then time a kernel reading with stride 1 vs stride 32."
        expect="roughly 200–250 GB/s for the copy (a good fraction of the 320 GB/s peak) and the strided read running several times slower." />
    </div>
  );
}
//@@SECTIONS
[["Feeding the Beast", "🚰 Feeding the Beast — FLOPS need bytes", "NeedWidget"],
 ["The Hierarchy", "🏔️ The Memory Hierarchy — registers to PCIe", "HierarchyWidget"],
 ["Who Shares What", "🗝️ Who Shares What — 'shared' vs 'global'", "ScopeWidget"],
 ["Coalescing", "🧲 Coalescing — read like a warp", "CoalesceWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "Without any data reuse, the T4 (320 GB/s, 8.1 TFLOPS) reaches about what share of its peak?", options: ["100%", "50%", "10%", "1%"], answer: 3, explain: "320 GB/s ÷ 8 bytes per FMA × 2 FLOPs ≈ 80 GFLOPS: about 1% of 8.1 TFLOPS. Reuse is essential." },
  { q: "CUDA 'shared memory' is visible to…", options: ["Every thread on the GPU", "The threads of one thread block, on one SM", "Only the CPU", "One thread"], answer: 1, explain: "Despite the name, it's private to one block. 'Global memory' is the one everyone shares." },
  { q: "Which access pattern is coalesced?", options: ["Thread i reads x[i]", "Thread i reads x[i * 32]", "Thread i reads a random element", "Thread i reads x[1000 − 37·i]"], answer: 0, explain: "Neighbouring threads reading neighbouring addresses fall in the same 128-byte chunk, so one fetch serves the whole warp." },
  { q: "A ReLU kernel reads 200 MB and writes 200 MB on a 320 GB/s GPU. Its best possible time is about…", options: ["0.125 ms", "1.25 ms", "12.5 ms", "125 ms"], answer: 1, explain: "400 MB ÷ 320 GB/s = 1.25 ms. ReLU barely does any maths; memory sets its speed." },
];
const RESULT = {
  perfect: "Perfect! You understand what really limits GPU speed.",
  good: "Good. Replay 'Feeding the Beast' and see how much reuse is needed.",
  low: "Revisit 'The Hierarchy' and 'Coalescing': bytes, not FLOPs, are often the limit.",
  done: "Unit 3.4 Complete!",
  body: "You can map the GPU memory hierarchy, explain CUDA's memory spaces, coalescing, and bandwidth-limited speed.",
  next: "Next up: Unit 3.C — Capstone: Map a Job onto a GPU.",
  teaser: "Take a real AI job and plan it on the T4: threads, warps, SMs, bytes, and time.",
};
//@@WORDS
const UNIT_WORDS = [
  ["GB/s / TB/s", "gigabytes / terabytes per second", "Bandwidth: how many bytes per second memory can deliver.", "from Unit 2.C"],
  ["GDDR6", "Graphics Double Data Rate 6", "The GPU's global memory.", "from Unit 3.1"],
  ["coalesced", "combined", "A warp's 32 reads merged into as few memory chunks as possible.", "new here"],
  ["thread block", "a team of threads on one SM", "Threads that run together and share 'shared memory'. Chosen by the programmer in Unit 4.3.", "new here"],
  ["PCIe", "Peripheral Component Interconnect Express", "The CPU–GPU bus.", "from Unit 2.C"],
];
