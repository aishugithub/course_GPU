from common import md, code, how_to_run, build, FOOTHOLD

cells = [
md(f"""
# 🍔 Lab 1 — Why Is AI So Hungry?
**Foothold · GPU Computing for AI · Module 1**

Module 0 showed that AI is multiply-adds. This lab **measures** how many it does and how fast an ordinary CPU can do them, and it finds the work that can be done in parallel.

| Part | What you do | Goes with Foothold unit |
|---|---|---|
| A | Count the parameters and FLOPs of real models | 1.1 Counting the Multiply-Adds |
| B | Time inference vs training on the CPU | 1.2 Training vs Inference |
| C | Loops vs vectorised code: independent work vs a chain | 1.3 Every Output Is Independent |
| D | Measure your CPU's real speed in GFLOPS, then run the compute bill | 1.C Capstone |

⏱️ About 90 minutes. 📘 Textbook: Hamacher Ch 1 (Performance) · Stallings §2.4 · D2L Ch 12–13. Course site: {FOOTHOLD}
"""),
how_to_run(gpu=False),
md("## 0 · Setup"),
code("""
import time                         # stopwatch: time.perf_counter()
import numpy as np                  # arrays of numbers and fast maths
import matplotlib.pyplot as plt     # charts
import torch                        # PyTorch, the AI library
from torch import nn                # nn = PyTorch's network building blocks (layers, losses)

def fmt(x):
    # turn a huge number into words, e.g. 3.6e9 → "3.60 billion"
    for unit, size in [("quadrillion", 1e15), ("trillion", 1e12), ("billion", 1e9), ("million", 1e6), ("thousand", 1e3)]:
        if x >= size:                       # use the biggest unit the number reaches
            return f"{x / size:.2f} {unit}"
    return f"{x:.0f}"                       # small numbers: print as they are

print("Ready. PyTorch", torch.__version__)
"""),

# ── Part A ──
md("""
---
## Part A · Count the Work  *(Unit 1.1)*

**Parameters** are the knobs (weights + biases). For a fully connected (`Linear`) layer with `n_in` inputs and `n_out` neurons:
- parameters = `n_in × n_out + n_out`
- multiply-adds (MACs) per input = `n_in × n_out`  →  FLOPs = 2 × MACs
"""),
code("""
# The same 784 → 128 → 10 digit network you trained in Lab 0
lab1_model = nn.Sequential(nn.Flatten(), nn.Linear(784, 128), nn.ReLU(), nn.Linear(128, 10))

params = sum(p.numel() for p in lab1_model.parameters())   # .numel() = how many numbers in each weight/bias tensor
macs = 784 * 128 + 128 * 10                                # layer 1: 784 inputs × 128 neurons; layer 2: 128 × 10
print(f"Lab 0 network: {params:,} parameters, {macs:,} MACs = {2 * macs:,} FLOPs per image")
"""),
md("""
Now a real image model, **ResNet-18**, from `torchvision`. We create it with random weights (`weights=None`), so nothing is downloaded. We only want to count it.
"""),
code("""
from torchvision import models                  # torchvision also contains famous ready-made model designs

resnet = models.resnet18(weights=None)          # build ResNet-18 with random weights (no download)
resnet_params = sum(p.numel() for p in resnet.parameters())   # count all its weights and biases
print(f"ResNet-18: {resnet_params:,} parameters  (≈ {fmt(resnet_params)})")
print("Published figure: about 1.8 billion MACs (≈ 3.6 GFLOPs) per 224×224 photo")
"""),
md("""
**Chatbots:** generating one token costs about **2 FLOPs per parameter**. Fill in the table by running the cell.
"""),
code("""
# three model sizes, in parameters: 1 billion, 7 billion, 175 billion
for name, p in [("Small open model", 1e9), ("7B model", 7e9), ("GPT-3 class", 175e9)]:
    per_token = 2 * p                   # rule of thumb: 2 FLOPs per parameter for every token generated
    answer = per_token * 267            # a 200-word answer ≈ 267 tokens (a token ≈ ¾ of a word)
    print(f"{name:17s}: {fmt(per_token):>17s} FLOPs per token,  {fmt(answer):>18s} FLOPs per 200-word answer")
"""),
md("""
### ✏️ YOUR TURN (A)
1. Change the Lab 0 network to `784 → 512 → 512 → 10`. Recompute the parameters and MACs **by hand** first, then check with code.
2. How many times more FLOPs does ResNet-18 need per image than your Lab 0 network?

*Your answers:*
"""),

# ── Part B ──
md("""
---
## Part B · Inference vs Training  *(Unit 1.2)*

Inference = forward pass only. Training = forward + backward + update. Time 100 of each on the same batch.
"""),
code("""
torch.manual_seed(0)                       # fix the random numbers so everyone gets similar results
# a bigger digit network: 784 → 512 → 512 → 10
model = nn.Sequential(nn.Flatten(), nn.Linear(784, 512), nn.ReLU(), nn.Linear(512, 512), nn.ReLU(), nn.Linear(512, 10))
x = torch.randn(256, 1, 28, 28)            # a batch of 256 fake images (random numbers in MNIST's shape)
y = torch.randint(0, 10, (256,))           # 256 fake labels, each a digit 0–9
loss_fn = nn.CrossEntropyLoss()            # the loss used for "which class is it?" problems
opt = torch.optim.SGD(model.parameters(), lr=0.01)   # the optimiser: gradient descent

# inference: forward only, no gradients
with torch.no_grad():                      # tell PyTorch not to keep anything for a backward pass
    t0 = time.perf_counter()               # start the stopwatch
    for _ in range(100):                   # 100 forward passes ("_" = we don't need the loop counter)
        model(x)
    t_infer = time.perf_counter() - t0     # stop

# training: forward + backward + update
t0 = time.perf_counter()
for _ in range(100):
    loss = loss_fn(model(x), y)            # forward pass + loss
    opt.zero_grad()                        # clear old gradients
    loss.backward()                        # backward pass: compute gradients
    opt.step()                             # update the weights
t_train = time.perf_counter() - t0

print(f"100 inference passes : {t_infer:.2f} s")
print(f"100 training steps   : {t_train:.2f} s")
print(f"Training / inference : {t_train / t_infer:.1f}×   (theory says about 3×)")
"""),
md("""
**Epochs, batches, iterations.** For MNIST (60,000 images):
"""),
code("""
N = 60_000                          # MNIST training images (the _ is just a digit separator, like a comma)
for batch in [1, 32, 64, 256, 1024]:
    iters = -(-N // batch)          # ceiling division: round UP, because a last part-full batch still counts
    print(f"batch {batch:5d} → {iters:6,d} iterations per epoch")
"""),
md("""
### ✏️ YOUR TURN (B)
1. Was your ratio close to 3×? Give one reason it might differ.
2. Use **training FLOPs ≈ 6 × parameters × examples** to estimate the FLOPs for 3 epochs of the Lab 0 network on MNIST. (Treat one image as one "token".)

*Your answers:*
"""),

# ── Part C ──
md("""
---
## Part C · Independent Work vs a Chain  *(Unit 1.3)*

**ReLU** changes each number on its own, so it's independent work. A **running total** needs the previous total each time, so it's a chain.
"""),
code("""
data = np.random.randn(1_000_000)                          # 10 lakh random numbers, some negative, some positive

t0 = time.perf_counter()
relu_loop = [v if v > 0 else 0.0 for v in data]            # Python: one at a time (keep positives, negatives → 0)
t_loop = time.perf_counter() - t0

t0 = time.perf_counter()
relu_vec = np.maximum(data, 0)                              # NumPy: the whole array at once
t_vec = time.perf_counter() - t0

# × 1000 turns seconds into milliseconds

print(f"ReLU, Python loop : {t_loop * 1000:7.1f} ms")
print(f"ReLU, NumPy       : {t_vec * 1000:7.2f} ms   ({t_loop / t_vec:.0f}× faster)")
"""),
code("""
t0 = time.perf_counter()
running, total = [], 0.0           # the list of running totals, and the total so far
for v in data:                     # each step NEEDS the previous total
    total += v                     # add this number to the total so far
    running.append(total)          # remember the total after this step
t_chain_loop = time.perf_counter() - t0

t0 = time.perf_counter()
running_np = np.cumsum(data)       # cumsum = cumulative sum: compiled C, but still walks the chain in order
t_chain_np = time.perf_counter() - t0

print(f"Running total, Python loop : {t_chain_loop * 1000:7.1f} ms")
print(f"Running total, np.cumsum   : {t_chain_np * 1000:7.2f} ms")
print("Same result:", np.allclose(running, running_np))   # allclose: equal apart from tiny rounding
"""),
md("""
Both NumPy versions are faster than the loops, because they're compiled code with no Python overhead per step. But there's a big difference in what they could become:
- **ReLU** could be split across 1,000 workers, each doing 1,000 numbers at the same moment.
- The **running total** can't simply be split that way: each value waits for the previous one.

GPUs speed up the first kind enormously. That's Module 2.

### ✏️ YOUR TURN (C)
Which of these is independent work and which is a chain? (a) adding a bias to every neuron, (b) computing compound interest year by year, (c) converting 10,000 photos to greyscale, (d) a chatbot writing its answer word by word.

*Your answers:*
"""),

# ── Part D ──
md("""
---
## Part D · Measure Your CPU's Speed  *(Unit 1.C)*

An n × n matrix multiply needs **n³ MACs = 2n³ FLOPs**. Time it, divide, and you have your machine's real FLOPS.
"""),
code("""
def py_matmul(A, B):
    # matrix multiply in plain Python: C[i][j] = sum over k of A[i][k] × B[k][j]
    n = len(A)
    return [[sum(A[i][k] * B[k][j] for k in range(n)) for j in range(n)] for i in range(n)]

py_sizes, py_times = [20, 40, 60, 80], []      # small sizes only: plain Python is slow
for n in py_sizes:
    A = np.random.rand(n, n).tolist(); B = np.random.rand(n, n).tolist()   # random matrices as plain Python lists
    t0 = time.perf_counter(); py_matmul(A, B); t = time.perf_counter() - t0  # time one multiply
    py_times.append(t)                         # keep the time for the chart below
    # speed = FLOPs ÷ seconds; an n × n multiply is 2n³ FLOPs; ÷ 1e6 gives MFLOPS (millions per second)
    print(f"Python  n={n:4d}: {t * 1000:9.1f} ms   → {2 * n**3 / t / 1e6:8.1f} MFLOPS")
"""),
code("""
np_sizes, np_times = [100, 200, 400, 800, 1600], []   # NumPy is fast enough for much bigger sizes
for n in np_sizes:
    # float32 = 4-byte numbers, the usual size in AI
    A = np.random.rand(n, n).astype(np.float32); B = np.random.rand(n, n).astype(np.float32)
    A @ B                                            # warm-up run (the first call has extra start-up cost)
    t0 = time.perf_counter(); A @ B; t = time.perf_counter() - t0   # the timed run
    np_times.append(t)
    print(f"NumPy   n={n:4d}: {t * 1000:9.2f} ms   → {2 * n**3 / t / 1e9:8.1f} GFLOPS")   # ÷ 1e9 → GFLOPS

# the best speed over all sizes = your CPU's measured FLOPS (used in the compute bill below)
cpu_flops = max(2 * n**3 / t for n, t in zip(np_sizes, np_times))
print(f"\\nYour CPU's best measured speed: {cpu_flops / 1e9:.1f} GFLOPS")
"""),
code("""
plt.figure(figsize=(6, 4))
# loglog = both axes on a log scale, so tiny and huge times fit on one chart
plt.loglog(py_sizes, py_times, "o-", label="plain Python")   # "o-" = circles joined by lines
plt.loglog(np_sizes, np_times, "s-", label="NumPy")          # "s-" = squares joined by lines
plt.xlabel("matrix size n"); plt.ylabel("time (s)")           # axis labels
plt.grid(alpha=0.3, which="both"); plt.legend()               # faint grid and the colour key
plt.title("Doubling n → about 8× the time (n³)")
plt.show()
"""),
md("""
### The compute bill, with YOUR measured CPU
This is the capstone estimator, with the guessed laptop speed replaced by the number you just measured.
"""),
code("""
# the helpdesk: a 7B-parameter model, 5,000 students, 4 questions each per day, 200-word answers
params, students, questions_each, words = 7e9, 5000, 4, 200
utilisation, rupees_per_hour = 0.3, 35            # assumptions: change them (real programs reach ~30% of peak)

# FLOPs per day = 2 per parameter per token × tokens per answer (words ÷ 0.75) × answers per day
flops_per_day = 2 * params * (words / 0.75) * students * questions_each
print(f"Work per day: {flops_per_day:.2e} FLOPs\\n")     # .2e = scientific notation, e.g. 7.47e+16

# each machine's peak speed in FLOPS (your CPU = the value you just measured)
machines = {"YOUR CPU (measured)": cpu_flops, "T4 GPU FP32": 8.1e12, "T4 GPU FP16": 65e12}
for name, peak in machines.items():
    hours = flops_per_day / (peak * utilisation) / 3600   # time = work ÷ real speed; ÷ 3600 → hours
    # more than 24 hours of work per day means one machine can't keep up: how many would we need?
    verdict = "✓ fits in one day" if hours <= 24 else f"✗ needs {int(hours // 24) + 1} machines"
    print(f"{name:20s}: {hours:10.1f} hours of work per day   {verdict}")
"""),
md("""
### ✏️ YOUR TURN (D) — record your results
| | Your value |
|---|---|
| Plain Python speed (MFLOPS) | |
| NumPy best speed (GFLOPS) | |
| NumPy ÷ Python | |
| Hours/day for the bot on your CPU | |

**Think:** NumPy is hundreds of times faster than plain Python on the *same* CPU. Where could that speed come from? (Hint: compiled code, SIMD instructions, several cores, and cache-friendly order. Module 2 continues the story.)

*Your answers:*

---
## 🎓 Wrap-up
- time = work (FLOPs) ÷ speed (FLOPS). You can now estimate any AI job.
- Training ≈ 3× inference per example, repeated over the whole dataset every epoch.
- Matrix multiplies and element-wise operations are **independent work**: perfect for many workers at once.
- **Next — Module 2: CPU vs GPU.** You'll run your first code on a GPU and race it against the CPU numbers you recorded today.
"""),
]

build("Lab1_AI_Is_Hungry.ipynb", "Lab 1", cells, gpu=False)
