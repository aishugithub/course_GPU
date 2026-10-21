from common import md, code, how_to_run, build, FOOTHOLD, GPU_SETUP, CUPY_SETUP

cells = [
md(f"""
# 🤝 Lab 4 — CPU–GPU Teamwork
**Foothold · GPU Computing for AI · Module 4**

How does the CPU hand work to the GPU? Today you do every step yourself: move data, allocate, copy, **write and launch your own kernels**, handle asynchronous launches, and finally profile and fix a slow training loop.

| Part | What you do | Goes with Foothold unit |
|---|---|---|
| A | Where tensors live; measure PCIe, pinned vs normal memory | 4.1 Host & Device on PCIe |
| B | The five steps, one line at a time, timed | 4.2 The Five Steps of Offloading |
| C | Write ReLU and image kernels; block sizes; the `if (i < n)` check | 4.3 Kernels, Grids, Blocks, Threads |
| D | Asynchronous launches, honest timing, the cost of `.item()` | 4.4 Async Launch & Synchronization |
| E | Profile and fix a slow training loop | 4.C Capstone |

⏱️ About 2 hours (Parts A–C in one session, D–E in the next). 📘 Textbook: Kirk & Hwu Ch 2–3 · Hamacher §12.2.1, Ch 7 (PCIe), Ch 3 (interrupts). Course site: {FOOTHOLD}
"""),
how_to_run(gpu=True),
md("## 0 · Setup — run both cells"),
GPU_SETUP,
CUPY_SETUP,

# ── Part A ──
md("""
---
## Part A · Host and Device  *(Unit 4.1)*

Every tensor lives on one device. The GPU can only compute on tensors in its own memory.
"""),
code("""
x_cpu = torch.rand(3)                      # 3 random numbers in CPU (host) memory — the default
x_gpu = torch.rand(3, device=device)       # 3 random numbers made directly in GPU (device) memory
print("x_cpu lives on:", x_cpu.device)     # .device tells you where a tensor lives
print("x_gpu lives on:", x_gpu.device)

try:                                       # try it; if it fails, run the "except" part instead of crashing
    y = x_cpu + x_gpu                      # mixing devices
except RuntimeError as e:                  # e = the error message PyTorch gave
    print("\\n❌ RuntimeError:", str(e).splitlines()[0])   # print its first line

y = x_cpu.to(device) + x_gpu               # the fix: move first
print("✅ after moving:", y.device)
"""),
md("""
**How fast is PCIe?** Copy tensors of growing size from host to device. Then repeat with **pinned** (page-locked) host memory, which the GPU's DMA engine can read directly.
"""),
code("""
sizes_mb = [1, 10, 100, 500]                      # copy sizes in megabytes
print(f"{'size':>8s} {'normal':>12s} {'pinned':>12s}")   # table heading
for mb in sizes_mb:
    n = mb * 1024 * 1024 // 4                     # how many 4-byte floats make this many MB
    normal = torch.rand(n)                        # ordinary host memory
    pinned = normal.pin_memory() if device == "cuda" else normal   # a pinned (page-locked) copy
    t_n = timeit(lambda: normal.to(device), repeats=3)   # time host → device copy from normal memory
    t_p = timeit(lambda: pinned.to(device), repeats=3)   # ...and from pinned memory
    # speed = GB ÷ seconds (MB ÷ 1024 = GB)
    print(f"{mb:6d} MB {mb / 1024 / t_n:9.2f} GB/s {mb / 1024 / t_p:9.2f} GB/s")
print("\\nT4 is on PCIe Gen 3 x16: ≈ 16 GB/s theoretical, ≈ 12 GB/s in practice.")
"""),
md("""
### ✏️ YOUR TURN (A)
1. What PCIe speed did you measure? How does it compare with the GPU's own memory (≈ 320 GB/s, measured in Lab 3)?
2. Why are small copies (1 MB) so much slower per byte than big ones?

*Your answers:*
"""),

# ── Part B ──
md("""
---
## Part B · The Five Steps, One at a Time  *(Unit 4.2)*

ReLU on 100 MB of data, with every step as its own line and its own timer. `sync()` makes each timer honest.
"""),
code("""
n = 25_000_000                                         # 100 MB of float32
a_cpu = torch.randn(n)                                # the input data, in host memory
steps = {}                                            # step name → time taken

# Pattern on each line below: do one step, sync() so the GPU really finishes, record the time, restart the clock
sync(); t = time.perf_counter()
b_gpu = torch.empty(n, device=device)                 # 1 · allocate
sync(); steps["1 allocate"] = time.perf_counter() - t; t = time.perf_counter()
a_gpu = a_cpu.to(device)                              # 2 · copy in
sync(); steps["2 copy in"] = time.perf_counter() - t; t = time.perf_counter()
torch.clamp(a_gpu, min=0, out=b_gpu)                  # 3 · launch the kernel (ReLU)
sync(); steps["3 kernel"] = time.perf_counter() - t; t = time.perf_counter()
b_cpu = b_gpu.cpu()                                   # 4 · copy out
sync(); steps["4 copy out"] = time.perf_counter() - t; t = time.perf_counter()
del a_gpu, b_gpu                                      # 5 · free
sync(); steps["5 free"] = time.perf_counter() - t

total = sum(steps.values())                           # time for all five steps together
for k, v in steps.items():
    # a text bar chart: each step gets a bar of up to 40 blocks, in proportion to its share of the time
    print(f"{k:11s} {v*1e3:8.2f} ms  {'█' * int(40 * v / total)}")
print("Correct result:", torch.equal(b_cpu, torch.relu(a_cpu)))   # compare with ReLU done on the CPU
"""),
md("""
The same five steps in **CuPy**. Notice how closely it mirrors the CUDA C version from the lesson (`cudaMalloc`, `cudaMemcpy`…).
"""),
code("""
if HAVE_CUPY:
    a_host = np.random.randn(n).astype(np.float32)      # input in host memory ("d_" below = on the device)
    d_b = cp.empty(n, dtype=cp.float32)               # 1 allocate   (cudaMalloc)
    d_a = cp.asarray(a_host)                            # 2 copy in    (cudaMemcpy HostToDevice)
    cp.maximum(d_a, 0, out=d_b)                         # 3 launch a kernel
    b_host = cp.asnumpy(d_b)                            # 4 copy out   (cudaMemcpy DeviceToHost)
    del d_a, d_b                                        # 5 free       (cudaFree, via CuPy's memory pool)
    print("CuPy result correct:", np.allclose(b_host, np.maximum(a_host, 0)))
else:
    print("Needs a GPU with CuPy: skipped.")
"""),
md("""
### ✏️ YOUR TURN (B)
1. Which steps took the most time? What percentage was the actual computing (step 3)?
2. Change the code to run `torch.relu` **50 times** on `a_gpu` before copying out. What happens to the computing share?

*Your answers:*
"""),

# ── Part C ──
md("""
---
## Part C · Write Your Own Kernels  *(Unit 4.3)*

Here's the ReLU kernel from the lesson, in CUDA C, compiled by CuPy. Each thread computes its global index `i` and handles one element.
"""),
code("""
# The kernel in CUDA C (inside the C code, comments start with //)
relu_src = r'''
extern "C" __global__                           // a kernel: runs on the GPU, one copy per thread
void relu(const float *x, float *y, int n) {    // x = input array, y = output array, n = how many elements
    int i = blockIdx.x * blockDim.x + threadIdx.x;   // this thread's global index
    if (i < n)                                  // the safety check
        y[i] = fmaxf(x[i], 0.0f);               // ReLU: the larger of x[i] and 0
}
'''
if HAVE_CUPY:
    relu_k = cp.RawKernel(relu_src, "relu")              # CuPy compiles the C code into a GPU kernel
    n = 10_000_003                                       # deliberately NOT a multiple of any block size
    d_x = cp.random.randn(n, dtype=cp.float32); d_y = cp.empty_like(d_x)   # input and output in GPU memory
    for threads in [32, 100, 256, 1024]:                 # try four block sizes
        blocks = (n + threads - 1) // threads            # round UP, so every element gets a thread
        # launch: kernel((blocks,), (threads per block,), (arguments)); cp.int32(n) passes n as a C int
        ms = cuda_time_ms(lambda: relu_k((blocks,), (threads,), (d_x, d_y, cp.int32(n))))
        ok = bool(cp.allclose(d_y, cp.maximum(d_x, 0)))  # check against CuPy's own ReLU
        print(f"block size {threads:5d}: {blocks:7,d} blocks  {ms:6.3f} ms  correct={ok}")
else:
    print("Needs a GPU with CuPy: skipped.")
"""),
md("""
**What if you forget `if (i < n)`?** Writing past the end of a real array can crash the whole Colab session, so we do it safely: the output array gets 1,024 extra 'sentinel' slots set to −1, and we look at whether the kernel scribbled over them.
"""),
code("""
unsafe_src = r'''
extern "C" __global__
void relu_unsafe(const float *x, float *y, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    y[i] = fmaxf(x[i % n], 0.0f);               // NO check on y! (x[i % n] keeps the READ safe, so nothing crashes)
}
'''
if HAVE_CUPY:
    unsafe_k = cp.RawKernel(unsafe_src, "relu_unsafe")
    n, threads = 1000, 256
    blocks = (n + threads - 1) // threads               # 4 blocks = 1,024 threads for 1,000 elements
    d_x = cp.random.rand(n, dtype=cp.float32) + 1        # all positive
    d_y = cp.full(n + 1024, -1.0, dtype=cp.float32)      # 1,024 sentinel slots after the real data
    unsafe_k((blocks,), (threads,), (d_x, d_y, cp.int32(n)))   # launch without the safety check
    damaged = int((d_y[n:] != -1).sum())                 # d_y[n:] = the sentinel slots; count those no longer −1
    print(f"{blocks * threads} threads for {n} elements → {damaged} slots past the end were overwritten!")
else:
    print("Needs a GPU with CuPy: skipped.")
"""),
md("""
**A 2-D kernel:** brighten an image, one thread per pixel, with 16 × 16 blocks.
"""),
code("""
bright_src = r'''
extern "C" __global__
void brighten(float *img, int width, int height, float amount) {
    int col = blockIdx.x * blockDim.x + threadIdx.x;    // this thread's column (x direction)
    int row = blockIdx.y * blockDim.y + threadIdx.y;    // this thread's row (y direction)
    if (col < width && row < height)                    // safety check in both directions
        // row-major: pixel (row, col) is at position row × width + col; fminf caps it at 1.0 (white)
        img[row * width + col] = fminf(img[row * width + col] + amount, 1.0f);
}
'''
H, W = 480, 640                                   # image height and width in pixels
yy, xx = np.mgrid[0:H, 0:W]                       # the row and column number of every pixel
image = (0.4 * np.sin(xx / 40) * np.cos(yy / 30) + 0.4).astype(np.float32)   # a synthetic picture (a wavy pattern)

if HAVE_CUPY:
    bright_k = cp.RawKernel(bright_src, "brighten")   # compile the kernel
    d_img = cp.asarray(image)                     # copy the image to the GPU
    block = (16, 16)                              # each block = 16 × 16 = 256 threads
    grid = ((W + 15) // 16, (H + 15) // 16)       # enough blocks across and down to cover the image (rounded up)
    bright_k(grid, block, (d_img, cp.int32(W), cp.int32(H), cp.float32(0.35)))   # launch: add 0.35 to every pixel
    result = cp.asnumpy(d_img)                    # copy the result back to the CPU
    print(f"grid = {grid} blocks of {block} threads = {grid[0] * grid[1] * 256:,} threads for {H * W:,} pixels")
    fig, ax = plt.subplots(1, 2, figsize=(9, 3.2))    # two pictures side by side
    # vmin/vmax fix the grey scale to 0..1, so "before" and "after" are drawn with the same brightness scale
    ax[0].imshow(image, cmap="gray", vmin=0, vmax=1); ax[0].set_title("before"); ax[0].axis("off")
    ax[1].imshow(result, cmap="gray", vmin=0, vmax=1); ax[1].set_title("after: brightened on the GPU"); ax[1].axis("off")
    plt.show()
else:
    print("Needs a GPU with CuPy: skipped.")
"""),
md("""
### ✏️ YOUR TURN (C)
1. Which block size was slowest? Explain using warps and the 16-blocks-per-SM limit.
2. How many slots were overwritten without the check? Show the arithmetic: 4 × 256 − 1,000 = ?
3. Change the brighten kernel to make the image **darker**. Which single line did you change?

*Your answers:*
"""),

# ── Part D ──
md("""
---
## Part D · Asynchronous Launches  *(Unit 4.4)*

First, see the "impossible" timing for yourself.
"""),
code("""
a = torch.rand(4096, 4096, device=device); b = torch.rand(4096, 4096, device=device)   # two big matrices on the GPU
a @ b; sync()                                            # warm-up

# WRONG: stop the clock as soon as Python returns — but the GPU has only been GIVEN the order
t0 = time.perf_counter(); c = a @ b; t_wrong = time.perf_counter() - t0
sync()                                                   # let that multiply finish before the next test
# RIGHT: wait for the GPU to finish (sync) before stopping the clock
t0 = time.perf_counter(); c = a @ b; sync(); t_right = time.perf_counter() - t0

flops = 2 * 4096**3                                      # work in one 4096 × 4096 multiply
print(f"WITHOUT sync: {t_wrong*1e3:8.3f} ms  → 'would be' {flops / t_wrong / 1e12:8.1f} TFLOPS  (impossible on a GPU)")
print(f"WITH sync   : {t_right*1e3:8.3f} ms  → {flops / t_right / 1e12:8.1f} TFLOPS  (real)")
"""),
md("""
Now the cost of a **sync point every step**: train a small network for 300 steps, calling `loss.item()` every step vs only at the end.
"""),
code("""
# a small network on the GPU, and one fixed batch of fake data (64 inputs of 1,024 numbers, 64 labels)
net = torch.nn.Sequential(torch.nn.Linear(1024, 1024), torch.nn.ReLU(), torch.nn.Linear(1024, 10)).to(device)
opt = torch.optim.SGD(net.parameters(), lr=0.01)
X = torch.randn(64, 1024, device=device); Y = torch.randint(0, 10, (64,), device=device)
lossf = torch.nn.CrossEntropyLoss()

def train(steps, item_every_step):
    total = torch.zeros((), device=device); log = []   # a running total that lives on the GPU
    for _ in range(steps):
        loss = lossf(net(X), Y)                          # forward pass + loss
        opt.zero_grad(); loss.backward(); opt.step()     # gradients + update
        if item_every_step:
            log.append(loss.item())                  # sync every step
        else:
            total += loss.detach()                   # stays on the GPU
    return total.item()                              # one sync at the end

for flag in [True, False]:                           # first with .item() every step, then without
    t = timeit(lambda: train(300, flag), repeats=2)
    print(f"item() every step = {flag!s:5s}: {t*1e3:7.1f} ms for 300 steps")
"""),
md("""
### ✏️ YOUR TURN (D)
1. How many times "faster than peak" was the unsynchronised timing? What was really being measured?
2. How much slower was calling `.item()` every step? (The gap grows when the CPU has other work to overlap, as in Part E.)

*Your answers:*
"""),

# ── Part E ──
md("""
---
## Part E · Profile and Fix a Slow Training Loop  *(Unit 4.C)*

The final-year team's loop vs the fixed loop, on MNIST, one epoch each.
"""),
code("""
from torch import nn
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from sklearn.metrics import accuracy_score      # scikit-learn's accuracy function (works on CPU NumPy arrays)

# MNIST handwritten digits (Lab 0), converted to tensors with pixels 0..1
train_data = datasets.MNIST("data", train=True, download=True, transform=transforms.ToTensor())

def make_model():
    torch.manual_seed(0)                        # same starting weights for both loops: a fair race
    return nn.Sequential(nn.Flatten(), nn.Linear(784, 512), nn.ReLU(), nn.Linear(512, 512), nn.ReLU(), nn.Linear(512, 10)).to(device)

def slow_epoch(max_steps=None):
    # the team's original loop (max_steps lets the profiler below run just a few steps)
    model = make_model(); opt = torch.optim.SGD(model.parameters(), lr=0.05); lossf = nn.CrossEntropyLoss()
    loader = DataLoader(train_data, batch_size=16, shuffle=True)                 # small batches; num_workers=0
    history = []
    for step, (images, labels) in enumerate(loader):       # enumerate also gives the step number
        images, labels = images.to(device), labels.to(device)
        scores = model(images); loss = lossf(scores, labels)
        opt.zero_grad(); loss.backward(); opt.step()
        acc = accuracy_score(labels.cpu().numpy(), scores.argmax(1).cpu().numpy())   # copy out + sync
        history.append((loss.item(), acc))                                          # sync
        if max_steps and step + 1 >= max_steps: break      # stop early if asked
    # averages over the epoch: mean loss, mean accuracy
    return float(np.mean([h[0] for h in history])), float(np.mean([h[1] for h in history]))

def fast_epoch(max_steps=None):
    # the fixed loop: same model and data, better habits
    model = make_model(); opt = torch.optim.SGD(model.parameters(), lr=0.3); lossf = nn.CrossEntropyLoss()   # bigger batch → bigger learning rate
    # big batches; 2 worker processes prepare batches in parallel; pinned memory for faster copies
    loader = DataLoader(train_data, batch_size=256, shuffle=True, num_workers=2, pin_memory=(device == "cuda"))
    running = torch.zeros((), device=device); correct = torch.zeros((), device=device)   # totals kept ON the GPU
    for step, (images, labels) in enumerate(loader):
        # non_blocking=True: start the copy and carry on, without waiting for it
        images = images.to(device, non_blocking=True); labels = labels.to(device, non_blocking=True)
        scores = model(images); loss = lossf(scores, labels)
        opt.zero_grad(set_to_none=True); loss.backward(); opt.step()
        running += loss.detach(); correct += (scores.argmax(1) == labels).sum()   # no .item(): no sync
        if max_steps and step + 1 >= max_steps: break
    seen = min((step + 1) * 256, len(train_data))          # how many images we went through
    return running.item() / (step + 1), correct.item() / seen   # ONE sync, at the very end

for name, fn in [("SLOW (team's loop)", slow_epoch), ("FAST (fixed loop)", fast_epoch)]:
    sync(); t0 = time.perf_counter(); out = fn(); sync()  # time one full epoch of each
    print(f"{name:20s}: {time.perf_counter() - t0:6.1f} s per epoch   (epoch-average loss {out[0]:.3f}, accuracy {out[1]:.1%})")
"""),
md("""
**Fair comparison note:** after one epoch the fast loop's accuracy may be a little lower. Batch 256 makes only **235 weight updates per epoch** compared with **3,750** for batch 16 (Unit 1.2: epochs, batches, iterations). Train the fast loop for 2–3 epochs and it catches up, still in less total time. Faster per epoch is only useful if the model still learns well, so always check both.
"""),
md("""
**The professional tool: the PyTorch profiler.** Profile 30 steps of each loop and compare the top entries. Look for `aten::copy_`/`Memcpy` (copies) and `cudaStreamSynchronize` / `aten::item` (the CPU waiting).
"""),
code("""
from torch.profiler import profile, ProfilerActivity     # PyTorch's built-in profiler
# record what the CPU does, and also the GPU if we have one
acts = [ProfilerActivity.CPU] + ([ProfilerActivity.CUDA] if device == "cuda" else [])
for name, fn in [("SLOW", slow_epoch), ("FAST", fast_epoch)]:
    with profile(activities=acts) as prof:               # everything inside this block is recorded
        fn(max_steps=30)                                 # just 30 steps of the loop
    print(f"\\n========== {name} loop, 30 steps ==========")
    # a table of the operations that took the most CPU time, top 8 only
    print(prof.key_averages().table(sort_by="self_cpu_time_total", row_limit=8))
"""),
md("""
### ✏️ YOUR TURN (E) — record your results
| | Slow loop | Fast loop |
|---|---|---|
| Seconds per epoch | | |
| Batch size | 16 | 256 |
| Sync points per step | | |

1. What speed-up did the fixes give?
2. In the profiler tables, name one entry that's big in the SLOW loop but small in the FAST loop, and explain it using a Module 4 idea.
3. Run `!nvidia-smi` in a new cell **while** the slow loop runs (start it, then quickly run the other cell). What GPU-Util % do you see?

*Your answers:*

---
## 🎓 Wrap-up
- Host and device have separate memories joined by a narrow PCIe link: copy once, compute many times.
- Every GPU job: allocate → copy in → launch → copy out → free.
- Kernels: each thread finds its element with `blockIdx × blockDim + threadIdx`, guarded by `if (i < n)`.
- Launches are asynchronous: sync only when you need a value, and overlap CPU work with GPU work.
- **Next — Module 5: Why GPUs Make AI Fast.** Tiling, Tensor Cores, low precision, and the roofline.
"""),
]

build("Lab4_CPU_GPU_Teamwork.ipynb", "Lab 4", cells, gpu=True)
