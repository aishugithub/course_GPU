from common import md, code, how_to_run, build, FOOTHOLD, GPU_SETUP, CUPY_SETUP



cells = [
md(f"""
# 🔬 Lab 3 — Inside a GPU
**Foothold · GPU Computing for AI · Module 3**

Open up the T4: count its parts, make its warps diverge, watch it hide memory latency, measure its bandwidth, and check your capstone plan.
For the first time you'll run small **CUDA C kernels**, the code that each GPU thread runs, through the CuPy library.

| Part | What you do | Goes with Foothold unit |
|---|---|---|
| A | Compute the T4's peak, then measure FP32 vs FP16 | 3.1 SMs, Cores & Tensor Cores |
| B | Make a warp diverge and time the damage | 3.2 Warps & Branch Divergence |
| C | Add threads until memory latency is hidden | 3.3 Hiding Latency |
| D | Measure bandwidth: coalesced vs strided | 3.4 GPU Memory & Bandwidth |
| E | Your capstone plan vs reality | 3.C Capstone |

⏱️ About 90 minutes. 📘 Textbook: Kirk & Hwu Ch 4–5 · H&P §4.4 · Hamacher §12.1, Ch 8. Course site: {FOOTHOLD}
"""),
how_to_run(gpu=True),
md("## 0 · Setup — run both cells"),
GPU_SETUP,
CUPY_SETUP,

# ── Part A ──
md("""
---
## Part A · Work Out the Peak, Then Measure  *(Unit 3.1)*

Peak FLOPS = SMs × units per SM × FLOPs per unit per clock × clock rate. For the T4: 64 FP32 cores and 8 Tensor Cores per SM; one FMA (2 FLOPs) per core per clock; 64 FMAs per Tensor Core per clock.
"""),
code("""
sms = torch.cuda.get_device_properties(0).multi_processor_count if device == "cuda" else 40
clock_ghz = 1.59                                   # T4 boost clock (check nvidia-smi: clocks.max.sm)
fp32_peak = sms * 64 * 2 * clock_ghz * 1e9
fp16_peak = sms * 8 * 64 * 2 * clock_ghz * 1e9
print(f"SMs: {sms}")
print(f"Peak FP32 (CUDA cores)  : {fp32_peak / 1e12:5.1f} TFLOPS")
print(f"Peak FP16 (Tensor Cores): {fp16_peak / 1e12:5.1f} TFLOPS")
"""),
code("""
N = 4096
for dtype in [torch.float32, torch.float16]:
    if device == "cpu" and dtype == torch.float16:
        print("(skipping FP16 on CPU)"); continue
    a = torch.rand(N, N, device=device, dtype=dtype); b = torch.rand(N, N, device=device, dtype=dtype)
    t = timeit(lambda: a @ b, repeats=10)
    print(f"{str(dtype):15s}: {t*1e3:7.2f} ms  →  {2 * N**3 / t / 1e12:5.1f} TFLOPS measured")
"""),
md("""
### ✏️ YOUR TURN (A)
What percentage of the computed peak did each precision reach? Why is FP16 so much faster? (Hint: which units does it use?)

*Your answer:*
"""),

# ── Part B ──
md("""
---
## Part B · Branch Divergence  *(Unit 3.2)*

Below is a real CUDA kernel. Every thread takes one of two expensive paths.
- `mode = 0`: the path is chosen by `(i / 32) % 2`, so all 32 threads in a warp agree.
- `mode = 1`: the path is chosen by `i % 2`, so every warp splits in half.

Same threads, same total work. Only the arrangement differs.
"""),
code("""
branchy_src = r'''
extern "C" __global__
void branchy(float *x, int n, int mode, int work) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;      // this thread's element
    if (i >= n) return;
    int path = (mode == 0) ? ((i / 32) % 2) : (i % 2);
    float v = x[i];
    if (path) { for (int k = 0; k < work; k++) v = v * 0.9999f + 0.0001f; }   // path A
    else      { for (int k = 0; k < work; k++) v = v * 1.0001f - 0.0001f; }   // path B
    x[i] = v;
}
'''
if HAVE_CUPY:
    branchy = cp.RawKernel(branchy_src, "branchy")
    n, work = 1 << 22, 2000                       # about 42 lakh threads
    x = cp.ones(n, dtype=cp.float32)
    threads = 256; blocks = (n + threads - 1) // threads
    times = {}
    for mode, name in [(0, "warps agree   (i/32)%2"), (1, "warps diverge  i%2   ")]:
        times[mode] = cuda_time_ms(lambda: branchy((blocks,), (threads,), (x, cp.int32(n), cp.int32(mode), cp.int32(work))))
        print(f"{name}: {times[mode]:7.2f} ms")
    print(f"Divergence cost: {times[1] / times[0]:.2f}× slower")
else:
    print("Needs a GPU with CuPy: skipped.")
"""),
md("""
### ✏️ YOUR TURN (B)
1. Was the diverging version about 2× slower? Explain why using the word *warp*.
2. Change `(i / 32) % 2` to `(i / 16) % 2` and re-run. Predict first: does it diverge?

*Your answers:*
"""),

# ── Part C ──
md("""
---
## Part C · Hiding Latency  *(Unit 3.3)*

A copy kernel where each thread copies elements in a loop (a "grid-stride loop"). We launch **more and more threads** for the same 256 MB copy.
With few threads, each warp mostly waits for memory. With many, the scheduler always has a ready warp.
"""),
code("""
copy_src = r'''
extern "C" __global__
void copy(const float *x, float *y, int n) {
    int stride = gridDim.x * blockDim.x;
    for (int i = blockIdx.x * blockDim.x + threadIdx.x; i < n; i += stride)
        y[i] = x[i];
}
'''
if HAVE_CUPY:
    copy_k = cp.RawKernel(copy_src, "copy")
    n = 1 << 26                                    # 6.7 crore floats = 256 MB
    xs, ys = cp.random.rand(n, dtype=cp.float32), cp.empty(n, dtype=cp.float32)
    total_threads, bandwidth = [], []
    for blocks in [1, 4, 16, 40, 80, 160, 320, 640, 1280]:
        ms = cuda_time_ms(lambda: copy_k((blocks,), (256,), (xs, ys, cp.int32(n))), repeats=3)
        gbs = 2 * n * 4 / (ms / 1e3) / 1e9          # read + write
        total_threads.append(blocks * 256); bandwidth.append(gbs)
        print(f"{blocks*256:>8,d} threads ({blocks*256/32/40:6.1f} warps per SM): {gbs:6.1f} GB/s")
    plt.figure(figsize=(6, 3.5)); plt.semilogx(total_threads, bandwidth, "o-")
    plt.xlabel("threads launched"); plt.ylabel("GB/s"); plt.grid(alpha=0.3, which="both")
    plt.title("More warps → memory latency hidden → bandwidth rises, then levels off"); plt.show()
else:
    print("Needs a GPU with CuPy: skipped.")
"""),
md("""
### ✏️ YOUR TURN (C)
Roughly how many warps per SM did it take before the bandwidth levelled off? Connect this to the tea master in Unit 3.3.

*Your answer:*
"""),

# ── Part D ──
md("""
---
## Part D · Bandwidth: Coalesced vs Strided  *(Unit 3.4)*

First, the best-case bandwidth: copy a big tensor inside GPU memory with PyTorch.
"""),
code("""
big = torch.rand(1 << 27, device=device)              # 13.4 crore floats = 512 MB
t = timeit(lambda: big.clone(), repeats=5)
print(f"Copy 512 MB inside the GPU: {t*1e3:.1f} ms → {2 * big.numel() * 4 / t / 1e9:.0f} GB/s  (T4 peak: 320 GB/s)")
"""),
md("""
Now a kernel where thread i reads element `(i × stride) % n`. With stride 1, neighbouring threads read neighbouring floats (coalesced). With stride 32, each thread in a warp hits a different 128-byte chunk.
"""),
code("""
stride_src = r'''
extern "C" __global__
void strided(const float *x, float *y, int n, int stride) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) y[i] = x[(long long)i * stride % n];
}
'''
if HAVE_CUPY:
    strided = cp.RawKernel(stride_src, "strided")
    n = 1 << 25
    xs, ys = cp.random.rand(n, dtype=cp.float32), cp.empty(n, dtype=cp.float32)
    blocks = (n + 255) // 256
    for s in [1, 2, 8, 32]:
        ms = cuda_time_ms(lambda: strided((blocks,), (256,), (xs, ys, cp.int32(n), cp.int32(s))))
        print(f"stride {s:2d}: {ms:6.2f} ms   useful bandwidth {2 * n * 4 / (ms / 1e3) / 1e9:6.1f} GB/s")
else:
    print("Needs a GPU with CuPy: skipped.")
"""),
md("""
### ✏️ YOUR TURN (D)
How many times slower was stride 32 than stride 1? Why doesn't stride 2 hurt as much?

*Your answer:*
"""),

# ── Part E ──
md("""
---
## Part E · Your Plan vs Reality  *(Unit 3.C)*

The capstone planner predicts lower bounds from FLOPs and bytes. Now measure.
"""),
code("""
PEAK, BW = 8.1e12, 320e9
N = 4096
W = torch.rand(N, N, device=device)
print(f"{'job':16s} {'plan (ms)':>10s} {'limit':>8s} {'measured':>10s} {'achieved':>16s}")
for B in [1, 64, 1024]:
    X = torch.rand(B, N, device=device)
    # matmul layer
    flops, nbytes = 2 * B * N * N, (B * N + N * N + B * N) * 4
    plan_ms = max(flops / PEAK, nbytes / BW) * 1e3
    t = timeit(lambda: X @ W, repeats=10)
    print(f"matmul B={B:<6d} {plan_ms:10.3f} {'compute' if flops/PEAK > nbytes/BW else 'memory':>8s} {t*1e3:10.3f}   {flops / t / 1e12:6.2f} TFLOPS")
    # ReLU on the layer's output
    Y = X @ W
    nbytes = 2 * B * N * 4
    t = timeit(lambda: torch.relu(Y), repeats=10)
    print(f"ReLU   B={B:<6d} {nbytes/BW*1e3:10.3f} {'memory':>8s} {t*1e3:10.3f}   {nbytes / t / 1e9:6.1f} GB/s")
"""),
md("""
### ✏️ YOUR TURN (E) — record your results
| Job | Planned limit | Measured time | Achieved |
|---|---|---|---|
| matmul B=1 | | | |
| matmul B=1024 | | | |
| ReLU B=1024 | | | |

1. Which jobs came closest to their plan? Which were furthest away, and why might tiny jobs miss by a lot? (Hint: launch overhead, Unit 2.1.)
2. Why does the B = 1024 matmul achieve far more TFLOPS than B = 1?

*Your answers:*

---
## 🎓 Wrap-up
- A GPU = many SMs; an SM = schedulers + registers + CUDA cores + Tensor Cores; work runs in warps of 32.
- Divergence costs time; many warps hide memory latency; coalesced access gets the bandwidth.
- Every job is limited by either compute or memory; the bigger lower bound wins.
- **Next — Module 4: CPU–GPU Teamwork.** You'll allocate, copy, launch your own kernel, and copy back, step by step.
"""),
]

build("Lab3_Inside_a_GPU.ipynb", "Lab 3", cells, gpu=True)
