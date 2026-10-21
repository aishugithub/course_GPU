//@@META
{"unit": "3.3", "module": 3, "title": "Hiding Latency", "icon": "🫖", "lab": "Lab3_Inside_a_GPU.ipynb", "labNo": "3", "gpu": true}
//@@WIDGETS

// Discrete warp-scheduler simulation: each warp computes C cycles, then waits L cycles for memory, repeat.
function simulate(nWarps, C, L, T) {
  const ready = Array(nWarps).fill(0), left = Array(nWarps).fill(C);
  const grid = Array.from({ length: nWarps }, () => Array(T).fill(0)); // 0 idle/ready, 1 computing, 2 waiting
  let busy = 0, rr = 0;
  for (let t = 0; t < T; t++) {
    let issued = -1;
    for (let k = 0; k < nWarps; k++) { const w = (rr + k) % nWarps; if (ready[w] <= t) { issued = w; break; } }
    for (let w = 0; w < nWarps; w++) grid[w][t] = ready[w] > t ? 2 : 0;
    if (issued >= 0) {
      grid[issued][t] = 1; busy++; left[issued]--;
      if (left[issued] === 0) { ready[issued] = t + 1 + L; left[issued] = C; rr = (issued + 1) % nWarps; }
    }
  }
  return { grid, util: busy / T };
}

