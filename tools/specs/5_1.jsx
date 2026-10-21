//@@META
{"unit": "5.1", "module": 5, "title": "Host & Device on PCIe", "icon": "🔌", "lab": "Lab05_CPU_GPU_Teamwork.ipynb", "labNo": 5, "gpu": true}
//@@WIDGETS

// ── Section 1: Need — the data is in the wrong building ──
function NeedWidget() {
  const [fixed, setFixed] = useState(false);
  return (
    <div>
      <Frame>
        A first-time GPU user moves the model to the GPU and runs it on some data. Python stops with an error. Toggle to see the broken code,
        then the fix.
      </Frame>
      <Btn onClick={() => setFixed((v) => !v)} color={fixed ? C.green : C.red}>{fixed ? "◀ Show the broken version" : "▶ Fix it"}</Btn>
      <div style={{ marginTop: 12 }}>
        <Code color={fixed ? C.green : C.red} title={fixed ? "✅ WORKS" : "❌ CRASHES"}>{fixed ? `model = model.to("cuda")      # weights → GPU memory
x = x.to("cuda")              # data   → GPU memory too
y = model(x)                  # ✓ both live on the GPU` : `model = model.to("cuda")      # weights → GPU memory
y = model(x)                  # x is still in CPU memory!`}</Code>
        {!fixed && (
          <pre style={{ marginTop: 8, background: "#2a1214", border: `1px solid ${C.red}`, borderRadius: 8, padding: 10, color: C.red, fontFamily: "monospace", fontSize: 11.5, whiteSpace: "pre-wrap" }}>
{`RuntimeError: Expected all tensors to be on the same device,
but found at least two devices, cuda:0 and cpu!`}
          </pre>
        )}
      </div>
      <Insight color={fixed ? C.green : C.red} title="The GPU can only compute on data that's in the GPU's own memory.">
        The GPU is a separate card with its own memory, like a coaching centre in a different building. Before it can work on your numbers,
        someone has to carry them over. This module is about that carrying.
      </Insight>
    </div>
  );
}

