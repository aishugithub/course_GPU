from common import md, code, how_to_run, build, FOOTHOLD, GPU_SETUP, CUPY_SETUP

cells = [
md(f"""
# 🚀 Lab 5A — Why GPUs Make AI Fast
**Foothold · GPU Computing for AI · Module 5**

Measure the tricks that make GPUs so good at AI: tiling, Tensor Cores and low precision, the roofline, and batch size. Then put them together to speed up a real training run.

| Part | What you do | Goes with Foothold unit |
|---|---|---|
| A | Naive vs tiled matrix-multiply kernels vs cuBLAS | 5.1 Parallel Matrix Multiply & Tiling |
| B | FP32 vs FP16: speed, error, overflow, mixed-precision training | 5.2 Precision |
| C | Measure operations and plot your own roofline | 5.3 Compute-bound vs Memory-bound |
| D | CPU vs GPU training, batch-size sweep, memory | 5.4 Batch Size & Training on GPU |
| E | The speed-up ladder on Fashion-MNIST | 5.5 Capstone |

⏱️ About 2 hours (A–C, then D–E). 📘 Textbook: Kirk & Hwu Ch 5 and Ch 16 · Hamacher Ch 9 (floating point) · H&P Ch 4 (roofline). Course site: {FOOTHOLD}
"""),
how_to_run(gpu=True),
md("## 0 · Setup — run both cells"),
GPU_SETUP,
CUPY_SETUP,

# ── Part A ──
md("""
---
## Part A · Naive vs Tiled vs cuBLAS  *(Unit 5.1)*

Two hand-written kernels from the lesson, compiled with CuPy, raced against PyTorch's `A @ B` (which calls NVIDIA's cuBLAS library).
"""),
code("""
# Two CUDA C kernels in one string (inside the C code, comments start with //)
mm_src = r'''
#define T 16                                            // tile size: each block works on 16 × 16 tiles
extern "C" __global__
void matmul_naive(const float *A, const float *B, float *C, int n) {
    int row = blockIdx.y * blockDim.y + threadIdx.y;    // which output row this thread computes
    int col = blockIdx.x * blockDim.x + threadIdx.x;    // which output column
    if (row < n && col < n) {
        float sum = 0.0f;
        for (int k = 0; k < n; k++)                     // walk along row of A and down column of B...
            sum += A[row * n + k] * B[k * n + col];     // ...reading BOTH from slow global memory every time
        C[row * n + col] = sum;
    }
}

extern "C" __global__
void matmul_tiled(const float *A, const float *B, float *C, int n) {
    __shared__ float As[T][T];                          // a tile of A in fast shared memory (shared by the block)
    __shared__ float Bs[T][T];                          // a tile of B in shared memory
    int row = blockIdx.y * T + threadIdx.y;
    int col = blockIdx.x * T + threadIdx.x;
    float sum = 0.0f;
    for (int p = 0; p < n / T; p++) {                   // step through the tiles along the row / column
        As[threadIdx.y][threadIdx.x] = A[row * n + p * T + threadIdx.x];     // each thread loads ONE number of A's tile
        Bs[threadIdx.y][threadIdx.x] = B[(p * T + threadIdx.y) * n + col];   // ...and ONE number of B's tile
        __syncthreads();                                // wait until the whole block has loaded both tiles
        for (int k = 0; k < T; k++)
            sum += As[threadIdx.y][k] * Bs[k][threadIdx.x];   // T multiply-adds, all from shared memory
        __syncthreads();                                // wait before the tiles are overwritten
    }
    C[row * n + col] = sum;
}
'''
if HAVE_CUPY:
    mod = cp.RawModule(code=mm_src)                         # compile both kernels
    naive, tiled = mod.get_function("matmul_naive"), mod.get_function("matmul_tiled")
    for n in [1024, 2048]:                                  # multiples of 16
        A = cp.random.rand(n, n, dtype=cp.float32); B = cp.random.rand(n, n, dtype=cp.float32)
        C = cp.empty((n, n), dtype=cp.float32)              # space for the answer
        grid, block = (n // 16, n // 16), (16, 16)          # one thread per output cell, 16 × 16 per block
        flops = 2 * n**3
        t_naive = cuda_time_ms(lambda: naive(grid, block, (A, B, C, cp.int32(n))), repeats=3)
        ok_naive = bool(cp.allclose(C, A @ B, rtol=1e-3, atol=1e-2))   # check the answer (allowing rounding)
        t_tiled = cuda_time_ms(lambda: tiled(grid, block, (A, B, C, cp.int32(n))), repeats=3)
        ok_tiled = bool(cp.allclose(C, A @ B, rtol=1e-3, atol=1e-2))
        At, Bt = torch.as_tensor(A, device="cuda"), torch.as_tensor(B, device="cuda")   # same data as PyTorch tensors
        t_cublas = timeit(lambda: At @ Bt) * 1e3            # PyTorch's @ calls cuBLAS (× 1e3 → ms)
        Ah, Bh = At.half(), Bt.half()                       # .half() = convert to FP16
        t_fp16 = timeit(lambda: Ah @ Bh) * 1e3              # FP16 multiply uses the Tensor Cores
        print(f"n = {n}")
        # one line per contestant: time, speed in TFLOPS, and whether the answer was right
        for name, t, ok in [("naive kernel", t_naive, ok_naive), ("tiled kernel", t_tiled, ok_tiled), ("cuBLAS FP32", t_cublas, True), ("cuBLAS FP16 (Tensor Cores)", t_fp16, True)]:
            print(f"   {name:27s} {t:8.2f} ms  {flops / (t / 1e3) / 1e12:6.2f} TFLOPS   correct={ok}")
else:
    print("Needs a GPU with CuPy: skipped.")
"""),
md("""
### ✏️ YOUR TURN (A)
1. How many times faster was the tiled kernel than the naive one? Which idea from the lesson explains it?
2. Change `#define T 16` to `8` (and the block/grid to 8 × 8 and `n // 8`). Faster or slower? Why?

*Your answers:*
"""),

# ── Part B ──
md("""
---
## Part B · Precision  *(Unit 5.2)*

**Speed and error.** Multiply in FP32 and FP16, and compare both with an FP64 (very precise) reference.
"""),
code("""
n = 2048
# FP64 = 64-bit numbers, very precise: our "true" answer to compare against
A = torch.rand(n, n, device=device, dtype=torch.float64); B = torch.rand(n, n, device=device, dtype=torch.float64)
ref = A @ B
for dtype in [torch.float32, torch.float16]:
    if device == "cpu" and dtype == torch.float16:
        print("(FP16 matmul skipped on CPU)"); continue
    a, b = A.to(dtype), B.to(dtype)                   # the same matrices, rounded to this format
    t = timeit(lambda: a @ b, repeats=10)
    # error = the biggest difference from the true answer, relative to the size of the answer
    err = ((a @ b).double() - ref).abs().max() / ref.abs().max()
    print(f"{str(dtype):14s}: {t*1e3:7.2f} ms  {2*n**3/t/1e12:6.2f} TFLOPS   max relative error {err:.1e}")
"""),
md("**Range: overflow and underflow.** FP16's largest number is 65,504; BF16 keeps FP32's range."),
code("""
for v in [3.14159265, 70000.0, 2e-8]:                 # a normal number, a big one, a tiny one
    row = [f"{v:>12g}"]                               # start the printed row with the original value
    for dt in [torch.float32, torch.float16, torch.bfloat16]:
        # store v in this format, read it back, and see what survived
        row.append(f"{dt}: {torch.tensor(v, dtype=dt).item():.6g}")
    print("   ".join(row))
print("\\nNote: 70000 → inf in FP16 (overflow); 2e-8 → 0 in FP16 (underflow); BF16 keeps both, with fewer digits.")
"""),
md("""
**Mixed-precision training.** The same wide network on MNIST, one epoch with FP32 and one with `autocast` + `GradScaler`. To measure the GPU work itself, the data is kept on the GPU.
"""),
code("""
from torch import nn
from torchvision import datasets
mnist = datasets.MNIST("data", train=True, download=True)          # the handwritten digits from Lab 0
mnist_test = datasets.MNIST("data", train=False, download=True)
# .data = all images as one tensor; ÷ 255 → pixels 0..1; .view(-1, 784) → one row of 784 per image; .to(device) → onto the GPU
Xtr = (mnist.data.float() / 255).view(-1, 784).to(device);      Ytr = mnist.targets.to(device)   # .targets = the labels
Xte = (mnist_test.data.float() / 255).view(-1, 784).to(device); Yte = mnist_test.targets.to(device)

def wide_net():
    # a wide network (2,048 neurons per layer) so the GPU has plenty of work
    torch.manual_seed(0)
    return nn.Sequential(nn.Linear(784, 2048), nn.ReLU(), nn.Linear(2048, 2048), nn.ReLU(), nn.Linear(2048, 10)).to(device)

def accuracy(model, X, Y):
    # fraction of images whose highest score is the correct digit
    with torch.no_grad():
        return (model(X).argmax(1) == Y).float().mean().item()

def train_epoch(model, X, Y, batch=256, amp=False, lr=0.1):
    # one epoch of training; amp=True turns on mixed precision
    opt = torch.optim.SGD(model.parameters(), lr=lr, momentum=0.9)
    scaler = torch.amp.GradScaler("cuda", enabled=amp and device == "cuda")   # loss scaling (does nothing if disabled)
    lossf = nn.CrossEntropyLoss()
    for idx in torch.randperm(len(X), device=device).split(batch):   # shuffle the image numbers, cut into batches
        # autocast: inside this block, big multiplies run in FP16 automatically
        with torch.autocast(device_type="cuda", dtype=torch.float16, enabled=amp and device == "cuda"):
            loss = lossf(model(X[idx]), Y[idx])
        opt.zero_grad(set_to_none=True)
        # scale the loss up before backward (so tiny gradients don't underflow), then step and adjust the scale
        scaler.scale(loss).backward(); scaler.step(opt); scaler.update()

for amp in [False, True]:                                       # first plain FP32, then mixed precision
    model = wide_net()
    sync(); t0 = time.perf_counter(); train_epoch(model, Xtr, Ytr, amp=amp); sync()   # time one epoch
    print(f"{'mixed precision' if amp else 'FP32           '}: {time.perf_counter()-t0:6.2f} s per epoch, test accuracy {accuracy(model, Xte, Yte):.2%}")
"""),
md("""
### ✏️ YOUR TURN (B)
1. How much faster was FP16 for the matrix multiply? How big was its error?
2. Did mixed precision change the accuracy? Explain using Unit 5.2's 'Does AI notice?'.

*Your answers:*
"""),

# ── Part C ──
md("""
---
## Part C · Your Own Roofline  *(Unit 5.3)*

Measure each operation's FLOPs, bytes and time; compute intensity and achieved FLOPS; plot them under the T4's roofline (8.1 TFLOPS FP32, 320 GB/s).
"""),
code("""
PEAK, BW = 8.1e12, 320e9            # T4: 8.1 TFLOPS FP32, 320 GB/s
results = []                         # (name, intensity, achieved FLOPS) for each operation, for the plot

def record(name, fn, flops, nbytes):
    # time one operation, and store its intensity (FLOPs per byte) and achieved speed
    t = timeit(fn, repeats=10)
    results.append((name, flops / nbytes, flops / t))
    print(f"{name:22s} intensity {flops/nbytes:8.2f} FLOPs/B   achieved {flops/t/1e9:9.1f} GFLOPS   ({nbytes/t/1e9:6.1f} GB/s)")

n = 50_000_000
a = torch.rand(n, device=device); b = torch.rand(n, device=device)
record("vector add", lambda: a + b, n, 12 * n)             # n adds; read a and b, write the result: 3 × 4 bytes each
record("ReLU", lambda: torch.relu(a), n, 8 * n)            # n compares; read + write: 2 × 4 bytes each
W = torch.rand(4096, 4096, device=device); x1 = torch.rand(1, 4096, device=device)
# one input through a 4096 × 4096 layer: 2·4096² FLOPs, but must read all 4096² weights
record("layer, batch 1", lambda: x1 @ W, 2 * 4096 * 4096, 4 * (4096 * 4096 + 2 * 4096))
for m in [256, 1024, 4096]:
    A = torch.rand(m, m, device=device); B = torch.rand(m, m, device=device)
    record(f"matmul {m}", lambda: A @ B, 2 * m**3, 12 * m * m)   # 2m³ FLOPs; 3 matrices × m² × 4 bytes
"""),
code("""
I = np.logspace(-2, 4, 200)                        # 200 intensities from 0.01 to 10,000, evenly spaced on a log scale
plt.figure(figsize=(7, 4.5))
# the roofline itself: speed = the smaller of peak and bandwidth × intensity (black line, width 2)
plt.loglog(I, np.minimum(PEAK, BW * I), "k-", lw=2, label="T4 roofline (FP32)")
for name, inten, perf in results:
    plt.loglog(inten, perf, "o", ms=8)             # one dot per measured operation (ms = marker size)
    plt.annotate(name, (inten, perf), textcoords="offset points", xytext=(6, -10), fontsize=8)   # its name beside it
plt.axvline(PEAK / BW, ls=":", c="gray")           # dotted vertical line at the ridge point
plt.text(PEAK / BW * 1.1, 1e9, f"ridge ≈ {PEAK/BW:.0f}", fontsize=8)
plt.xlabel("arithmetic intensity (FLOPs per byte)"); plt.ylabel("achieved FLOPS")
plt.grid(alpha=0.3, which="both"); plt.legend()
plt.title("Your measurements under the T4 roofline"); plt.show()
"""),
md("""
### ✏️ YOUR TURN (C)
1. Which operations sat close to the slanted (memory) roof, and which near the flat (compute) roof?
2. Use your 'layer, batch 1' result to estimate tokens per second for a 1-billion-parameter FP16 chatbot on the T4.

*Your answers:*
"""),

# ── Part D ──
md("""
---
## Part D · Batch Size and Training on the GPU  *(Unit 5.4)*

**CPU vs GPU** for the wide network: time 100 training steps on each.
"""),
code("""
def steps_time(dev, steps=100, batch=256):
    # time "steps" training steps of the wide network on device dev, with one fixed batch of fake data
    torch.manual_seed(0)
    net = nn.Sequential(nn.Linear(784, 2048), nn.ReLU(), nn.Linear(2048, 2048), nn.ReLU(), nn.Linear(2048, 10)).to(dev)
    opt = torch.optim.SGD(net.parameters(), lr=0.05); lossf = nn.CrossEntropyLoss()
    X = torch.rand(batch, 784, device=dev); Y = torch.randint(0, 10, (batch,), device=dev)
    def run():
        for _ in range(steps):
            loss = lossf(net(X), Y); opt.zero_grad(); loss.backward(); opt.step()   # one full training step
    run()                                                  # warm-up
    if dev == "cuda": torch.cuda.synchronize()             # wait for the GPU before starting the clock
    t0 = time.perf_counter(); run()
    if dev == "cuda": torch.cuda.synchronize()             # ...and before stopping it
    return time.perf_counter() - t0

t_cpu = steps_time("cpu", steps=20) * 5                    # 20 steps, scaled to 100 (the CPU is slow!)
t_gpu = steps_time(device)
print(f"CPU: {t_cpu:6.2f} s per 100 steps\\nGPU: {t_gpu:6.2f} s per 100 steps   → {t_cpu / t_gpu:.1f}× faster")
"""),
md("**Batch-size sweep:** throughput (images per second) and peak GPU memory."),
code("""
batches, tput, mem = [16, 64, 256, 1024, 4096], [], []   # batch sizes to try; results go in tput and mem
for B in batches:
    if device == "cuda":
        # free cached memory and reset the "highest memory used" counter, so each batch size is measured fresh
        torch.cuda.empty_cache(); torch.cuda.reset_peak_memory_stats()
    t = steps_time(device, steps=30, batch=B)
    tput.append(30 * B / t)                                  # throughput = images processed ÷ seconds
    # the most GPU memory used during those steps, in GB (nan = "not a number", when there's no GPU)
    mem.append(torch.cuda.max_memory_allocated() / 1e9 if device == "cuda" else float("nan"))
    print(f"batch {B:5d}: {tput[-1]:10,.0f} images/s   peak memory {mem[-1]:.2f} GB")

fig, ax = plt.subplots(1, 2, figsize=(10, 3.5))              # two charts side by side: ax[0] and ax[1]
ax[0].semilogx(batches, tput, "o-"); ax[0].set_xlabel("batch size"); ax[0].set_ylabel("images / s"); ax[0].set_title("Throughput rises, then levels off"); ax[0].grid(alpha=0.3)
ax[1].semilogx(batches, mem, "s-", c="tab:red"); ax[1].set_xlabel("batch size"); ax[1].set_ylabel("GB"); ax[1].set_title("Memory keeps climbing"); ax[1].grid(alpha=0.3)
plt.tight_layout(); plt.show()
"""),
md("""
### ✏️ YOUR TURN (D)
1. How much faster was the GPU for the wide network? Compare with the small Lab 0 network (Unit 5.4 explains the difference).
2. Where did throughput level off? Which batch size would you choose, and why?

*Your answers:*
"""),

# ── Part E ──
md("""
---
## Part E · The Speed-Up Ladder  *(Unit 5.5)*

**What is Fashion-MNIST?** A harder twin of MNIST, released by the online shop Zalando in 2017. Same format — 70,000 grey 28 × 28 pictures (60,000 training + 10,000 test), 10 classes — but the pictures are **clothing** instead of digits: T-shirt/top, trouser, pullover, dress, coat, sandal, shirt, sneaker, bag, ankle boot. Because it looks exactly like MNIST to the code, you can swap one for the other in a single line; but telling a shirt from a pullover is harder than telling a 1 from a 7, so accuracy is lower (about 82–88% for a simple network instead of 97%).

Network 784 → 1024 → 1024 → 10. Each rung adds ONE change. We time one epoch and check test accuracy at every rung.
"""),
code("""
from torchvision import transforms
from torch.utils.data import DataLoader
# Fashion-MNIST: for the DataLoader rungs (as tensors), and the test set for checking accuracy
fash = datasets.FashionMNIST("data", train=True, download=True, transform=transforms.ToTensor())
fash_test = datasets.FashionMNIST("data", train=False, download=True)
# whole datasets as single tensors on the GPU (pixels 0..1, one row of 784 per image) — used by rung 5 and for testing
FXte = (fash_test.data.float() / 255).view(-1, 784).to(device); FYte = fash_test.targets.to(device)
FX = (fash.data.float() / 255).view(-1, 784).to(device);         FY = fash.targets.to(device)

# Show a few pictures so you know what the network is learning
names = ["T-shirt", "trouser", "pullover", "dress", "coat", "sandal", "shirt", "sneaker", "bag", "boot"]
plt.figure(figsize=(10, 1.6))
for i in range(10):
    plt.subplot(1, 10, i + 1)                                    # 1 row, 10 boxes
    plt.imshow(fash_test.data[i], cmap="gray")                   # test picture i
    plt.title(names[fash_test.targets[i]], fontsize=8)           # its label, as a word
    plt.axis("off")
plt.show()

RUNGS = ["0 baseline: batch 32, .item() every step",
         "1 + no per-step sync",
         "2 + num_workers=2, pin_memory, non_blocking",
         "3 + batch 256 (lr scaled up)",
         "4 + mixed precision",
         "5 + whole dataset on the GPU"]

def ladder(rung):
    # train one epoch with every improvement up to and including this rung switched on
    torch.manual_seed(0)
    model = nn.Sequential(nn.Flatten(), nn.Linear(784, 1024), nn.ReLU(), nn.Linear(1024, 1024), nn.ReLU(), nn.Linear(1024, 10)).to(device)
    B = 256 if rung >= 3 else 32                                  # rung 3+: bigger batch
    opt = torch.optim.SGD(model.parameters(), lr=0.2 if rung >= 3 else 0.05, momentum=0.9)   # ...with a bigger learning rate
    amp = rung >= 4 and device == "cuda"                          # rung 4+: mixed precision
    scaler = torch.amp.GradScaler("cuda", enabled=amp); lossf = nn.CrossEntropyLoss()
    if rung >= 5:
        # rung 5: the data is already on the GPU — just shuffle and slice it, no DataLoader, no copies
        batches = ((FX[i], FY[i]) for i in torch.randperm(len(FX), device=device).split(B))
    else:
        workers = 2 if rung >= 2 else 0                           # rung 2+: background workers + pinned memory
        batches = DataLoader(fash, batch_size=B, shuffle=True, num_workers=workers, pin_memory=(rung >= 2 and device == "cuda"))
    log, running = [], torch.zeros((), device=device)
    sync(); t0 = time.perf_counter()                              # start timing the epoch
    for x, y in batches:
        x = x.to(device, non_blocking=True); y = y.to(device, non_blocking=True)   # (does nothing if already on the GPU)
        with torch.autocast(device_type="cuda", dtype=torch.float16, enabled=amp):
            loss = lossf(model(x), y)
        opt.zero_grad(set_to_none=True)
        scaler.scale(loss).backward(); scaler.step(opt); scaler.update()
        if rung == 0:
            log.append(loss.item())                      # sync every step
        else:
            running += loss.detach()                     # rung 1+: keep the total on the GPU, no sync
    sync(); seconds = time.perf_counter() - t0
    return seconds, accuracy(model, FXte, FYte)          # time for the epoch, and test accuracy

base = None
for r, name in enumerate(RUNGS):                         # climb the ladder, rung 0 to 5
    s, acc = ladder(r)
    base = base or s                                     # remember rung 0's time as the baseline
    print(f"{name:46s} {s:6.2f} s   {base / s:5.1f}× faster   test accuracy {acc:.1%}")
"""),
md("""
### ✏️ YOUR TURN (E) — record your results
| Rung | Seconds per epoch | Speed-up | Test accuracy |
|---|---|---|---|
| 0 baseline | | 1.0× | |
| 1 no sync | | | |
| 2 workers + pinned | | | |
| 3 batch 256 | | | |
| 4 mixed precision | | | |
| 5 data on GPU | | | |

1. Which single rung gave the biggest jump? Explain why with a unit you studied.
2. Did any rung change the accuracy noticeably? (After just one epoch, a wobble of 2–4% between runs is normal noise from different shuffles. Re-run a rung to check.)
3. Did you reach the 5× target?

*Your answers:*

---
## 🎓 Wrap-up
- Tiling reuses data from shared memory; libraries like cuBLAS go further.
- FP16/BF16/INT8 halve or quarter the bytes and unlock Tensor Cores, and AI barely notices.
- The roofline tells you whether memory or compute is the limit, and which fix will work.
- Batch size, feeding the GPU and mixed precision together turn a slow run into a fast one.
- **Next — Lab 5B (second half of Module 5): GPUs in Real AI Projects.** The software stack, sizing memory, out-of-memory errors, and many GPUs.
"""),
]

build("Lab5A_Why_GPUs_Make_AI_Fast.ipynb", "Lab 5A", cells, gpu=True)
