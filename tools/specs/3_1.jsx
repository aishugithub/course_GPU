//@@META
{"unit": "3.1", "module": 3, "title": "Latency vs Throughput", "icon": "⚔️", "lab": "Lab03_CPU_vs_GPU.ipynb", "labNo": 3, "gpu": true}
//@@WIDGETS

// ── Section 1: Need — one professor or 1000 students? ──
function NeedWidget() {
  const [n, setN] = useState(10);
  const prof = n * 0.5;                       // 30 s per script, one after another
  const studs = Math.ceil(n / 1000) * 5;      // 5 min per script, 1000 in parallel
  const winner = prof < studs ? "prof" : prof > studs ? "studs" : "tie";
  const show = (m) => (m < 60 ? `${m.toFixed(1)} min` : `${(m / 60).toFixed(1)} hours`);
  return (
    <div>
      <Frame>
        Answer scripts must be marked. Option A: <b style={{ color: C.orange }}>one expert professor</b>, very fast at 30 seconds a script, but
        one at a time. Option B: <b style={{ color: C.green }}>1000 students</b>, slow at 5 minutes a script, but all marking together. Who
        finishes first? Drag the number of scripts.
      </Frame>
      <Slider label={<>Answer scripts = <b style={{ color: C.accent }}>{n.toLocaleString("en-IN")}</b></>} value={n} min={1} max={5000} onChange={setN} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `2px solid ${winner === "prof" ? C.green : C.border}` }}>
          <div style={{ fontSize: 30 }}>👩‍🏫</div>
          <div style={{ color: C.orange, fontWeight: 700, fontSize: 13 }}>ONE PROFESSOR (like a CPU core)</div>
          <div style={{ color: C.text, fontFamily: "monospace", fontSize: 18, marginTop: 6 }}>{show(prof)}</div>
          <div style={{ color: C.muted, fontSize: 12 }}>finishes ONE script in 30 s</div>
        </div>
        <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `2px solid ${winner === "studs" ? C.green : C.border}` }}>
          <div style={{ fontSize: 30 }}>🧑‍🎓🧑‍🎓🧑‍🎓</div>
          <div style={{ color: C.green, fontWeight: 700, fontSize: 13 }}>1000 STUDENTS (like GPU cores)</div>
          <div style={{ color: C.text, fontFamily: "monospace", fontSize: 18, marginTop: 6 }}>{show(studs)}</div>
          <div style={{ color: C.muted, fontSize: 12 }}>each takes 5 min for ONE script</div>
        </div>
      </div>
      <div style={{ marginTop: 10, color: winner === "prof" ? C.orange : C.green, fontWeight: 700, fontSize: 13 }}>
        {winner === "prof" ? "🏆 The professor wins: too few scripts to keep 1000 students busy." : winner === "studs" ? "🏆 The students win: sheer numbers beat individual speed." : "🤝 A tie!"}
      </div>
      <Insight title="Fast at one job, or fast at many jobs: two different kinds of 'fast'.">
        The professor is the better choice for a single urgent script. The crowd is the better choice for a mountain of them. Find the crossover
        on the slider (about 10 scripts). AI is always a mountain.
      </Insight>
    </div>
  );
}

// ── Section 2: Latency vs throughput, defined ──
function DefineWidget() {
  const [people, setPeople] = useState(4);
  const carTrips = Math.ceil(people / 4), busTrips = Math.ceil(people / 50);
  const carTime = carTrips * 3 * 2 - 3, busTime = busTrips * 4 * 2 - 4; // return trips except last
  return (
    <div>
      <Frame>
        Two words architects use. <b style={{ color: C.orange }}>Latency</b> is how long ONE job takes from start to finish.
        <b style={{ color: C.green }}> Throughput</b> is how many jobs finish per hour. Taking people from Chennai to Pondicherry: a car (4 seats,
        3 h) or a bus (50 seats, 4 h)? Choose how many people must travel.
      </Frame>
      <Slider label={<>People to move = <b style={{ color: C.accent }}>{people}</b></>} value={people} min={1} max={200} onChange={setPeople} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[["🚗 Car", C.orange, 3, 4 / 3, carTrips, carTime], ["🚌 Bus", C.green, 4, 50 / 4, busTrips, busTime]].map(([t, c, lat, thr, trips, total]) => (
          <div key={t} style={{ background: C.card, borderRadius: 10, padding: 14, border: `1.5px solid ${c}` }}>
            <div style={{ color: c, fontWeight: 700 }}>{t}</div>
            <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.8, marginTop: 4 }}>
              Latency: <b style={{ color: C.text }}>{lat} h</b> per person<br />
              Throughput: <b style={{ color: C.text }}>{thr.toFixed(1)} people / hour</b><br />
              Trips needed: <b style={{ color: C.text }}>{trips}</b> → everyone there in <b style={{ color: c }}>{total} h</b>
            </div>
          </div>
        ))}
      </div>
      <Insight color={C.purple} title="A CPU is built for low latency. A GPU is built for high throughput.">
        The car wins for one person, the bus for a crowd. A CPU core finishes your single task as fast as possible. A GPU accepts that each task is
        slower and finishes a huge number of them per second.
      </Insight>
    </div>
  );
}

