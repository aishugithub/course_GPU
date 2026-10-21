from common import md, code, how_to_run, build, FOOTHOLD, GPU_SETUP



cells = [
md(f"""
# ⚔️ Lab 3 — CPU vs GPU
**Foothold · GPU Computing for AI · Module 3**

Today you run code on a real GPU for the first time, and race it against the CPU.

| Part | What you do | Goes with Foothold unit |
|---|---|---|
| A | Meet your GPU | 3.1 Latency vs Throughput |
| B | Read its clock speed and power | 3.2 Why Clocks Stopped Getting Faster |
| C | Vector add: CPU vs GPU, from tiny to huge | 3.3 SIMD → SIMT |
| D | Amdahl's law on a real program | 3.4 Amdahl's Law |
| E | The big race: matrix multiply, and the cost of copying | 3.C Capstone |

⏱️ About 90 minutes. 📘 Textbook: Hamacher §12.2–12.2.1 and §12.7 · H&P §4.4 · Stallings §2.2–2.3. Course site: {FOOTHOLD}
"""),
how_to_run(gpu=True),
md("## 0 · Setup — run this first"),
GPU_SETUP,

# ── Part A ──
md("""
---
## Part A · Meet Your GPU  *(Unit 3.1)*

PyTorch can tell you about the GPU. A **streaming multiprocessor (SM)** is one of the GPU's "mini-processors"; each one holds many simple cores (Unit 4.1).
"""),
code("""
if device == "cuda":
    p = torch.cuda.get_device_properties(0)
    print("Name                       :", p.name)
    print("Memory                     :", round(p.total_memory / 1e9, 1), "GB")
    print("Streaming multiprocessors  :", p.multi_processor_count)
    print("Compute capability         :", f"{p.major}.{p.minor}")
else:
    print("No GPU in this session. Switch the runtime to T4 GPU (see Setup).")
"""),
md("""
`nvidia-smi` is the GPU's "task manager". Run it below. Look for the GPU name, memory used / total, and the power and temperature columns.
"""),
code("""
!nvidia-smi
"""),
md("""
### ✏️ YOUR TURN (A)
A T4 has 40 SMs with 64 CUDA cores each. How many CUDA cores is that? Compare with your laptop's CPU cores (Task Manager → Performance on Windows).

*Your answer:*
"""),

# ── Part B ──
md("""
---
## Part B · Clock Speed and Power  *(Unit 3.2)*

Is each GPU core faster than a CPU core? Ask the hardware.
"""),
code("""
!nvidia-smi --query-gpu=name,clocks.sm,clocks.max.sm,power.draw,power.limit,temperature.gpu --format=csv
"""),
code("""
!lscpu | grep -E "Model name|^CPU\\(s\\)|MHz"
"""),
md("""
### ✏️ YOUR TURN (B)
| | CPU | GPU |
|---|---|---|
| Clock speed (MHz) | | |
| Number of cores | | |
| Power limit (W) | — | |

The GPU's clock is **slower** than the CPU's. So where does its speed come from? (Unit 3.2: many slow cores beat one fast core on throughput and on power.)

*Your answer:*
"""),

# ── Part C ──
md("""
---
## Part C · Vector Add: CPU vs GPU  *(Unit 3.3)*

`C = A + B` for arrays of growing size. On the GPU, every element is handled by its own thread (SIMT).
Here the data is created **directly on the GPU**, so we're timing only the arithmetic.
"""),
code("""
sizes = [10**3, 10**4, 10**5, 10**6, 10**7, 5 * 10**7]
cpu_t, gpu_t = [], []
for n in sizes:
    a_np, b_np = np.random.rand(n).astype(np.float32), np.random.rand(n).astype(np.float32)
    a_gpu, b_gpu = torch.rand(n, device=device), torch.rand(n, device=device)
    cpu_t.append(timeit(lambda: a_np + b_np))
    gpu_t.append(timeit(lambda: a_gpu + b_gpu))
    print(f"n = {n:>11,d}   CPU {cpu_t[-1]*1e3:8.3f} ms   GPU {gpu_t[-1]*1e3:8.3f} ms   → GPU is {cpu_t[-1]/gpu_t[-1]:6.1f}× faster")
"""),
code("""
plt.figure(figsize=(6, 4))
plt.loglog(sizes, cpu_t, "o-", label="CPU (NumPy)")
plt.loglog(sizes, gpu_t, "s-", label=f"GPU ({device})")
plt.xlabel("array size n"); plt.ylabel("time (s)"); plt.legend(); plt.grid(alpha=0.3, which="both")
plt.title("Vector add: small = CPU wins, big = GPU wins"); plt.show()
"""),
md("""
**Why `sync()`?** When Python asks the GPU to do something, it doesn't wait. It just queues the work and carries on (Unit 5.4). Without `torch.cuda.synchronize()` you'd time how long it takes to *queue* the work, not to *do* it. Try deleting the `sync()` calls inside `timeit` (in the Setup cell) and re-running: the GPU will look impossibly fast.

### ✏️ YOUR TURN (C)
At roughly what array size does the GPU start to win? Why does the CPU win for tiny arrays?

*Your answer:*
"""),

# ── Part D ──
md("""
---
## Part D · Amdahl's Law on a Real Program  *(Unit 3.4)*

A fake "training step": a **serial CPU part** (Python preprocessing that no GPU can help with) plus a **matrix multiply** we can move to the GPU.
"""),
code("""
N = 2048
x_cpu = torch.rand(N, N); w_cpu = torch.rand(N, N)
x_dev = x_cpu.to(device);  w_dev = w_cpu.to(device)
labels = list(range(200_000))

def serial_part():                      # e.g. cleaning labels in plain Python
    return sum(v % 7 for v in labels)

t_serial  = timeit(serial_part, repeats=3)
t_mm_cpu  = timeit(lambda: x_cpu @ w_cpu, repeats=3)
t_mm_gpu  = timeit(lambda: x_dev @ w_dev, repeats=3)

total_cpu = t_serial + t_mm_cpu
p = t_mm_cpu / total_cpu               # fraction of time we CAN speed up
s = t_mm_cpu / t_mm_gpu                # how much the GPU speeds that part up
predicted = 1 / ((1 - p) + p / s)
measured  = total_cpu / (t_serial + t_mm_gpu)

print(f"serial part        : {t_serial*1e3:7.1f} ms")
print(f"matmul on CPU      : {t_mm_cpu*1e3:7.1f} ms")
print(f"matmul on GPU      : {t_mm_gpu*1e3:7.1f} ms   (s = {s:.0f}×)")
print(f"parallel fraction p: {p:.2f}")
print(f"Amdahl predicts    : {predicted:.2f}× overall")
print(f"Measured           : {measured:.2f}× overall")
print(f"Ceiling 1/(1-p)    : {1/(1-p):.2f}×  — no GPU can beat this")
"""),
md("""
### ✏️ YOUR TURN (D)
1. Make the serial part 5× bigger (`range(1_000_000)`). What happens to p, the prediction and the ceiling?
2. In one sentence: why can a faster GPU **not** fix a slow data pipeline?

*Your answers:*
"""),

# ── Part E ──
md("""
---
## Part E · The Big Race: Matrix Multiply  *(Unit 3.C)*

The core operation of AI. Two GPU timings:
- **GPU (data already there)**: the matrices already live in GPU memory.
- **GPU + copies**: copy the inputs from CPU to GPU, multiply, copy the result back (what happens if you're careless).
"""),
code("""
sizes = [64, 128, 256, 512, 1024, 2048, 4096]
res = {"CPU": [], "GPU": [], "GPU + copies": []}
for n in sizes:
    A = np.random.rand(n, n).astype(np.float32); B = np.random.rand(n, n).astype(np.float32)
    Ag, Bg = torch.from_numpy(A).to(device), torch.from_numpy(B).to(device)
    res["CPU"].append(timeit(lambda: A @ B, repeats=3))
    res["GPU"].append(timeit(lambda: Ag @ Bg, repeats=3))
    res["GPU + copies"].append(timeit(lambda: (torch.from_numpy(A).to(device) @ torch.from_numpy(B).to(device)).cpu(), repeats=3))
    gflops = 2 * n**3 / res["GPU"][-1] / 1e9
    print(f"n={n:5d}  CPU {res['CPU'][-1]*1e3:9.2f} ms   GPU {res['GPU'][-1]*1e3:8.2f} ms ({gflops:7.0f} GFLOPS)   GPU+copies {res['GPU + copies'][-1]*1e3:8.2f} ms")
"""),
code("""
plt.figure(figsize=(6.5, 4))
for k, m in zip(res, ["o-", "s-", "^--"]):
    plt.loglog(sizes, res[k], m, label=k)
plt.xlabel("matrix size n"); plt.ylabel("time (s)"); plt.grid(alpha=0.3, which="both"); plt.legend()
plt.title("Matrix multiply: CPU vs GPU"); plt.show()
print(f"At n = 4096 the GPU is {res['CPU'][-1] / res['GPU'][-1]:.0f}× faster than the CPU (data already on the GPU).")
"""),
md("""
### Test the capstone's decision tool against reality
"""),
code("""
CPU_FLOPS, CPU_BW = 0.2e12, 20e9
GPU_FLOPS, GPU_BW = 4e12, 300e9
LAUNCH, PCIE = 20e-6, 12e9

def predict(flops, nbytes, data_on_gpu=False):
    cpu = max(flops / CPU_FLOPS, nbytes / CPU_BW)
    gpu = LAUNCH + (0 if data_on_gpu else nbytes / PCIE) + max(flops / GPU_FLOPS, nbytes / GPU_BW)
    return cpu, gpu

n = 4096
pc, pg = predict(2 * n**3, 3 * n * n * 4, data_on_gpu=True)
print(f"4096 matmul  predicted: CPU {pc*1e3:7.1f} ms, GPU {pg*1e3:6.1f} ms")
print(f"             measured : CPU {res['CPU'][-1]*1e3:7.1f} ms, GPU {res['GPU'][-1]*1e3:6.1f} ms")

relu_cpu_data = np.random.randn(50_000_000).astype(np.float32)
relu_gpu_data = torch.from_numpy(relu_cpu_data).to(device)
t_cpu  = timeit(lambda: np.maximum(relu_cpu_data, 0), repeats=3)
t_copy = timeit(lambda: torch.relu(torch.from_numpy(relu_cpu_data).to(device)).cpu(), repeats=3)
t_gpu  = timeit(lambda: torch.relu(relu_gpu_data), repeats=3)
print(f"\\nReLU on 5 crore numbers:  CPU {t_cpu*1e3:6.1f} ms | GPU incl. copies {t_copy*1e3:6.1f} ms | GPU, data already there {t_gpu*1e3:6.2f} ms")
"""),
md("""
### ✏️ YOUR TURN (E) — record your results
| | Your value |
|---|---|
| Crossover size (GPU starts winning) | |
| GPU speed-up at n = 4096 | |
| Best GPU GFLOPS measured | |
| ReLU: CPU vs GPU-incl-copies — which won? | |

1. Was the decision tool's prediction in the right ballpark (within about 3×)?
2. Why is "GPU + copies" so much slower than "GPU"? What habit does this teach?

*Your answers:*

---
## 🎓 Wrap-up
- The GPU's cores are slower, but there are thousands of them: throughput beats latency for big, parallel work.
- Tiny jobs, serial code, and copy-dominated jobs stay on the CPU.
- Amdahl's law: the serial part sets the ceiling.
- **Next — Module 4: Inside a GPU.** SMs, warps, Tensor Cores, and the memory system that feeds them.
"""),
]

build("Lab03_CPU_vs_GPU.ipynb", "Lab 3", cells, gpu=True)
