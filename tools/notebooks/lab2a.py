from common import md, code, how_to_run, build, FOOTHOLD
from bookcells import book

cells = [
md(f"""
# 🍔 Lab 2A — Why Is AI So Hungry?
**Foothold · GPU Computing for AI · Unit 2 (first half) · Book: Step 2, Sections 2.1–2.4**

Unit 1 showed that AI is multiply-adds. This lab **measures** how many it does and how fast an ordinary CPU can do them, and it finds the work that can be done in parallel.

| Part | What you do | Goes with Foothold lesson |
|---|---|---|
| A | Count the parameters and FLOPs of real models | 2.1 Counting the Multiply-Adds |
| B | Time inference vs training on the CPU | 2.2 Training vs Inference |
| C | Loops vs vectorised code: independent work vs a chain | 2.3 Every Output Is Independent |
| D | Measure your CPU's real speed in GFLOPS, then run the compute bill | 2.4 Capstone: The Compute Bill |

⏱️ About 90 minutes. 📘 Textbook: Hamacher Ch 1 (Performance) · Stallings §2.4 · D2L Ch 12–13. Course site: {FOOTHOLD}

💬 **Every line of code has a comment** (after the `#`) saying what it does. Read them as you go.
"""),
how_to_run(gpu=False),
md("## 0 · Setup"),
book(2, "A_SETUP"),

# ── Part A ──
md("""
---
## Part A · Count the Work  *(Unit 2.1)*

**Parameters** are the knobs (weights + biases). For a fully connected (`Linear`) layer with `n_in` inputs and `n_out` neurons:
- parameters = `n_in × n_out + n_out`
- multiply-adds (MACs) per input = `n_in × n_out`  →  FLOPs = 2 × MACs

Then a real photo model, **ResNet-18**, built with random weights (`weights=None`), so nothing is downloaded: we only want to count it.
"""),
book(2, "A_COUNT"),
md("""
**Chatbots:** writing one token costs about **2 FLOPs per parameter**.
"""),
book(2, "A_TOKENS"),
md("""
### ✏️ YOUR TURN (A)
1. Change the Lab 1 network to `784 → 512 → 512 → 10`. Recompute the parameters and MACs **by hand** first, then check with code.
2. How many times more FLOPs does ResNet-18 need per image than your Lab 1 network?

*Your answers:*
"""),

# ── Part B ──
md("""
---
## Part B · Inference vs Training  *(Unit 2.2)*

Inference = forward pass only. Training = forward + backward + update. Time 100 of each on the same batch.
"""),
book(2, "B_TIME"),
md("""
The theory counts only multiply-adds (about 3×). On a CPU, a small network also spends time on everything *around* the arithmetic, so your ratio may well be higher.

**Epochs, batches, iterations.** For MNIST (60,000 images):
"""),
book(2, "B_EPOCH"),
md("""
### ✏️ YOUR TURN (B)
1. Was your ratio close to 3×? Give one reason it might differ.
2. Use **training FLOPs ≈ 6 × parameters × examples** to estimate the FLOPs for 3 epochs of the Lab 1 network on MNIST. (Treat one image as one "token".)

*Your answers:*
"""),

# ── Part C ──
md("""
---
## Part C · Independent Work vs a Chain  *(Unit 2.3)*

**ReLU** changes each number on its own, so it's independent work. A **running total** needs the previous total each time, so it's a chain.
"""),
book(2, "C_RELU"),
book(2, "C_CHAIN"),
md("""
Both NumPy versions are faster than the loops, because they're compiled code with no Python overhead per step. But there's a big difference in what they could become:
- **ReLU** could be split across 1,000 workers, each doing 1,000 numbers at the same moment.
- The **running total** can't simply be split that way: each value waits for the previous one.

GPUs speed up the first kind enormously. That's Lab 2B.

### ✏️ YOUR TURN (C)
Which of these is independent work and which is a chain? (a) adding a bias to every neuron, (b) computing compound interest year by year, (c) converting 10,000 photos to greyscale, (d) a chatbot writing its answer word by word.

*Your answers:*
"""),

# ── Part D ──
md("""
---
## Part D · Measure Your CPU's Speed  *(Unit 2.4)*

An n × n matrix multiply needs **n³ MACs = 2n³ FLOPs**. Time it, divide, and you have your machine's real FLOPS.
"""),
book(2, "D_PY"),
book(2, "D_NP"),
code("""
import matplotlib.pyplot as plt                                # Matplotlib: charts
plt.figure(figsize=(6, 4))                                     # a new 6 × 4 inch chart
plt.loglog(py_sizes, py_times, "o-", label="plain Python")     # log scale on both axes; circles joined by lines
plt.loglog(np_sizes, np_times, "s-", label="NumPy")            # squares joined by lines
plt.xlabel("matrix size n"); plt.ylabel("time (s)")            # axis labels
plt.grid(alpha=0.3, which="both"); plt.legend()                # faint grid and the colour key
plt.title("Doubling n → about 8× the time (n³)")               # the chart's title
plt.show()                                                     # draw it
"""),
md("""
### The compute bill, with YOUR measured CPU
This is the capstone estimator, with the guessed laptop speed replaced by the number you just measured.
"""),
book(2, "D_BILL"),
md("""
### ✏️ YOUR TURN (D) — record your results
| | Your value |
|---|---|
| Plain Python speed (MFLOPS) | |
| NumPy best speed (GFLOPS) | |
| NumPy ÷ Python | |
| Hours/day for the bot on your CPU | |

**Think:** NumPy is hundreds or thousands of times faster than plain Python on the *same* CPU. Where could that speed come from? (Hint: compiled code, SIMD instructions, several cores, and cache-friendly order. Lab 2B continues the story.)

*Your answers:*

---
## 🎓 Wrap-up
- time = work (FLOPs) ÷ speed (FLOPS). You can now estimate any AI job.
- Training ≈ 3× inference per example, repeated over the whole dataset every epoch.
- Matrix multiplies and element-wise operations are **independent work**: perfect for many workers at once.
- **Next — Lab 2B: CPU vs GPU.** You'll run your first code on a GPU and race it against the CPU numbers you recorded today.
"""),
]

build("Lab2A_AI_Is_Hungry.ipynb", "Lab 2A", cells, gpu=False)