// ── Section 2: The system picture ──
const PARTS = {
  cpu: { t: "CPU (the host)", d: "Runs your Python program, makes decisions, and tells the GPU what to do. In CUDA language the CPU side is called the HOST.", c: C.orange },
  ram: { t: "Host memory (RAM)", d: "Where your program's variables, the dataset and NumPy arrays live, around 12 GB on Colab. The GPU can't compute directly on it.", c: C.orange },
  pcie: { t: "PCIe bus", d: "The slot the GPU card plugs into: a high-speed serial bus (COA Unit 5: standard I/O interfaces). The T4 uses PCIe Gen 3 ×16, about 16 GB/s in theory and around 12 GB/s in practice. Copies are done by DMA engines on the GPU, without the CPU moving each byte.", c: C.yellow },
  gpu: { t: "GPU (the device)", d: "The SMs, cores and Tensor Cores from Module 4. In CUDA language the GPU side is called the DEVICE.", c: C.green },
  vram: { t: "Device memory (GDDR6)", d: "The GPU's own 16 GB, delivering 320 GB/s, about 25× faster than PCIe. Your model weights and tensors must be here for the GPU to use them.", c: C.green },
};
function SystemWidget() {
  const [k, setK] = useState("pcie");
  const Box = ({ id, x, y, w, h, label }) => (
    <g onClick={() => setK(id)} style={{ cursor: "pointer" }}>
      <rect x={x} y={y} width={w} height={h} rx="8" fill={PARTS[id].c + (k === id ? "44" : "18")} stroke={PARTS[id].c} strokeWidth={k === id ? 2.5 : 1.2} />
      <text x={x + w / 2} y={y + h / 2 + 4} fill={C.text} fontSize="12" textAnchor="middle">{label}</text>
    </g>
  );
  return (
    <div>
      <Frame>Every GPU computer looks like this. Click each part. (Numbers for Colab's T4 machine, approximate.)</Frame>
      <svg viewBox="0 0 520 190" style={{ width: "100%", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <text x="20" y="20" fill={C.orange} fontSize="11" fontWeight="700">HOST</text>
        <text x="390" y="20" fill={C.green} fontSize="11" fontWeight="700">DEVICE</text>
        <Box id="cpu" x={20} y={30} w={140} h={50} label="CPU" />
        <Box id="ram" x={20} y={110} w={140} h={50} label="RAM ≈ 12 GB" />
        <line x1="90" y1="80" x2="90" y2="110" stroke={C.orange} strokeWidth="2" />
        <Box id="pcie" x={185} y={70} w={150} h={40} label="PCIe ≈ 12 GB/s" />
        <line x1="160" y1="90" x2="185" y2="90" stroke={C.yellow} strokeWidth="3" /><line x1="335" y1="90" x2="360" y2="90" stroke={C.yellow} strokeWidth="3" />
        <Box id="gpu" x={360} y={30} w={140} h={50} label="GPU (40 SMs)" />
        <Box id="vram" x={360} y={110} w={140} h={50} label="GDDR6 16 GB" />
        <line x1="430" y1="80" x2="430" y2="110" stroke={C.green} strokeWidth="5" />
        <text x="438" y="100" fill={C.green} fontSize="9">320 GB/s</text>
      </svg>
      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: PARTS[k].c + "14", border: `1px solid ${PARTS[k].c}55`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        <b style={{ color: C.text }}>{PARTS[k].t}.</b> {PARTS[k].d}
      </div>
      <Insight color={C.yellow} title="To the CPU, the GPU is an I/O device on a bus, exactly like in COA Unit 5.">
        Your COA knowledge applies directly: the GPU card sits on PCIe, data moves by DMA, and the GPU signals when it's done. The narrow
        PCIe link between two fast memories is the bottleneck to respect.
      </Insight>
    </div>
  );
}

// ── Section 3: What a copy costs ──
function CopyWidget() {
  const [mb, setMb] = useState(500);
  const [ops, setOps] = useState(1);
  const pcie = mb / 12000, inside = (mb / 320000) * ops;
  const total = pcie * 2 + inside;
  return (
    <div>
      <Frame>
        Move data over, do some GPU operations on it, bring the result back. How much of the time is just carrying? Change the data size and
        how many operations the GPU does on the data while it's there (each one reads and writes it at 320 GB/s).
      </Frame>
      <Slider label={<>Data size = <b style={{ color: C.teal }}>{mb} MB</b></>} value={mb} min={1} max={4000} onChange={setMb} color={C.teal} />
      <Slider label={<>GPU operations done on it before copying back = <b style={{ color: C.green }}>{ops}</b></>} value={ops} min={1} max={500} onChange={setOps} color={C.green} />
      <div style={{ display: "flex", height: 34, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}`, marginTop: 6 }}>
        <div style={{ width: `${(pcie / total) * 100}%`, background: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", color: "#0D1117", fontSize: 11, fontWeight: 700 }}>copy in</div>
        <div style={{ width: `${(inside / total) * 100}%`, minWidth: 3, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", color: "#0D1117", fontSize: 11, fontWeight: 700 }}>{inside / total > 0.15 ? "GPU work" : ""}</div>
        <div style={{ width: `${(pcie / total) * 100}%`, background: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", color: "#0D1117", fontSize: 11, fontWeight: 700 }}>copy out</div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="EACH PCIe COPY" value={`${(pcie * 1000).toFixed(1)} ms`} color={C.yellow} />
        <Stat label="GPU WORK" value={`${(inside * 1000).toFixed(1)} ms`} color={C.green} />
        <Stat label="TIME SPENT COPYING" value={`${((2 * pcie / total) * 100).toFixed(0)}%`} color={2 * pcie / total > 0.5 ? C.red : C.green} />
      </div>
      <Insight color={C.green} title="Copy once, compute many times, copy back once.">
        One operation per copy wastes about 98% of the time on PCIe. Hundreds of operations per copy (like a whole training run on data that stays
        on the GPU) make the copy negligible. That's why models and batches are moved to the GPU and kept there.
      </Insight>
    </div>
  );
}

// ── Section 4: Other ways to connect ──
const VARIANTS = [
  { t: "Pinned (page-locked) host memory", c: C.teal, d: "Normal RAM can be moved around by the operating system's paging, so the GPU's DMA engine can't read it directly: the driver first copies it into a locked staging area. Pinned memory is locked in place, so DMA reads it directly. Copies get faster and can overlap with computing. In PyTorch: DataLoader(pin_memory=True)." },
  { t: "Integrated GPU / unified memory", c: C.purple, d: "Phones, laptops with integrated graphics and Apple M-series chips put the CPU and GPU on one chip sharing ONE memory: no PCIe copy at all. The trade-off is less total memory bandwidth than a big discrete GPU." },
  { t: "NVLink", c: C.green, d: "NVIDIA's direct GPU-to-GPU link in data-centre servers: hundreds of GB/s, many times faster than PCIe. It lets 8 GPUs work on one model (Unit 7.4)." },
  { t: "Newer PCIe generations", c: C.yellow, d: "Each PCIe generation roughly doubles the speed: Gen 3 ≈ 16 GB/s, Gen 4 ≈ 32 GB/s, Gen 5 ≈ 64 GB/s for ×16 (theoretical, approximate). Still far below the GPU's own memory." },
];
function VariantsWidget() {
  const [i, setI] = useState(0);
  return (
    <div>
      <Frame>The basic picture has some important variations. Click each.</Frame>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {VARIANTS.map((v, k) => <Btn key={k} ghost={k !== i} onClick={() => setI(k)} color={v.c}>{v.t}</Btn>)}
      </div>
      <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 8, background: VARIANTS[i].c + "14", border: `1px solid ${VARIANTS[i].c}55`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{VARIANTS[i].d}</div>
      <Insight color={C.teal} title="The goal is always the same: make the host-device link matter less.">
        Lock memory so DMA can use it directly, share memory instead of copying, or build faster links. All of them attack the same bottleneck.
      </Insight>
      <LabCard part="A" title="Where does a tensor live, and what does moving it cost?"
        what="Check tensor.device, trigger the 'same device' error and fix it, then time .to('cuda') for growing sizes to measure your PCIe speed, with and without pinned memory."
        expect="'cpu' and 'cuda:0' devices, copy speeds of a few GB/s up to about 12 GB/s, and pinned memory copying noticeably faster." />
    </div>
  );
}
//@@SECTIONS
[["Wrong Building", "🏢 The Data Is in the Wrong Building", "NeedWidget"],
 ["Host & Device", "🔌 Host & Device — the system picture", "SystemWidget"],
 ["What a Copy Costs", "📦 What a Copy Costs — PCIe vs GPU memory", "CopyWidget"],
 ["Variations", "🔀 Variations — pinned memory, unified memory, NVLink", "VariantsWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "In CUDA terminology, the 'host' is…", options: ["The GPU", "The CPU and its memory", "The PCIe bus", "The cloud server"], answer: 1, explain: "Host = CPU + RAM; device = GPU + its own memory." },
  { q: "PyTorch says 'Expected all tensors to be on the same device, cuda:0 and cpu'. What's the fix?", options: ["Restart Colab", "Move the CPU tensor to the GPU with .to('cuda')", "Use a smaller batch", "Turn off the GPU"], answer: 1, explain: "The GPU can only compute on data in its own memory. Move the data (or the model) so both are on the same device." },
  { q: "Copying 1.2 GB over PCIe at 12 GB/s takes about…", options: ["1 ms", "10 ms", "100 ms", "1 s"], answer: 2, explain: "1.2 GB ÷ 12 GB/s = 0.1 s = 100 ms. Inside the GPU (320 GB/s) the same data moves in about 4 ms." },
  { q: "Why is pinned (page-locked) memory faster to copy?", options: ["It's stored on the GPU", "The GPU's DMA engine can read it directly, without an extra staging copy", "It compresses the data", "It uses NVLink"], answer: 1, explain: "Pageable memory might be moved by the OS, so it's first copied to a locked buffer. Pinned memory skips that step." },
];
const RESULT = {
  perfect: "Perfect! You understand the host-device split.",
  good: "Good. Replay 'What a Copy Costs' and push the operations slider.",
  low: "Revisit 'Host & Device': two memories, one narrow bus.",
  done: "Unit 5.1 Complete!",
  body: "You can explain host vs device, the PCIe link, copy costs, and pinned memory, unified memory and NVLink.",
  next: "Next up: Unit 5.2 — The Five Steps of Offloading.",
  teaser: "Allocate, copy in, launch, copy out, free: exactly how the CPU hands a job to the GPU.",
};
//@@WORDS
const UNIT_WORDS = [
  ["host / device", "CPU side / GPU side", "CUDA's names for the two halves of the system.", "new here"],
  ["PCIe", "Peripheral Component Interconnect Express", "The bus the GPU card plugs into (COA Unit 5).", "from COA"],
  ["DMA", "Direct Memory Access", "Hardware that copies data without the CPU moving each byte (COA Unit 5).", "from COA"],
  ["VRAM / GDDR6", "the GPU's own memory", "Video RAM; on the T4 it's 16 GB of GDDR6.", "from Unit 4.1"],
  ["NVLink", "NVIDIA's GPU-to-GPU link", "Much faster than PCIe; used in multi-GPU servers.", "new here"],
];