// ── Section 3: Where the transistors go ──
const AREAS = {
  cpu: [
    { k: "ctrl", x: 10, y: 10, w: 160, h: 70, label: "Control: branch prediction, out-of-order", c: C.purple },
    { k: "alu", x: 180, y: 10, w: 70, h: 70, label: "ALUs", c: C.green },
    { k: "cache", x: 10, y: 90, w: 240, h: 90, label: "Big caches (L1, L2, L3)", c: C.teal },
  ],
  gpu: [
    { k: "ctrl", x: 10, y: 10, w: 240, h: 18, label: "Control (small)", c: C.purple },
    { k: "alu", x: 10, y: 34, w: 240, h: 120, label: "Thousands of simple ALUs", c: C.green },
    { k: "cache", x: 10, y: 160, w: 240, h: 20, label: "Small caches", c: C.teal },
  ],
};
const WHY = {
  ctrl: "Control logic makes ONE instruction stream run fast: predicting branches, running instructions out of order, all the pipeline tricks from COA. Great for latency, but it takes a lot of chip area.",
  alu: "ALUs (arithmetic logic units) do the actual multiply-adds. More ALUs means more arithmetic per second, which is throughput.",
  cache: "Caches keep data close so ONE core rarely waits for slow memory (COA Unit 4). A GPU keeps caches small and hides memory waits a different way (Unit 4.3).",
};
function DieWidget() {
  const [k, setK] = useState("alu");
  const Die = ({ which, title }) => (
    <div style={{ flex: 1, minWidth: 240 }}>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{title}</div>
      <svg viewBox="0 0 260 190" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        {AREAS[which].map((a) => (
          <g key={a.k} onClick={() => setK(a.k)} style={{ cursor: "pointer" }}>
            <rect x={a.x} y={a.y} width={a.w} height={a.h} rx="6" fill={a.c + (k === a.k ? "55" : "22")} stroke={a.c} strokeWidth={k === a.k ? 2.5 : 1} />
            {which === "gpu" && a.k === "alu" && Array.from({ length: 96 }, (_, i) => <rect key={i} x={16 + (i % 16) * 14.6} y={40 + Math.floor(i / 16) * 18.5} width="10" height="13" rx="2" fill={C.green} opacity="0.7" />)}
            <text x={a.x + a.w / 2} y={a.y + a.h / 2 + 4} fill={C.text} fontSize="10.5" textAnchor="middle" style={{ pointerEvents: "none" }}>{which === "gpu" && a.k === "alu" ? "" : a.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
  return (
    <div>
      <Frame>
        A chip has a fixed budget of transistors. A CPU and a GPU spend that budget very differently. Click the coloured regions of these
        simplified chip floor plans.
      </Frame>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Die which="cpu" title="CPU: a few powerful cores (one shown)" />
        <Die which="gpu" title="GPU: many simple cores" />
      </div>
      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{WHY[k]}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="TYPICAL LAPTOP CPU" value="8–16 cores" color={C.orange} />
        <Stat label="NVIDIA T4 (COLAB)" value="2,560 CUDA cores" color={C.green} />
      </div>
      <Insight color={C.green} title="The CPU spends transistors on making one thread fast; the GPU spends them on doing many things at once.">
        Neither is "better". They're tuned for different jobs, and that's why every AI computer has both.
      </Insight>
    </div>
  );
}

// ── Section 4: The race ──
function RaceWidget() {
  const [e, setE] = useState(3);
  const n = Math.round(10 ** e);
  const cpu = Math.ceil(n / 8) * 1;              // 8 fast cores, 1 time unit per item
  const gpu = 200 + Math.ceil(n / 2560) * 20;    // launch/transfer overhead, then 2560 slow cores (20 units per item)
  const pts = Array.from({ length: 41 }, (_, i) => 1 + i * 0.15);
  const X = (v) => 30 + ((v - 1) / 6) * 480, Y = (t) => 160 - Math.log10(Math.max(1, t)) / 6 * 150;
  return (
    <div>
      <Frame>
        A toy model of the race. The CPU has <b style={{ color: C.orange }}>8 fast cores</b> (1 time unit per item). The GPU has
        <b style={{ color: C.green }}> 2,560 slower cores</b> (20 units per item) and a fixed <b style={{ color: C.yellow }}>start-up cost of 200</b> to send work
        and data over. Drag the number of independent items.
      </Frame>
      <Slider label={<>Items = <b style={{ color: C.accent }}>{n.toLocaleString("en-IN")}</b></>} value={e} min={0} max={7} step={0.05} onChange={setE} />
      <svg viewBox="0 0 520 180" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <polyline fill="none" stroke={C.orange} strokeWidth="2.5" points={pts.map((v) => `${X(v)},${Y(Math.ceil(10 ** v / 8))}`).join(" ")} />
        <polyline fill="none" stroke={C.green} strokeWidth="2.5" points={pts.map((v) => `${X(v)},${Y(200 + Math.ceil(10 ** v / 2560) * 20)}`).join(" ")} />
        <line x1={X(Math.max(1, e))} y1="10" x2={X(Math.max(1, e))} y2="165" stroke={C.accent} strokeDasharray="4 3" />
        <text x="36" y="22" fill={C.orange} fontSize="11">CPU</text><text x="36" y="36" fill={C.green} fontSize="11">GPU</text>
        <text x="440" y="176" fill={C.muted} fontSize="10">items (log) →</text>
      </svg>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="CPU TIME" value={cpu.toLocaleString("en-IN")} color={C.orange} />
        <Stat label="GPU TIME" value={gpu.toLocaleString("en-IN")} color={C.green} />
        <Stat label="WINNER" value={cpu < gpu ? "CPU" : `GPU, ${(cpu / gpu).toFixed(1)}× faster`} color={cpu < gpu ? C.orange : C.green} />
      </div>
      <Insight color={C.yellow} title="Small jobs: the CPU wins. Big parallel jobs: the GPU wins by miles.">
        The GPU's start-up cost (sending data and work across, Module 5) means tiny jobs aren't worth it. In Lab 3 you'll find the real
        crossover on Colab's T4.
      </Insight>
      <LabCard part="A" title="Meet your GPU"
        what="Switch Colab to a T4 GPU, check that PyTorch can see it, read its name, memory and number of streaming multiprocessors, and run nvidia-smi, the GPU's 'task manager'."
        expect="'Tesla T4', about 15 GB of memory, 40 multiprocessors, and an nvidia-smi table." />
    </div>
  );
}
//@@SECTIONS
[["One Expert or 1000?", "👩‍🏫 One Expert or a Thousand Students?", "NeedWidget"],
 ["Latency vs Throughput", "🚗🚌 Latency vs Throughput — car or bus?", "DefineWidget"],
 ["Where Transistors Go", "🔬 Where the Transistors Go — CPU vs GPU chips", "DieWidget"],
 ["The Race", "🏁 The Race — when does the GPU win?", "RaceWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "'Latency' means…", options: ["How many jobs finish per second", "How long one job takes from start to finish", "How much memory a job uses", "How many cores a chip has"], answer: 1, explain: "Latency = time for one job. Throughput = jobs completed per unit time." },
  { q: "A CPU devotes much of its chip area to…", options: ["Thousands of simple ALUs", "Control logic and large caches that make one thread fast", "Only memory", "Graphics output"], answer: 1, explain: "Branch prediction, out-of-order execution and big caches make one thread fast (low latency). That takes area away from raw ALUs." },
  { q: "For which job would a CPU likely beat a GPU?", options: ["Multiplying two 4000 × 4000 matrices", "Applying ReLU to 10 crore numbers", "Adding two numbers once", "Training an image model"], answer: 2, explain: "One tiny task can't use thousands of cores, and the GPU's start-up cost (sending the work over) dominates. The CPU finishes first." },
  { q: "Colab's T4 GPU has 2,560 CUDA cores; a laptop CPU has about 8. Yet each GPU core is…", options: ["Faster than a CPU core", "Slower and simpler than a CPU core", "Identical to a CPU core", "Not able to do arithmetic"], answer: 1, explain: "GPU cores are simple and individually slow. Their strength is numbers: high throughput, not low latency." },
];
const RESULT = {
  perfect: "Perfect! You know the two kinds of 'fast'.",
  good: "Good. Replay 'The Race' and find the crossover point.",
  low: "Revisit 'Latency vs Throughput': car vs bus is the key picture.",
  done: "Unit 3.1 Complete!",
  body: "You can explain latency vs throughput and why CPUs and GPUs spend their transistors so differently.",
  next: "Next up: Unit 3.2 — Why Clocks Stopped Getting Faster.",
  teaser: "Why not just make the CPU core faster and faster? Physics said no, around 2005.",
};
//@@WORDS
const UNIT_WORDS = [
  ["CPU", "Central Processing Unit", "The main processor: a few powerful cores, built for low latency.", "from COA"],
  ["GPU", "Graphics Processing Unit", "Built for graphics, now for AI: thousands of simple cores, built for throughput.", "new here"],
  ["ALU", "Arithmetic Logic Unit", "The part that actually does arithmetic.", "from COA"],
  ["CUDA core", "an NVIDIA GPU's basic arithmetic unit", "NVIDIA's name for one simple ALU lane. CUDA = Compute Unified Device Architecture.", "new here"],
  ["L1/L2/L3", "cache levels 1, 2, 3", "Small, fast memories near the core (COA Unit 4).", "from COA"],
];