// ── Section 1: Need — one warp spends its life waiting ──
function NeedWidget() {
  const L = 400, Cc = 4;
  return (
    <div>
      <Frame>
        Reading from the GPU's main memory (GDDR6) takes roughly <b style={{ color: C.text }}>400–800 clock cycles</b>. A typical AI step does a few
        cycles of arithmetic, then needs the next data. If an SM ran just ONE warp, this is what its cores would do:
      </Frame>
      <div style={{ display: "flex", height: 30, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
        {Array.from({ length: 3 }, (_, k) => (
          <div key={k} style={{ display: "flex", flex: Cc + L }}>
            <div style={{ flex: Cc, background: C.green }} />
            <div style={{ flex: L, background: C.red + "44", display: "flex", alignItems: "center", justifyContent: "center", color: C.red, fontSize: 11 }}>waiting for memory…</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="CYCLES COMPUTING" value={`${Cc} of every ${Cc + L}`} color={C.green} />
        <Stat label="CORES BUSY" value={`${((Cc / (Cc + L)) * 100).toFixed(1)}%`} color={C.red} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <div style={{ background: C.card, borderRadius: 8, padding: 10, border: `1.5px solid ${C.orange}` }}><b style={{ color: C.orange, fontSize: 12.5 }}>CPU's answer</b><div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>Huge caches so the data is usually nearby, plus out-of-order execution to find other work in the same thread (COA).</div></div>
        <div style={{ background: C.card, borderRadius: 8, padding: 10, border: `1.5px solid ${C.green}` }}><b style={{ color: C.green, fontSize: 12.5 }}>GPU's answer</b><div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>Small caches. Instead, keep MANY warps ready, and when one waits, instantly run another. Next section.</div></div>
      </div>
      <Insight color={C.red} title="With one warp, the GPU's cores would sit idle 99% of the time.">
        Memory is slow compared with arithmetic, on every computer. The question is how a chip avoids waiting for it.
      </Insight>
    </div>
  );
}

// ── Section 2: Juggle many warps ──
function JuggleWidget() {
  const [n, setN] = useState(4);
  const [L, setL] = useState(40);
  const Cc = 4, T = 120;
  const { grid, util } = simulate(n, Cc, L, T);
  return (
    <div>
      <Frame>
        A tea master with one cup stands around while it brews. With 12 cups on the go, he's never idle: pour, add milk, serve, back to the first.
        The <b style={{ color: C.text }}>warp scheduler</b> does this every clock cycle: if the current warp is waiting for memory, it issues an instruction from
        another warp that's ready. Add warps and watch the core's busy time fill up. (Small numbers, so it fits on screen.)
      </Frame>
      <Slider label={<>Warps resident on the SM = <b style={{ color: C.green }}>{n}</b></>} value={n} min={1} max={16} onChange={setN} color={C.green} />
      <Slider label={<>Memory latency = <b style={{ color: C.red }}>{L}</b> cycles (compute = {Cc} cycles between loads)</>} value={L} min={8} max={80} step={4} onChange={setL} color={C.red} />
      <div style={{ background: C.card, borderRadius: 8, padding: 8, border: `1px solid ${C.border}` }}>
        {grid.map((row, w) => (
          <div key={w} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <div style={{ width: 52, color: C.muted, fontSize: 10, fontFamily: "monospace" }}>warp {w}</div>
            <div style={{ display: "flex", flex: 1, height: 9 }}>{row.map((v, t) => <div key={t} style={{ flex: 1, background: v === 1 ? C.green : v === 2 ? C.red + "55" : "transparent" }} />)}</div>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <div style={{ width: 52, color: C.text, fontSize: 10, fontFamily: "monospace" }}>core</div>
          <div style={{ display: "flex", flex: 1, height: 12 }}>{Array.from({ length: T }, (_, t) => <div key={t} style={{ flex: 1, background: grid.some((r) => r[t] === 1) ? C.green : C.border }} />)}</div>
        </div>
      </div>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 4 }}>■ green = computing · ■ red = waiting for memory · core row = is anyone using the core this cycle?</div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="CORE BUSY" value={`${(util * 100).toFixed(0)}%`} color={util > 0.9 ? C.green : util > 0.5 ? C.yellow : C.red} />
        <Stat label="WARPS NEEDED TO HIDE IT ≈ (C + L) / C" value={Math.ceil((Cc + L) / Cc)} color={C.purple} />
      </div>
      <Insight color={C.green} title="The GPU doesn't avoid the wait. It fills it with other warps' work.">
        With enough warps, someone is always ready to compute while others wait for memory. This is <b>latency hiding</b>, and it's why GPUs want
        thousands of threads, many more than there are cores.
      </Insight>
    </div>
  );
}

// ── Section 3: Why switching is free on a GPU ──
function SwitchWidget() {
  const [mode, setMode] = useState("gpu");
  return (
    <div>
      <Frame>
        When an operating system switches a CPU core from one thread to another, it must <b style={{ color: C.orange }}>save</b> all the old thread's registers to memory
        and <b style={{ color: C.orange }}>load</b> the new one's: thousands of cycles. A GPU switches warps <b style={{ color: C.green }}>every cycle for free</b>. How?
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Btn ghost={mode !== "cpu"} onClick={() => setMode("cpu")} color={C.orange}>CPU thread switch</Btn>
        <Btn ghost={mode !== "gpu"} onClick={() => setMode("gpu")} color={C.green}>GPU warp switch</Btn>
      </div>
      {mode === "cpu" ? (
        <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `1.5px solid ${C.orange}` }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 12.5, color: C.text }}>
            <div style={{ border: `1px solid ${C.orange}`, borderRadius: 6, padding: 8 }}>one register set<br /><span style={{ color: C.muted }}>(thread A's values)</span></div>
            <span style={{ color: C.orange }}>→ save to memory →</span>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: 8 }}>RAM</div>
            <span style={{ color: C.orange }}>→ load thread B →</span>
            <div style={{ border: `1px solid ${C.orange}`, borderRadius: 6, padding: 8 }}>same register set<br /><span style={{ color: C.muted }}>(now thread B's)</span></div>
          </div>
          <div style={{ color: C.muted, fontSize: 12.5, marginTop: 10 }}>A CPU core has registers for one or two threads (Hamacher §12.1: hardware multithreading usually keeps 2). Switching beyond that goes through memory: slow, so the OS does it only every few milliseconds.</div>
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `1.5px solid ${C.green}` }}>
          <div style={{ color: C.text, fontSize: 12.5, marginBottom: 6 }}>Register file of one SM: every resident warp has its OWN registers, all the time.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 3 }}>
            {Array.from({ length: 32 }, (_, i) => <div key={i} style={{ height: 22, borderRadius: 3, background: i === 5 ? C.green : C.teal + "33", border: `1px solid ${i === 5 ? C.green : C.teal + "66"}`, fontSize: 8.5, color: i === 5 ? "#0D1117" : C.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>w{i}</div>)}
          </div>
          <div style={{ color: C.muted, fontSize: 12.5, marginTop: 10 }}>Switching from warp 5 to warp 6 just means "read your operands from a different part of the register file": nothing is saved or loaded. That's why the register file is so big (256 KB per SM, Unit 3.1).</div>
        </div>
      )}
      <Insight color={C.teal} title="GPUs are hardware multithreading taken to the extreme.">
        Hamacher §12.1 describes CPUs that keep 2 threads' registers to switch quickly. An SM keeps up to 32 warps × 32 threads = 1,024 threads'
        registers on-chip, so it can switch every single cycle.
      </Insight>
    </div>
  );
}

// ── Section 4: Occupancy ──
function OccWidget() {
  const [regs, setRegs] = useState(32);
  const [Cc, setCc] = useState(20);
  const L = 400;
  const byRegs = Math.floor(65536 / (regs * 32));
  const warps = Math.min(32, byRegs);
  const occ = warps / 32;
  const util = Math.min(1, (warps * Cc) / (Cc + L));
  return (
    <div>
      <Frame>
        How many warps can live on an SM at once? On the T4, at most <b style={{ color: C.text }}>32 warps</b>, and they must all fit in the
        <b style={{ color: C.text }}> 65,536 registers</b>. A kernel that uses many registers per thread leaves room for fewer warps. The fraction of the 32
        slots in use is called <b style={{ color: C.purple }}>occupancy</b>.
      </Frame>
      <Slider label={<>Registers per thread = <b style={{ color: C.teal }}>{regs}</b></>} value={regs} min={16} max={255} onChange={setRegs} color={C.teal} />
      <Slider label={<>Arithmetic cycles between memory loads = <b style={{ color: C.green }}>{Cc}</b> (memory latency fixed at {L})</>} value={Cc} min={2} max={100} onChange={setCc} color={C.green} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(32, 1fr)", gap: 2 }}>
        {Array.from({ length: 32 }, (_, i) => <div key={i} style={{ height: 18, borderRadius: 2, background: i < warps ? C.purple : C.card, border: `1px solid ${C.border}` }} />)}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="WARPS THAT FIT" value={`${warps} / 32`} color={C.purple} />
        <Stat label="OCCUPANCY" value={`${(occ * 100).toFixed(0)}%`} color={C.purple} />
        <Stat label="CORE BUSY (MODEL)" value={`${(util * 100).toFixed(0)}%`} color={util > 0.9 ? C.green : util > 0.5 ? C.yellow : C.red} />
      </div>
      <Insight color={C.purple} title="More resident warps means more latency hiding, up to the point where the core is always busy.">
        Kernels with lots of arithmetic per memory load need fewer warps; memory-heavy kernels need many. Unit 5.3 turns this into a rule:
        compute-bound vs memory-bound.
      </Insight>
      <LabCard part="C" title="Watch latency hiding work"
        what="Run a simple memory-copy kernel while launching more and more threads, measure the bandwidth each time, and plot it."
        expect="bandwidth climbs steeply as threads are added, then levels off once there are enough warps to hide memory latency." />
    </div>
  );
}
//@@SECTIONS
[["Waiting for Memory", "⏳ Waiting for Memory — one warp's lonely life", "NeedWidget"],
 ["Juggle the Warps", "🫖 Juggle the Warps — the tea master's trick", "JuggleWidget"],
 ["Free Switching", "🔁 Free Switching — why the register file is huge", "SwitchWidget"],
 ["Occupancy", "📊 Occupancy — how many warps fit?", "OccWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "How does a GPU mainly cope with slow memory?", options: ["Very large caches like a CPU", "Switching to another ready warp while one waits", "Running at a higher clock speed", "Avoiding memory completely"], answer: 1, explain: "Latency hiding: the warp scheduler issues work from other warps while some wait for memory." },
  { q: "Compute takes 4 cycles between loads, and memory latency is 60 cycles. About how many warps are needed to keep the core busy?", options: ["1", "4", "16", "64"], answer: 2, explain: "(C + L) / C = (4 + 60) / 4 = 16 warps." },
  { q: "Why can a GPU switch between warps every cycle for free?", options: ["It saves registers very fast", "Each resident warp keeps its own registers in the large register file, so nothing is saved or loaded", "Warps share one set of registers", "The CPU does the switching"], answer: 1, explain: "All resident warps' registers stay on-chip; switching just changes which warp's registers are used." },
  { q: "A kernel uses 128 registers per thread. On an SM with 65,536 registers, how many warps (of 32 threads) fit?", options: ["8", "16", "32", "64"], answer: 1, explain: "65,536 ÷ (128 × 32) = 16 warps, so occupancy is 16/32 = 50%." },
];
const RESULT = {
  perfect: "Perfect! You understand the GPU's secret weapon.",
  good: "Good. Replay 'Juggle the Warps' with long latencies.",
  low: "Revisit 'Juggle the Warps': many warps hide the wait.",
  done: "Unit 3.3 Complete!",
  body: "You can explain memory latency, latency hiding by warp switching, why it's free on a GPU, and occupancy.",
  next: "Next up: Unit 3.4 — GPU Memory & Bandwidth.",
  teaser: "65 TFLOPS is useless if the numbers can't arrive fast enough. Meet the GPU's memory hierarchy.",
};
//@@WORDS
const UNIT_WORDS = [
  ["latency", "waiting time", "How long one memory request takes to come back.", "from Unit 2.1"],
  ["GDDR6", "Graphics Double Data Rate 6", "The T4's main (global) memory.", "from Unit 3.1"],
  ["OS", "Operating System", "Windows, Linux, Android… It schedules threads on CPU cores.", "new here"],
  ["occupancy", "warps resident ÷ maximum warps", "How full an SM's warp slots are.", "new here"],
];
