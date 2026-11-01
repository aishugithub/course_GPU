from common import md, code, how_to_run, build, FOOTHOLD, GPU_SETUP
from bookcells import book

cells = [
md(f"""
# ⚔️ Lab 2B — CPU vs GPU
**Foothold · GPU Computing for AI · Unit 2 (second half) · Book: Step 2, Sections 2.5–2.C**

Today you run code on a real GPU for the first time, and race it against the CPU.

| Part | What you do | Goes with Foothold lesson |
|---|---|---|
| A | Meet your GPU | 2.5 Latency vs Throughput |
| B | Read its clock speed and power | 2.6 Why Clocks Stopped Getting Faster |
| C | Vector add: CPU vs GPU, from tiny to huge | 2.7 SIMD → SIMT |
| D | Amdahl's law on a real program | 2.8 Amdahl's Law |
| E | The big race: matrix multiply, and the cost of copying | 2.C Capstone |

⏱️ About 90 minutes. 📘 Textbook: Hamacher §12.2–12.2.1 and §12.7 · H&P §4.4 · Stallings §2.2–2.3. Course site: {FOOTHOLD}

💬 **Every line of code has a comment** (after the `#`) saying what it does. Read them as you go.
"""),
how_to_run(gpu=True),
md("## 0 · Setup — run this first"),
GPU_SETUP,

# ── Part A ──
md("""
---
## Part A · Meet Your GPU  *(Unit 2.5)*

PyTorch can tell you about the GPU. A **streaming multiprocessor (SM)** is one of the GPU's "mini-processors"; each one holds many simple cores (Unit 3.1).
"""),
book(2, "E_MEET"),
md("""
`nvidia-smi` is the GPU's "task manager". Run it below. Look for the GPU name, memory used / total, and the power and temperature columns.
"""),
code("""
# A "!" at the start runs a system command instead of Python. nvidia-smi = NVIDIA's GPU status tool.
!nvidia-smi
"""),
md("""
### ✏️ YOUR TURN (A)
A T4 has 40 SMs with 64 CUDA cores each. How many CUDA cores is that? Compare with your own computer's CPU cores (Part B shows how many Colab's CPU has).

*Your answer:*
"""),

# ── Part B ──
md("""
---
## Part B · Clock Speed and Power  *(Unit 2.6)*

Is each GPU core faster than a CPU core? Ask the hardware: first the GPU, then the CPU.
"""),
book(2, "E_CLOCK"),
book(2, "E_CPU"),
md("""
### ✏️ YOUR TURN (B)
| | CPU | GPU |
|---|---|---|
| Clock speed (MHz) | (Colab's CPU runs at about 2,000–2,200 MHz) | |
| Number of cores | | |
| Power limit (W) | — | |

The GPU's clock is **slower** than the CPU's. So where does its speed come from? (Unit 2.6: many slow cores beat one fast core on throughput and on power.)

*Your answer:*
"""),

# ── Part C ──
md("""
---
## Part C · Vector Add: CPU vs GPU  *(Unit 2.7)*

`C = A + B` for arrays of growing size. On the GPU, every element is handled by its own thread (SIMT).
Here the data is created **directly on the GPU**, so we're timing only the arithmetic.
"""),
book(2, "E_VEC"),
code("""
plt.figure(figsize=(6, 4))                                   # a new 6 × 4 inch chart
plt.loglog(sizes, cpu_t, "o-", label="CPU (NumPy)")          # log scale on both axes; circles = CPU
plt.loglog(sizes, gpu_t, "s-", label=f"GPU ({device})")      # squares = GPU
plt.xlabel("array size n"); plt.ylabel("time (s)")           # axis labels
plt.legend(); plt.grid(alpha=0.3, which="both")              # colour key and faint grid
plt.title("Vector add: small = CPU wins, big = GPU wins")    # the chart's title
plt.show()                                                   # draw it
"""),
md("""
**Why `sync()`?** When Python asks the GPU to do something, it doesn't wait. It just queues the work and carries on (Unit 4.4). Without `torch.cuda.synchronize()` you'd time how long it takes to *queue* the work, not to *do* it. Try deleting the `sync()` calls inside `timeit` (in the Setup cell) and re-running: the GPU will look impossibly fast.

### ✏️ YOUR TURN (C)
At roughly what array size does the GPU start to win? Why does the CPU win for tiny arrays?

*Your answer:*
"""),

# ── Part D ──
md("""
---
## Part D · Amdahl's Law on a Real Program  *(Unit 2.8)*

A pretend "training step": a **serial CPU part** (Python work that no GPU can help with) plus a **matrix multiply** we can move to the GPU. Amdahl predicts the speed-up from the parts; then we time the real new step and compare.
"""),
book(2, "E_AMDAHL"),
md("""
The prediction and the measurement are rarely exactly equal: timings jitter from run to run, and the GPU can work in the background while the CPU starts its next serial part (Unit 4.4).

### ✏️ YOUR TURN (D)
1. Make the serial part 5× bigger (`range(1_000_000)`). What happens to p, the prediction and the ceiling?
2. In one sentence: why can a faster GPU **not** fix a slow data pipeline?

*Your answers:*
"""),

# ── Part E ──
md("""
---
## Part E · The Big Race: Matrix Multiply  *(Unit 2.C)*

The core operation of AI. Two GPU timings:
- **GPU (data already there)**: the matrices already live in GPU memory.
- **GPU + copies**: copy the inputs from CPU to GPU, multiply, copy the result back (what happens if you're careless).
"""),
book(2, "E_RACE"),
code("""
plt.figure(figsize=(6.5, 4))                         # a new chart
for k, m in zip(res, ["o-", "s-", "^--"]):           # one line per contestant, each with its own marker style
    plt.loglog(sizes, res[k], m, label=k)            # log scale on both axes
plt.xlabel("matrix size n"); plt.ylabel("time (s)")  # axis labels
plt.grid(alpha=0.3, which="both"); plt.legend()      # faint grid and colour key
plt.title("Matrix multiply: CPU vs GPU")             # the chart's title
plt.show()                                           # draw it
"""),
md("""
### Test the capstone's decision tool against reality
"""),
book(2, "E_TOOL"),
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
- **Next — Unit 3: Inside a GPU (Lab 3).** SMs, warps, Tensor Cores, and the memory system that feeds them.
"""),
]

build("Lab2B_CPU_vs_GPU.ipynb", "Lab 2B", cells, gpu=True)
