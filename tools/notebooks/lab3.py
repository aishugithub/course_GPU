from common import md, code, how_to_run, build, FOOTHOLD, GPU_SETUP, CUPY_SETUP
from bookcells import book

cells = [
md(f"""
# 🔬 Lab 3 — Inside a GPU
**Foothold · GPU Computing for AI · Unit 3 · Book: Step 3**

Open up your GPU: count its parts, make its warps diverge, watch it hide memory latency, measure its bandwidth, and check your capstone plan.
For the first time you'll run small **CUDA C kernels**, the code that each GPU thread runs, through the CuPy library.

| Part | What you do | Goes with Foothold lesson |
|---|---|---|
| A | Compute the T4's peak, then measure FP32 vs FP16 | 3.1 SMs, Cores & Tensor Cores |
| B | Make a warp diverge and time the damage | 3.2 Warps & Branch Divergence |
| C | Add threads until memory latency is hidden | 3.3 Hiding Latency |
| D | Measure bandwidth: coalesced vs strided | 3.4 GPU Memory & Bandwidth |
| E | Your capstone plan vs reality | 3.C Capstone |

⏱️ About 90 minutes. 📘 Textbook: Kirk & Hwu Ch 4–5 · H&P §4.4 · Hamacher §12.1, Ch 8. Course site: {FOOTHOLD}

💬 **Every line of code has a comment** (after `#` in Python, after `//` inside the CUDA C kernels).
"""),
how_to_run(gpu=True),
md("## 0 · Setup — run both cells"),
GPU_SETUP,
CUPY_SETUP,

# ── Part A ──
md("""
---
## Part A · Work Out the Peak, Then Measure  *(Unit 3.1)*

Peak FLOPS = SMs × units per SM × FLOPs per unit per clock × clock rate. For the T4: 40 SMs; 64 FP32 cores and 8 Tensor Cores per SM; one FMA (2 FLOPs) per core per clock; 64 FMAs per Tensor Core per clock.
"""),
book(3, "A_PEAK"),
book(3, "A_MEASURE"),
md("""
### ✏️ YOUR TURN (A)
What percentage of the T4's computed peak did each precision reach? Why is FP16 so much faster? (Hint: which units does it use?)

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
book(3, "B_DIVERGE"),
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
book(3, "C_LATENCY"),
code("""
plt.figure(figsize=(6, 3.5))                                  # a new chart
plt.semilogx(total_threads, bandwidth, "o-")                  # log scale on the x axis only
plt.xlabel("threads launched"); plt.ylabel("GB/s")            # axis labels
plt.grid(alpha=0.3, which="both")                             # faint grid
plt.title("More warps → memory latency hidden → bandwidth rises, then levels off")   # the chart's title
plt.show()                                                    # draw it
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
book(3, "D_BEST"),
md("""
Now a kernel where thread i reads element `(i × stride) % n`. With stride 1, neighbouring threads read neighbouring floats (coalesced). With bigger strides, the threads of a warp land in different pieces of memory.
"""),
book(3, "D_STRIDE"),
md("""
### ✏️ YOUR TURN (D)
How many times slower was stride 32 than stride 1? Why doesn't stride 2 hurt as much?

*Your answer:*
"""),

# ── Part E ──
md("""
---
## Part E · Your Plan vs Reality  *(Unit 3.C)*

The capstone planner predicts lower bounds from FLOPs and bytes, using **this GPU's own best speeds** measured in Parts A and D. Then we measure.
"""),
book(3, "E_PLAN"),
md("""
### ✏️ YOUR TURN (E) — record your results
| Job | Planned limit | Measured time | Achieved |
|---|---|---|---|
| matmul B=1 | | | |
| matmul B=1024 | | | |
| ReLU B=1024 | | | |

1. Which jobs came closest to their plan? Which were furthest away, and why might tiny jobs miss by a lot? (Hint: launch overhead, Unit 2.5.)
2. Why does the B = 1024 matmul achieve far more TFLOPS than B = 1?

*Your answers:*

---
## 🎓 Wrap-up
- A GPU = many SMs; an SM = schedulers + registers + CUDA cores + Tensor Cores; work runs in warps of 32.
- Divergence costs time; many warps hide memory latency; coalesced access gets the bandwidth.
- Every job is limited by either compute or memory; the bigger lower bound wins.
- **Next — Unit 4: CPU–GPU Teamwork (Lab 4).** You'll allocate, copy, launch your own kernel, and copy back, step by step.
"""),
]

build("Lab3_Inside_a_GPU.ipynb", "Lab 3", cells, gpu=True)
