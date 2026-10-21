from common import md, code, how_to_run, build, FOOTHOLD

cells = [
md(f"""
# 🧠 Lab 0 — AI Basics, by Hand and in Code
**Foothold · GPU Computing for AI · Module 0: What Is AI, Really?**

In the Foothold lessons you *played* with each idea. In this lab you *write the code* for it — the same examples, the same numbers — and finish by training a real neural network that reads handwritten digits.

| Part | What you do | Goes with Foothold unit |
|---|---|---|
| A | Let Python search for the best pass/fail cut-off | 0.1 Rules vs Learning |
| B | Look inside a real image, a sentence and a tensor | 0.2 Everything Is Numbers |
| C | Build a neuron with a loop, then with `np.dot` | 0.3 The Neuron |
| D | Gradient descent from scratch | 0.4 Learning = Reducing Error |
| E | Prove that a layer is a matrix multiply | 0.5 Layers = Matrix Multiplication |
| F | Train a digit-reading network on the **CPU** and time it | 0.C Capstone |

⏱️ About 90 minutes. Course site: {FOOTHOLD}
"""),
how_to_run(gpu=False),
md("""
## 0 · Setup
Run this once. It loads the three libraries we use everywhere:
- **NumPy** — fast arrays of numbers (tensors) on the CPU
- **Matplotlib** — drawing charts and images
- **time** — a stopwatch
"""),
code("""
import numpy as np
import matplotlib.pyplot as plt
import time

np.set_printoptions(linewidth=150, precision=3, suppress=True)
print("Ready! NumPy version:", np.__version__)
"""),

# ── Part A ──
md("""
---
## Part A · Rules vs Learning  *(Unit 0.1)*

Last year's 12 students: study hours per day, and whether they passed (1) or failed (0).
First **you** write a rule, then Python **learns** one by trying every cut-off — exactly the search you watched in the lesson.
"""),
code("""
names  = ["SNEHA","ARUN","ARJUN","DIVYA","RAHUL","VIJAY","NISHA","KARTHIK","MEENA","ANU","PRIYA","LAKSHMI"]
hours  = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.0, 3.5, 4.0, 4.5, 5.5, 6.0]
passed = [0,   0,   0,   0,   0,   0,   1,   1,   1,   1,   1,   1  ]

def my_rule(h):
    # ✏️ a hand-written rule: PASS if hours >= 5
    return 1 if h >= 5 else 0

# "correct" counts EVERY right prediction: a correct PASS and a correct FAIL both count
correct = 0
for name, h, p in zip(names, hours, passed):
    guess = my_rule(h)
    ok = guess == p
    correct += ok
    print(f"{name:8s} {h:3.1f} h   rule says {'PASS' if guess else 'FAIL'}   actually {'PASS' if p else 'FAIL'}   {'✓' if ok else '✗'}")
print(f"\\nMy hand-written rule gets {correct} / {len(hours)} right")
"""),
md("""
Now let the machine **learn** the cut-off: try every candidate, score it against the real answers, keep the best.
This loop *is* learning, in its simplest form.
"""),
code("""
candidates = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0]
best_cut, best_score = None, -1

for cut in candidates:
    score = sum(1 for h, p in zip(hours, passed) if (1 if h >= cut else 0) == p)
    print(f"cut-off {cut:>3}: {score:2d} / 12")
    if score > best_score:            # keep the FIRST best one found
        best_cut, best_score = cut, score

print(f"\\nLearned rule: PASS if hours >= {best_cut}  ({best_score} / 12 correct)")
"""),
md("""
**Why not 12 / 12?** VIJAY and NISHA both studied 3.0 hours, but one failed and one passed. No single cut-off can be right for both. Real data is messy.

### ✏️ YOUR TURN (A)
1. Change `my_rule` so it gets as many right as the learned rule.
2. Add a 13th student who studied **1 hour and passed**. Re-run both cells. Does the learned cut-off change? Why or why not?

*Write your answers here (double-click to edit):*
"""),

# ── Part B ──
md("""
---
## Part B · Everything Is Numbers  *(Unit 0.2)*

We download **MNIST** — 70,000 handwritten digits, each a 28 × 28 grid of brightness values (0 = black, 255 = white).
The download is about 11 MB and takes a few seconds.
"""),
code("""
from torchvision import datasets

mnist = datasets.MNIST(root="data", train=True, download=True)
image, label = mnist[0]          # the very first training image
pixels = np.array(image)         # turn the picture into a NumPy array

print("This digit is a:", label)
print("Shape:", pixels.shape, "  smallest:", pixels.min(), "  largest:", pixels.max())
"""),
md("Print the raw numbers. Squint — you can see the digit drawn in the numbers themselves!"),
code("""
np.set_printoptions(linewidth=250)
print(pixels)
"""),
code("""
plt.figure(figsize=(3, 3))
plt.imshow(pixels, cmap="gray")
plt.title(f"Label: {label}")
plt.axis("off")
plt.show()
"""),
md("""
**Text becomes numbers too.** Real chatbots use a dictionary of ~1 lakh tokens; here is a tiny one so you can see the idea.
"""),
code("""
vocab = {"i": 41, "love": 893, "mangoes": 2711, "the": 5, "bus": 1204, "is": 12, "late": 3330}

sentence = "I love mangoes"
tokens = sentence.lower().split()
ids = [vocab.get(t, 0) for t in tokens]      # 0 = [UNK], unknown word
print(tokens, "→", ids)
"""),
md("""
**Tensors and shapes.** A batch of 32 MNIST images stacked together is one 3-D tensor. Its *shape* says how the numbers are arranged.
"""),
code("""
batch = np.stack([np.array(mnist[i][0]) for i in range(32)])
print("One image:", pixels.shape, " =", pixels.size, "numbers")
print("A batch  :", batch.shape, " =", batch.size, "numbers")
"""),
md("""
### ✏️ YOUR TURN (B)
1. Show image number 7 instead of image 0. What digit is it?
2. A colour photo of 224 × 224 pixels has 3 numbers per pixel. How many numbers is a batch of 64 such photos? Compute it in a code cell.

*Your answers:*
"""),

# ── Part C ──
md("""
---
## Part C · The Neuron  *(Unit 0.3)*

A neuron: multiply each input by its weight, add them up, add the bias, then decide.

$$z = w_1x_1 + w_2x_2 + \\dots + w_nx_n + b$$

First with a plain Python loop — exactly what the hardware does — then with NumPy's `np.dot`.
"""),
code("""
x = np.array([1, 1, 0])          # sunny? exam tomorrow? friends going?
w = np.array([2.0, -4.0, 1.5])   # how much each one matters
b = -1.0

# the loop way: one multiply-add (MAC) at a time
z_loop = b
for i in range(len(x)):
    z_loop += w[i] * x[i]

# the NumPy way: same arithmetic, one call
z_dot = np.dot(w, x) + b

print("z (loop)   =", z_loop)
print("z (np.dot) =", z_dot)
print("Decision:", "GO to the match" if z_dot >= 0 else "STAY home")
"""),
md("**Activation functions** bend the output. Plot the three from the lesson:"),
code("""
z = np.linspace(-5, 5, 200)
step    = (z >= 0).astype(float)
sigmoid = 1 / (1 + np.exp(-z))
relu    = np.maximum(0, z)

plt.figure(figsize=(9, 2.8))
for k, (name, y) in enumerate([("Step", step), ("Sigmoid", sigmoid), ("ReLU", relu)]):
    plt.subplot(1, 3, k + 1); plt.plot(z, y); plt.title(name); plt.grid(alpha=0.3)
plt.tight_layout(); plt.show()
"""),
md("Now the six students from the lesson, whose results depend on **both** hours and attendance."),
code("""
students = ["KAVYA", "RAVI", "SURESH", "GEETHA", "IMRAN", "POOJA"]
X = np.array([[4, 40], [2, 95], [5, 90], [1, 60], [3.5, 85], [2.5, 50]])   # hours, attendance %
y = np.array([0, 1, 1, 0, 1, 0])

w = np.array([1.0, 0.05])     # ✏️ weights for hours, attendance
b = -6.5                      # ✏️ bias

z = X @ w + b                 # all six neurons-worth in one go
pred = (z >= 0).astype(int)
for s, zi, p, t in zip(students, z, pred, y):
    print(f"{s:7s} z = {zi:6.2f} → {'PASS' if p else 'FAIL'}  {'✓' if p == t else '✗'}")
print("Correct:", (pred == y).sum(), "/ 6")
"""),
md("""
### ✏️ YOUR TURN (C)
1. Set `w = np.array([1.0, 0.0])` (ignore attendance). How many are right now? Which students go wrong?
2. A neuron reading a 28 × 28 image has how many weights? How many multiplications per image?

*Your answers:*
"""),

# ── Part D ──
md("""
---
## Part D · Gradient Descent  *(Unit 0.4)*

Model: `marks = w × hours + 20`. We want the `w` that makes the **mean squared error** smallest.
For this data the slope (gradient) of the loss works out to `22·w − 266` — but we'll compute it from the data so the code works for any data.
"""),
code("""
hours = np.array([1, 2, 3, 4, 5])
marks = np.array([30, 45, 55, 70, 80])

def loss_fn(w):
    pred = w * hours + 20
    return np.mean((marks - pred) ** 2)

def grad_fn(w):
    pred = w * hours + 20
    return np.mean(-2 * hours * (marks - pred))   # slope of the loss at w

def train(lr, epochs=15, w=0.0, verbose=False):
    history = []
    for epoch in range(epochs):
        history.append(loss_fn(w))
        if verbose:
            print(f"epoch {epoch:2d}  w = {w:8.3f}  loss = {loss_fn(w):10.2f}  grad = {grad_fn(w):9.2f}")
        w = w - lr * grad_fn(w)        # the nudge
    return w, history

w_final, _ = train(lr=0.02, epochs=8, verbose=True)
"""),
md("Compare learning rates — the balancing act from the lesson:"),
code("""
plt.figure(figsize=(7, 3.5))
for lr in [0.005, 0.02, 0.08, 0.1]:
    w_end, hist = train(lr, epochs=15)
    plt.plot(hist, marker="o", label=f"lr = {lr}  (final w = {w_end:.2f})")
plt.yscale("log"); plt.xlabel("epoch"); plt.ylabel("loss (log scale)"); plt.legend(); plt.grid(alpha=0.3)
plt.title("Too small crawls · just right settles · too big zig-zags or explodes")
plt.show()
"""),
md("""
### ✏️ YOUR TURN (D)
1. Which learning rate reached w ≈ 12.09 fastest? What happened at 0.1?
2. Change the starting point to `w=30.0` in `train(...)`. Does it still find the bottom?

*Your answers:*
"""),

# ── Part E ──
md("""
---
## Part E · A Layer Is a Matrix Multiply  *(Unit 0.5)*

A layer of 128 neurons reading 784 inputs has a weight matrix `W` of shape (128, 784).
For a batch `X` of 64 images: `Y = X @ W.T + b`. We check that PyTorch's `nn.Linear` does **exactly** this.
"""),
code("""
import torch

X = np.random.rand(64, 784).astype(np.float32)
W = np.random.randn(128, 784).astype(np.float32) * 0.05
b = np.random.randn(128).astype(np.float32) * 0.05

Y_numpy = X @ W.T + b                      # the maths, by hand

layer = torch.nn.Linear(784, 128)          # PyTorch's layer...
with torch.no_grad():                      # ...given OUR weights
    layer.weight.copy_(torch.from_numpy(W))
    layer.bias.copy_(torch.from_numpy(b))
    Y_torch = layer(torch.from_numpy(X)).numpy()

print("Output shape:", Y_numpy.shape)
print("Biggest difference between NumPy and PyTorch:", np.abs(Y_numpy - Y_torch).max())
print("MACs for this one layer, one batch:", f"{64 * 784 * 128:,}")
"""),
md("""
The difference is essentially zero (tiny rounding only). **`nn.Linear` is a matrix multiply.** That is the operation GPUs are built to do fast.

### ✏️ YOUR TURN (E)
Time the plain-Python triple loop against `@` for a smaller case. Run it and note the ratio.
"""),
code("""
n = 60
A = np.random.rand(n, n); B = np.random.rand(n, n)

t0 = time.perf_counter()
C = [[sum(A[i, k] * B[k, j] for k in range(n)) for j in range(n)] for i in range(n)]
t_loops = time.perf_counter() - t0

t0 = time.perf_counter(); C2 = A @ B; t_numpy = time.perf_counter() - t0

print(f"Python loops: {t_loops*1000:8.1f} ms")
print(f"NumPy @     : {t_numpy*1000:8.3f} ms   → about {t_loops / t_numpy:,.0f}× faster (same answer: {np.allclose(C, C2)})")
"""),
md("*How many times faster was NumPy? (Module 1 explains why.)*"),

# ── Part F ──
md("""
---
## Part F · Your First Real AI — on the CPU  *(Unit 0.C)*

A 784 → 128 → 10 network that reads handwritten digits, trained with PyTorch.
Everything you learned is here: tensors (B), neurons and layers (C, E), a loss and gradient descent (D).

We **time every epoch**. Keep this number — in Module 2 you will run the same thing on a GPU.
"""),
code("""
import torch
from torch import nn
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

to_tensor = transforms.ToTensor()          # pixels 0..255 → floats 0..1
train_data = datasets.MNIST("data", train=True,  download=True, transform=to_tensor)
test_data  = datasets.MNIST("data", train=False, download=True, transform=to_tensor)
train_loader = DataLoader(train_data, batch_size=64, shuffle=True)
test_loader  = DataLoader(test_data,  batch_size=1000)

model = nn.Sequential(
    nn.Flatten(),              # 28×28 → 784
    nn.Linear(784, 128),       # layer 1: a (128 × 784) matrix
    nn.ReLU(),                 # the bend
    nn.Linear(128, 10),        # layer 2: 10 scores, one per digit
)
loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.1)

print(model)
print("Parameters (knobs):", sum(p.numel() for p in model.parameters()))
"""),
code("""
device = "cpu"     # deliberately the CPU for now
model.to(device)

for epoch in range(3):
    start = time.perf_counter()
    model.train()
    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)
        scores = model(images)                 # 1. predict
        loss = loss_fn(scores, labels)         # 2. measure the loss
        optimizer.zero_grad()
        loss.backward()                        # 3. gradients (backpropagation)
        optimizer.step()                       # 4. nudge every weight
    seconds = time.perf_counter() - start

    model.eval(); correct = 0
    with torch.no_grad():
        for images, labels in test_loader:
            correct += (model(images.to(device)).argmax(1) == labels.to(device)).sum().item()
    print(f"epoch {epoch + 1}: loss {loss.item():.3f}   test accuracy {correct / len(test_data):.1%}   time {seconds:.1f} s")
"""),
md("Let's see the trained network read some digits it has **never seen**:"),
code("""
images, labels = next(iter(test_loader))
with torch.no_grad():
    guesses = model(images[:10]).argmax(1)

plt.figure(figsize=(10, 1.8))
for i in range(10):
    plt.subplot(1, 10, i + 1); plt.imshow(images[i, 0], cmap="gray"); plt.axis("off")
    plt.title(f"{guesses[i].item()}", color="green" if guesses[i] == labels[i] else "red")
plt.suptitle("The network's guesses (green = right, red = wrong)"); plt.show()
"""),
md("""
### ✏️ YOUR TURN (F) — record your results
| | Your value |
|---|---|
| Test accuracy after 3 epochs | |
| Seconds per epoch on the CPU | |
| Parameters in the model | |

Then: change `nn.Linear(784, 128)` and `nn.Linear(128, 10)` to use **512** hidden neurons and re-run both cells. What happens to the time per epoch?

*Your answers:*

---
## 🎓 Wrap-up
- AI = numbers in → multiply-adds (neurons, layers = matrix multiplies) → a loss → gradient descent nudges the weights.
- Even this small network did about **1 lakh multiply-adds per image**, for 60,000 images, every epoch.
- **Next — Module 1: Why Is AI So Hungry?** You'll count the work in real models and see why the CPU starts to struggle.
"""),
]

build("Lab0_AI_Basics.ipynb", "Lab 0", cells, gpu=False)
