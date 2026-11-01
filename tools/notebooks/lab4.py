from common import md, code, how_to_run, build, FOOTHOLD, GPU_SETUP, CUPY_SETUP
from bookcells import book

cells = [
md(f"""
# 🤝 Lab 4 — CPU–GPU Teamwork
**Foothold · GPU Computing for AI · Unit 4 · Book: Step 4**

How does the CPU hand work to the GPU? Today you do every step yourself: move data, allocate, copy, **write and launch your own kernels**, handle asynchronous launches, and finally profile and fix a slow training loop.

| Part | What you do | Goes with Foothold lesson |
|---|---|---|
| A | Where tensors live; measure PCIe, pinned vs normal memory | 4.1 Host & Device on PCIe |
| B | The five steps, one line at a time, timed | 4.2 The Five Steps of Offloading |
| C | Write ReLU and image kernels; block sizes; the `if (i < n)` check | 4.3 Kernels, Grids, Blocks, Threads |
| D | Asynchronous launches, honest timing, the cost of `.item()` | 4.4 Async Launch & Synchronization |
| E | Profile and fix a slow training loop | 4.C Capstone |

⏱️ About 2 hours (Parts A–C in one session, D–E in the next). 📘 Textbook: Kirk & Hwu Ch 2–3 · Hamacher §12.2.1, Ch 7 (PCIe), Ch 3 (interrupts). Course site: {FOOTHOLD}

💬 **Every line of code has a comment** (after `#` in Python, after `//` inside the CUDA C kernels).
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
book(4, "A_DEVICE"),
md("""
**How fast is PCIe?** Copy tensors of growing size from host to device. Then repeat with **pinned** (page-locked) host memory, which the GPU's DMA engine can read directly. (A T4 is on PCIe Gen 3 ×16: about 16 GB/s on paper, about 12 GB/s in practice.)
"""),
book(4, "A_PCIE"),
md("""
### ✏️ YOUR TURN (A)
1. What PCIe speed did you measure? How does it compare with the GPU's own memory (measured in Lab 3)?
2. Why are small copies (1 MB) so much slower per byte than big ones?

*Your answers:*
"""),

# ── Part B ──
md("""
---
## Part B · The Five Steps, One at a Time  *(Unit 4.2)*

ReLU on 100 MB of data, with every step as its own line and its own timer. `sync()` makes each timer honest.
"""),
book(4, "B_STEPS"),
md("""
The same five steps in **CuPy**. Notice how closely it mirrors the CUDA C version from the lesson (`cudaMalloc`, `cudaMemcpy`…).
"""),
book(4, "B_CUPY"),
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
book(4, "C_RELU"),
md("""
**What if you forget `if (i < n)`?** Writing past the end of a real array can crash the whole Colab session, so we do it safely: the output array gets 1,024 extra 'sentinel' slots set to −1, and we look at whether the kernel scribbled over them.
"""),
book(4, "C_UNSAFE"),
md("""
**A 2-D kernel:** brighten an image, one thread per pixel, with 16 × 16 blocks.
"""),
book(4, "C_IMAGE"),
code("""
fig, ax = plt.subplots(1, 2, figsize=(9, 3.2))      # two pictures side by side
# vmin/vmax fix the grey scale to 0..1, so "before" and "after" use the same brightness scale
ax[0].imshow(image, cmap="gray", vmin=0, vmax=1); ax[0].set_title("before"); ax[0].axis("off")                        # the original
ax[1].imshow(result, cmap="gray", vmin=0, vmax=1); ax[1].set_title("after: brightened on the GPU"); ax[1].axis("off")  # the result
plt.show()                                          # draw them
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
book(4, "D_WRONG"),
md("""
Now the cost of a **sync point every step**: train a small network for 300 steps, calling `loss.item()` every step vs only at the end.
"""),
book(4, "D_ITEM"),
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

The final-year team's loop vs the fixed loop, on MNIST (the handwritten digits from Lab 1), one epoch each.
"""),
book(4, "E_LOOPS"),
md("""
**Fair comparison note:** after one epoch the fast loop's accuracy may be a little lower. Batch 256 makes only **235 weight updates per epoch** compared with **3,750** for batch 16 (Unit 2.2: epochs, batches, iterations). Train the fast loop for 2–3 epochs and it catches up, still in less total time. Faster per epoch is only useful if the model still learns well, so always check both.

**The professional tool: the PyTorch profiler.** Profile 30 steps of each loop and compare the top entries. Look for `cudaMemcpyAsync` (copies) and `cudaStreamSynchronize` (the CPU waiting).
"""),
book(4, "E_PROFILE"),
md("""
### ✏️ YOUR TURN (E) — record your results
| | Slow loop | Fast loop |
|---|---|---|
| Seconds per epoch | | |
| Batch size | 16 | 256 |
| Sync points per step | | |

1. What speed-up did the fixes give?
2. In the profiler lists, name one entry that's big in the SLOW loop but small in the FAST loop, and explain it using a Unit 4 idea.
3. Run `!nvidia-smi` in a new cell **while** the slow loop runs (start it, then quickly run the other cell). What GPU-Util % do you see?

*Your answers:*

---
## 🎓 Wrap-up
- Host and device have separate memories joined by a narrow PCIe link: copy once, compute many times.
- Every GPU job: allocate → copy in → launch → copy out → free.
- Kernels: each thread finds its element with `blockIdx × blockDim + threadIdx`, guarded by `if (i < n)`.
- Launches are asynchronous: sync only when you need a value, and overlap CPU work with GPU work.
- **Next — Unit 5: Making AI Fast (Lab 5A).** Tiling, Tensor Cores, low precision, and the roofline.
"""),
]

build("Lab4_CPU_GPU_Teamwork.ipynb", "Lab 4", cells, gpu=True)
