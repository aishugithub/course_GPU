//@@META
{"unit": "5.6", "module": 5, "title": "The Software Stack", "icon": "🥞", "lab": "Lab5B_GPUs_in_Real_Projects.ipynb", "labNo": "5B", "gpu": true}
//@@WIDGETS

// ── Section 1: Need — where does one line go? ──
const LAYERS = [
  { k: "py", t: "Your Python code", c: C.accent, d: "y = model(x). You think in layers and tensors; you never mention SMs, warps or memory copies.", ex: "y = model(x)" },
  { k: "pt", t: "PyTorch (the framework)", c: C.purple, d: "Breaks the model into operations (matmul, add, relu…), records them for autograd (loss.backward), manages GPU memory with a caching allocator, and picks a kernel for each operation.", ex: "aten::linear → aten::addmm" },
  { k: "lib", t: "Libraries: cuBLAS, cuDNN, …", c: C.green, d: "NVIDIA's expert-tuned kernels: cuBLAS for matrix multiplies (Unit 5.1), cuDNN for neural-network layers. PyTorch also has its own kernels for simpler operations, and torch.compile can generate fused ones.", ex: "cublasSgemm(…)" },
  { k: "rt", t: "CUDA runtime", c: C.teal, d: "The API from Module 4: allocate (cudaMalloc), copy (cudaMemcpy), launch kernels <<<grid, block>>>, streams and synchronisation.", ex: "cudaLaunchKernel(…)" },
  { k: "drv", t: "NVIDIA driver", c: C.yellow, d: "Part of the operating system. It talks to the hardware: puts commands in the GPU's queue, sets up the DMA copies over PCIe, handles interrupts when work finishes (COA Unit 5).", ex: "driver 5xx.xx" },
  { k: "hw", t: "The GPU hardware", c: C.orange, d: "The SMs, warps, Tensor Cores and GDDR6 memory from Module 3 finally do the work.", ex: "40 SMs on a T4" },
];
function StackWidget() {
  const [k, setK] = useState(0);
  return (
    <div>
      <Frame>
        One line, <code style={{ color: C.accent }}>y = model(x)</code>, passes through six layers of software before any transistor switches, like a food order going
        from the app to the restaurant, the kitchen manager, the chef and finally the stove. Click down through the stack.
      </Frame>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {LAYERS.map((l, i) => (
          <div key={l.k} onClick={() => setK(i)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: l.c + (i === k ? "33" : "11"), border: `1.5px solid ${i === k ? l.c : l.c + "55"}`, marginLeft: i * 10, marginRight: i * 10 }}>
            <b style={{ color: l.c, fontSize: 13, flex: 1 }}>{l.t}</b>
            <code style={{ color: C.muted, fontSize: 11 }}>{l.ex}</code>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}><b style={{ color: C.text }}>{LAYERS[k].t}.</b> {LAYERS[k].d}</div>
      <Insight title="Each layer hides the one below it. That's why AI code is short, and why problems can come from any layer.">
        Most of the time you only touch the top. Knowing the layers underneath, which this course has walked through, is what lets you fix
        things when they go wrong.
      </Insight>
    </div>
  );
}

// ── Section 2: Versions must match ──
const SCEN = [
  { t: "PyTorch built for CUDA 12.4 · driver supports up to CUDA 12.4", ok: true, why: "Everything matches. torch.cuda.is_available() → True." },
  { t: "PyTorch built for CUDA 12.4 · driver supports only up to CUDA 11.8", ok: false, why: "The driver is too old for this PyTorch build. Typical message: 'The NVIDIA driver on your system is too old'. Fix: update the driver, or install a PyTorch build for an older CUDA." },
  { t: "PyTorch CPU-only build · good driver and GPU", ok: false, why: "pip installed the CPU version of PyTorch, so it can't see the GPU at all: torch.cuda.is_available() → False. Fix: reinstall PyTorch with CUDA support." },
  { t: "Newer driver (supports CUDA 12.6) · PyTorch built for CUDA 12.1", ok: true, why: "Fine: newer drivers run programs built for older CUDA versions (backward compatibility)." },
];
function VersionWidget() {
  const [pick, setPick] = useState({});
  return (
    <div>
      <Frame>
        The layers are built separately, so their versions must be compatible. The rule of thumb: <b style={{ color: C.text }}>the driver must support at least the CUDA
        version PyTorch was built for</b>. On Colab this is all arranged for you; on your own PC it's the number-one setup problem. Will each combination work?
      </Frame>
      {SCEN.map((s, i) => {
        const p = pick[i];
        return (
          <div key={i} style={{ background: C.card, border: `1px solid ${p === undefined ? C.border : p === s.ok ? C.green : C.red}`, borderRadius: 8, padding: "9px 12px", marginBottom: 7 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220, color: C.text, fontSize: 12.5, fontFamily: "monospace" }}>{s.t}</div>
              {[[true, "✅ Works"], [false, "❌ Fails"]].map(([v, l]) => (
                <button key={l} onClick={() => p === undefined && setPick((q) => ({ ...q, [i]: v }))} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${v ? C.green : C.red}`, background: p === v ? (v ? C.green : C.red) + "33" : "transparent", color: C.text, fontSize: 12, cursor: p === undefined ? "pointer" : "default" }}>{l}</button>
              ))}
            </div>
            {p !== undefined && <div style={{ marginTop: 5, fontSize: 12, color: p === s.ok ? C.green : C.red }}>{p === s.ok ? "✓ " : "✗ "}{s.why}</div>}
          </div>
        );
      })}
      <Code color={C.teal} title="🔍 CHECK EVERY LAYER IN 3 LINES">{`import torch
print(torch.__version__, torch.version.cuda, torch.backends.cudnn.version())
!nvidia-smi        # top line shows the driver version and the CUDA version it supports`}</Code>
      <Insight color={C.teal} title="'torch.cuda.is_available() is False' is almost always a version or installation problem, not broken hardware.">
        Check the three layers: is a GPU present (nvidia-smi), is the driver new enough, and is PyTorch the CUDA build?
      </Insight>
    </div>
  );
}

// ── Section 3: One code, many devices ──
const DEVICES = {
  cuda: { t: "NVIDIA GPU", s: "cuda", stack: "CUDA · cuBLAS · cuDNN", note: "The most widely used. Everything in this course." },
  rocm: { t: "AMD GPU", s: "cuda (via ROCm/HIP)", stack: "ROCm · HIP · rocBLAS · MIOpen", note: "AMD's stack. PyTorch's ROCm build reuses the 'cuda' device name, so most code runs unchanged." },
  mps: { t: "Apple M-series", s: "mps", stack: "Metal Performance Shaders", note: "On Mac laptops. Unified memory: no PCIe copies (Unit 4.1)." },
  cpu: { t: "CPU only", s: "cpu", stack: "oneDNN · MKL / OpenBLAS", note: "Always available. Slow for big models, fine for learning and small jobs." },
};
function DeviceWidget() {
  const [k, setK] = useState("cuda");
  const d = DEVICES[k];
  return (
    <div>
      <Frame>
        The software stack also lets the SAME Python code run on different hardware. Only the bottom layers change. Pick a machine.
      </Frame>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
        {Object.entries(DEVICES).map(([key, v]) => <Btn key={key} ghost={key !== k} onClick={() => setK(key)}>{v.t}</Btn>)}
      </div>
      <Code color={C.accent} title="🐍 YOUR CODE (UNCHANGED)">{`device = "${d.s.split(" ")[0]}"
model = model.to(device)
y = model(x.to(device))`}</Code>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="DEVICE STRING" value={d.s} color={C.accent} />
        <Stat label="LIBRARIES UNDERNEATH" value={d.stack} color={C.green} />
      </div>
      <div style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>{d.note}</div>
      <Code color={C.muted} title="PORTABLE DEVICE PICKER">{`if torch.cuda.is_available():            device = "cuda"
elif torch.backends.mps.is_available():  device = "mps"
else:                                    device = "cpu"`}</Code>
      <Insight color={C.purple} title="Frameworks are a portability layer: write once, run on whatever accelerator is underneath.">
        Inference-only tools such as ONNX Runtime and NVIDIA TensorRT go further, converting a trained model into a form optimised for one specific chip.
      </Insight>
    </div>
  );
}

// ── Section 4: Peek at real kernel names ──
const PROF = [
  ["aten::linear", "PyTorch", "the Linear layer you called"],
  ["aten::addmm", "PyTorch", "'add + matrix multiply': y = b + x·Wᵀ"],
  ["turing_s1688gemm_fp16_128x128_ldg8_relu_f2f_tn", "cuBLAS", "a GEMM kernel for Turing (T4), using FP16 Tensor Cores on 128 × 128 tiles"],
  ["volta_sgemm_128x64_nn", "cuBLAS", "an FP32 single-precision GEMM ('sgemm') on 128 × 64 tiles"],
  ["vectorized_elementwise_kernel<…relu…>", "PyTorch", "the ReLU: one thread per element, branch-free (Unit 3.2)"],
  ["Memcpy HtoD (Pageable -> Device)", "CUDA runtime", "a host-to-device copy over PCIe from pageable memory (Unit 4.1)"],
];
function KernelWidget() {
  const [i, setI] = useState(2);
  return (
    <div>
      <Frame>
        The PyTorch profiler (Unit 4.C) shows the stack in action. Here are typical entries from profiling a small model on a T4. Click each one
        and decode it with what you've learned.
      </Frame>
      <div style={{ background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, padding: 8 }}>
        {PROF.map(([n, layer], k) => (
          <div key={n} onClick={() => setI(k)} style={{ cursor: "pointer", display: "flex", gap: 8, padding: "6px 8px", borderRadius: 6, background: k === i ? C.accent + "22" : "transparent", fontFamily: "monospace", fontSize: 11.5 }}>
            <span style={{ color: C.text, flex: 1, wordBreak: "break-all" }}>{n}</span>
            <span style={{ color: C.muted }}>{layer}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: C.accent + "14", border: `1px solid ${C.accent}55`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        <b style={{ color: C.text }}>{PROF[i][0]}</b>: {PROF[i][2]}.
      </div>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 6 }}>Exact kernel names vary between GPUs and library versions. 'GEMM' = GEneral Matrix Multiply.</div>
      <Insight color={C.green} title="Under every model are a few kinds of kernels: matrix multiplies, element-wise operations, and copies.">
        You now understand all three: tiling and Tensor Cores (Module 5), branch-free element-wise kernels (Module 3), and PCIe copies (Module 4).
      </Insight>
      <LabCard part="A" title="Inspect the stack on Colab"
        what="Print the PyTorch, CUDA and cuDNN versions and the driver from nvidia-smi, write a portable device picker, then profile a small model and identify the cuBLAS GEMM kernels, element-wise kernels and memory copies."
        expect="matching version numbers, a 'cuda' device, and kernel names containing 'gemm' in the profiler table." />
    </div>
  );
}
//@@SECTIONS
[["Down the Stack", "🥞 Down the Stack — from Python to silicon", "StackWidget"],
 ["Versions Must Match", "🔧 Versions Must Match — driver, CUDA, PyTorch", "VersionWidget"],
 ["One Code, Many Devices", "🔁 One Code, Many Devices", "DeviceWidget"],
 ["Real Kernel Names", "🔍 Decode Real Kernel Names", "KernelWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "Which library does PyTorch typically call for a big matrix multiply on an NVIDIA GPU?", options: ["cuDNN", "cuBLAS", "NumPy", "The driver directly"], answer: 1, explain: "cuBLAS provides tuned GEMM kernels; cuDNN focuses on neural-network layers like convolutions." },
  { q: "torch.cuda.is_available() returns False on a PC that has an NVIDIA GPU. The most likely cause is…", options: ["The GPU is broken", "A version/installation problem: CPU-only PyTorch or a too-old driver", "The model is too big", "The batch size is wrong"], answer: 1, explain: "Check nvidia-smi (driver and GPU present) and torch.version.cuda (None means a CPU-only build)." },
  { q: "Which part of the stack sets up DMA copies over PCIe and handles the GPU's 'work finished' interrupts?", options: ["Your Python code", "PyTorch", "The NVIDIA driver", "cuBLAS"], answer: 2, explain: "The driver is the OS-level layer that talks to the hardware, exactly the I/O role from COA Unit 5." },
  { q: "What does 'gemm' in a kernel name such as turing_s1688gemm_fp16… tell you?", options: ["It's a copy", "It's a general matrix multiply", "It's a ReLU", "It's an error"], answer: 1, explain: "GEMM = GEneral Matrix Multiply. 'fp16' and 's1688' tell you it uses FP16 Tensor Cores on a Turing GPU." },
];
const RESULT = {
  perfect: "Perfect! You can see through the whole software stack.",
  good: "Good. Replay 'Down the Stack' and click every layer.",
  low: "Revisit 'Down the Stack': Python → PyTorch → libraries → CUDA → driver → GPU.",
  done: "Unit 5.6 Complete!",
  body: "You can name every layer between your code and the GPU, fix version problems, write portable device code, and read kernel names.",
  next: "Next up: Unit 5.7 — Will It Fit? Sizing GPU Memory.",
  teaser: "Weights, gradients, optimiser states and activations: do the memory maths before the GPU does it for you.",
};
//@@WORDS
const UNIT_WORDS = [
  ["cuBLAS / cuDNN", "CUDA Basic Linear Algebra Subprograms / CUDA Deep Neural Network library", "NVIDIA's tuned kernel libraries.", "from Units 5.1, 5.4"],
  ["GEMM", "GEneral Matrix Multiply", "The standard name for C = αAB + βC kernels.", "new here"],
  ["ROCm / HIP", "AMD's GPU software platform / its CUDA-like language", "AMD's equivalent of CUDA.", "new here"],
  ["MPS", "Metal Performance Shaders", "Apple's GPU framework; PyTorch device 'mps'.", "new here"],
  ["ONNX", "Open Neural Network Exchange", "A file format for moving trained models between tools.", "new here"],
];
