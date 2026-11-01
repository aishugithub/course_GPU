from common import md, code, how_to_run, build, FOOTHOLD, GPU_SETUP, CUPY_SETUP
from bookcells import book

cells = [
md(f"""
# 🚀 Lab 5A — Why GPUs Make AI Fast
**Foothold · GPU Computing for AI · Unit 5 (first half) · Book: Step 5, Sections 5.1–5.5**

Measure the tricks that make GPUs so good at AI: tiling, Tensor Cores and low precision, the roofline, and batch size. Then put them together to speed up a real training run.

| Part | What you do | Goes with Foothold lesson |
|---|---|---|
| A | Naive vs tiled matrix-multiply kernels vs cuBLAS | 5.1 Parallel Matrix Multiply & Tiling |
| B | FP32 vs FP16: speed, error, overflow, mixed-precision training | 5.2 Precision |
| C | Measure your GPU's roof and plot your own roofline | 5.3 Compute-bound vs Memory-bound |
| D | CPU vs GPU training, batch-size sweep, memory | 5.4 Batch Size & Training on GPU |
| E | The speed-up ladder on Fashion-MNIST | 5.5 Capstone |

⏱️ About 2 hours (A–C, then D–E). 📘 Textbook: Kirk & Hwu Ch 5 and Ch 16 · Hamacher Ch 9 (floating point) · H&P Ch 4 (roofline). Course site: {FOOTHOLD}

💬 **Every line of code has a comment** (after `#` in Python, after `//` inside the CUDA C kernels).
"""),
how_to_run(gpu=True),
md("## 0 · Setup — run both cells"),
GPU_SETUP,
CUPY_SETUP,

# ── Part A ──
md("""
---
## Part A · Naive vs Tiled vs cuBLAS  *(Unit 5.1)*

Two hand-written kernels from the lesson, compiled with CuPy, raced against PyTorch's `A @ B` (which calls NVIDIA's cuBLAS library) in FP32 and FP16.
"""),
book(5, "A_TILING"),
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
book(5, "B_ERROR"),
md("**Range: overflow and underflow.** FP16's largest number is 65,504; BF16 keeps FP32's range."),
book(5, "B_RANGE"),
md("""
70000 becomes `inf` in FP16 (overflow) and 2e-8 becomes 0 (underflow); BF16 keeps both, with fewer digits.

**Mixed-precision training.** The same wide network on MNIST (the handwritten digits from Lab 1), one epoch with FP32 and one with `autocast` + `GradScaler`. To measure the GPU work itself, the data is kept on the GPU.
"""),
book(5, "B_MIXED"),
md("""
### ✏️ YOUR TURN (B)
1. How much faster was FP16 for the matrix multiply? How big was its error?
2. Did mixed precision change the accuracy? Explain using Unit 5.2's "Does AI notice?".

*Your answers:*
"""),

# ── Part C ──
md("""
---
## Part C · Your Own Roofline  *(Unit 5.3)*

First measure **this GPU's roof** (its best FP32 speed and its best bandwidth). Then measure each operation's FLOPs, bytes and time, and place it under the roof. (On a T4 expect a roof of roughly 4–5 TFLOPS measured against 8.1 TFLOPS published, and roughly 250–300 GB/s against 320 GB/s published.)
"""),
book(5, "C_ROOF"),
code("""
I = np.logspace(-2, 4, 200)                        # 200 intensities from 0.01 to 10,000, evenly spaced on a log scale
plt.figure(figsize=(7, 4.5))                       # a new chart
plt.loglog(I, np.minimum(PEAK, BW * I), "k-", lw=2, label="this GPU's roofline (FP32)")   # the roof: min(peak, bandwidth × intensity)
for name, inten, perf in results:                  # every operation we measured
    plt.loglog(inten, perf, "o", ms=8)             # one dot per operation (ms = marker size)
    plt.annotate(name, (inten, perf), textcoords="offset points", xytext=(6, -10), fontsize=8)   # its name beside it
plt.axvline(PEAK / BW, ls=":", c="gray")           # a dotted vertical line at the ridge point
plt.text(PEAK / BW * 1.1, 1e9, f"ridge ≈ {PEAK/BW:.0f}", fontsize=8)   # label it
plt.xlabel("arithmetic intensity (FLOPs per byte)"); plt.ylabel("achieved FLOPS")   # axis labels
plt.grid(alpha=0.3, which="both"); plt.legend()    # faint grid and the colour key
plt.title("Your measurements under your GPU's roofline"); plt.show()   # title, then draw it
"""),
md("""
### ✏️ YOUR TURN (C)
1. Which operations sat close to the slanted (memory) roof, and which near the flat (compute) roof?
2. Use your "layer, batch 1" bandwidth to estimate tokens per second for a 1-billion-parameter FP16 chatbot on your GPU.

*Your answers:*
"""),

# ── Part D ──
md("""
---
## Part D · Batch Size and Training on the GPU  *(Unit 5.4)*

**CPU vs GPU** for the wide network: time 100 training steps on each.
"""),
book(5, "D_CPUGPU"),
md("**Batch-size sweep:** throughput (images per second) and peak GPU memory."),
book(5, "D_SWEEP"),
code("""
fig, ax = plt.subplots(1, 2, figsize=(10, 3.5))                 # two charts side by side: ax[0] and ax[1]
ax[0].semilogx(batches, tput, "o-"); ax[0].set_xlabel("batch size"); ax[0].set_ylabel("images / s")     # throughput
ax[0].set_title("Throughput rises, then levels off"); ax[0].grid(alpha=0.3)                            # its title and grid
ax[1].semilogx(batches, mem, "s-", c="tab:red"); ax[1].set_xlabel("batch size"); ax[1].set_ylabel("GB") # memory
ax[1].set_title("Memory keeps climbing"); ax[1].grid(alpha=0.3)                                        # its title and grid
plt.tight_layout(); plt.show()                                  # stop them overlapping, then draw
"""),
md("""
### ✏️ YOUR TURN (D)
1. How much faster was the GPU for the wide network? Compare with the small Lab 1 network (Unit 5.4 explains the difference).
2. Where did throughput level off? Which batch size would you choose, and why?

*Your answers:*
"""),

# ── Part E ──
md("""
---
## Part E · The Speed-Up Ladder  *(Unit 5.5)*

**What is Fashion-MNIST?** A harder twin of MNIST, released by the online shop Zalando in 2017. Same format — 70,000 grey 28 × 28 pictures (60,000 training + 10,000 test), 10 classes — but the pictures are **clothing** instead of digits: T-shirt/top, trouser, pullover, dress, coat, sandal, shirt, sneaker, bag, ankle boot. Telling a shirt from a pullover is harder than telling a 1 from a 7, so accuracy is lower (about 80–88% for a simple network instead of 97%).

Network 784 → 1024 → 1024 → 10. Each rung adds ONE change. We time one epoch and check test accuracy at every rung.
"""),
book(5, "E_LADDER"),
code("""
names = ["T-shirt", "trouser", "pullover", "dress", "coat", "sandal", "shirt", "sneaker", "bag", "boot"]   # the 10 classes, in order
plt.figure(figsize=(10, 1.6))                                    # one wide, short drawing area
for i in range(10):                                              # the first 10 test pictures
    plt.subplot(1, 10, i + 1)                                    # 1 row of 10 boxes: draw in box i+1
    plt.imshow(fash_test.data[i], cmap="gray")                   # test picture i
    plt.title(names[fash_test.targets[i]], fontsize=8)           # its label, as a word
    plt.axis("off")                                              # no axes around the picture
plt.show()                                                       # draw them
"""),
md("""
Not every rung helps on every machine, and that is the real lesson. After one epoch, a wobble of 2–4% in accuracy between rungs is normal noise from different batch orders and sizes: re-run a rung to check before believing it.

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
2. Did any rung change the accuracy noticeably?
3. Did you reach the 5× target?

*Your answers:*

---
## 🎓 Wrap-up
- Tiling reuses data from shared memory; libraries like cuBLAS go further.
- FP16/BF16/INT8 halve or quarter the bytes and unlock Tensor Cores, and AI barely notices.
- The roofline tells you whether memory or compute is the limit, and which fix will work.
- Batch size, feeding the GPU and mixed precision together turn a slow run into a fast one.
- **Next — Lab 5B (second half of Unit 5): GPUs in Real AI Projects.** The software stack, sizing memory, out-of-memory errors, and many GPUs.
"""),
]

build("Lab5A_Why_GPUs_Make_AI_Fast.ipynb", "Lab 5A", cells, gpu=True)
