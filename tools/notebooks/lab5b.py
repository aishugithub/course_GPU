from common import md, code, how_to_run, build, FOOTHOLD, GPU_SETUP
from bookcells import book

cells = [
md(f"""
# 🛠️ Lab 5B — GPUs in Real AI Projects
**Foothold · GPU Computing for AI · Unit 5 (second half) · Book: Step 5, Sections 5.6–5.C**

The practical skills for real projects: inspect the software stack, measure memory, survive "CUDA out of memory", understand multi-GPU training, plan a project, and run a real language model on the GPU.

| Part | What you do | Goes with Foothold lesson |
|---|---|---|
| A | Versions, a portable device picker, real kernel names | 5.6 The Software Stack |
| B | Watch memory grow step by step; check the 16-bytes rule | 5.7 Will It Fit? |
| C | Cause an OOM, read it, fix it; catch a leak | 5.8 nvidia-smi & Out-of-Memory |
| D | Prove data parallelism on one GPU | 5.9 Many GPUs & Other Accelerators |
| E | Plan a project, then run a real language model | 5.C Grand Capstone |

⏱️ About 2 hours. 📘 Textbook: D2L Ch 13 (computational performance, multiple GPUs) · Kirk & Hwu Ch 1 and 16 · Hamacher Ch 8, §12.3–12.5. Course site: {FOOTHOLD}

💬 **Every line of code has a comment** (after the `#`) saying what it does. Read them as you go.
"""),
how_to_run(gpu=True),
md("## 0 · Setup"),
GPU_SETUP,

# ── Part A ──
md("""
---
## Part A · The Software Stack  *(Unit 5.6)*

Check every layer: PyTorch, the CUDA version it was built for, cuDNN, and the driver.
"""),
book(5, "F_STACK"),
md("**A portable device picker:** the same code runs on NVIDIA, Apple or CPU."),
book(5, "F_PICKER"),
md("**Real kernel names:** profile a small model and look for GEMM (matrix-multiply) kernels, element-wise kernels and copies."),
book(5, "F_KERNELS"),
md("""
### ✏️ YOUR TURN (A)
1. Write down the PyTorch, CUDA and driver versions. Is the driver new enough for the CUDA build (Unit 5.6's rule)?
2. In the profiler list, find one GEMM kernel, one element-wise (ReLU) kernel and one memory copy. Copy their names here.

*Your answers:*
"""),

# ── Part B ──
md("""
---
## Part B · Memory, Step by Step  *(Unit 5.7)*

A wide network (about 2 crore parameters) trained in **FP32 with Adam**: weights 4 + gradients 4 + Adam's two states 4 + 4 = **16 bytes per parameter**, plus activations. Watch `memory_allocated()` after each stage.
"""),
book(5, "G_MEMORY"),
md("**Activations grow with the batch:** measure the peak memory of one forward + backward at several batch sizes."),
book(5, "G_ACT"),
md("""
### ✏️ YOUR TURN (B)
1. Which stage added the most memory? Did the total added match the 16-bytes-per-parameter prediction (roughly)?
2. Roughly how did the activation memory change when the batch went from 1,024 to 4,096?

*Your answers:*
"""),

# ── Part C ──
md("""
---
## Part C · Out of Memory: Cause It, Read It, Fix It  *(Unit 5.8)*

We ask for a batch far too big for the T4 and **catch** the error so the notebook keeps running. (The sizes suit Colab's 15 GB T4; on a smaller GPU, halve them.)
"""),
book(5, "H_OOM"),
md("""
**The classic leak:** collecting model outputs during evaluation **without** `torch.no_grad()` keeps every batch's graph and activations alive.
"""),
book(5, "H_LEAK"),
code("""
plt.figure(figsize=(6, 3.5))                                          # a new chart
plt.plot(leak, "o-", c="tab:red", label="without no_grad (leak)")     # red line: the leak
plt.plot(ok, "s-", c="tab:green", label="with torch.no_grad()")       # green line: the fix
plt.xlabel("evaluation batch"); plt.ylabel("memory allocated (MB)")   # axis labels
plt.legend(); plt.grid(alpha=0.3)                                     # colour key and faint grid
plt.title("A climbing curve = a leak"); plt.show()                    # title, then draw it
"""),
md("""
### ✏️ YOUR TURN (C)
1. Copy the first line of the OOM message. How much did it try to allocate, and how much was free?
2. How much memory did the leaking version use after 15 batches compared with the no_grad version?

*Your answers:*
"""),

# ── Part D ──
md("""
---
## Part D · Prove Data Parallelism  *(Unit 5.9)*

Four GPUs each take a quarter of the batch, compute gradients, and average them (all-reduce). Here we do it with ONE device: split the batch into 4 slices, compute each slice's gradient, average, and compare with the full-batch gradient.
"""),
book(5, "I_DDP"),
md("""
### ✏️ YOUR TURN (D)
1. Why does averaging work only when the slices are the same size? (Hint: what does `cross_entropy` do by default: sum or mean?)
2. In real data parallelism the averaging happens over NVLink. Using Amdahl's law, why must that exchange be fast?

*Your answers:*
"""),

# ── Part E ──
md("""
---
## Part E · Plan a Project, Then Run a Real Language Model  *(Unit 5.C)*

First the planner from the capstone (prices are **assumptions**; check current rates).
"""),
book(5, "J_PLAN"),
md("""
**A real language model.** `distilgpt2` has 82 million parameters (download ≈ 350 MB). Generate 100 tokens on the CPU and on the GPU.
Prediction (Unit 5.3): each token reads all the weights, so on the T4 in FP16 the time per token is at least 82M × 2 bytes ÷ 320 GB/s ≈ 0.5 ms (≈ 2,000 tokens/s at most).
"""),
book(5, "J_LM"),
md("""
Always picking the single most likely next token (`do_sample=False`) makes small models repeat themselves; real chatbots sample with a little randomness.

### ✏️ YOUR TURN (E) — record your results
| | CPU | GPU (T4, FP16) |
|---|---|---|
| Tokens per second | | |
| Peak GPU memory | — | |
| Bandwidth limit (predicted) | — | ≈ 2,000 tokens/s |

1. How far below the bandwidth limit was the real GPU speed? Explain using Amdahl's law and launch overheads (Units 2.8, 4.4).
2. Using the planner, which GPU would you recommend for the helpdesk chatbot, and why? State your assumptions.

*Your answers:*

---
## 🎓 Course wrap-up
You can now explain and measure every link in the chain: **AI = multiply-adds → GPUs do them in parallel → the CPU feeds the GPU over PCIe → speed comes from reuse, low precision and good feeding → real projects are planned by memory, time and cost.**

**Next:** your mini-project. Open `MiniProject_Template.ipynb` from the course site.
"""),
]

build("Lab5B_GPUs_in_Real_Projects.ipynb", "Lab 5B", cells, gpu=True)
