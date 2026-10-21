from common import md, code, how_to_run, build, FOOTHOLD

cells = [
md(f"""
# 🧠 Lab 0 — AI Basics, by Hand and in Code
**Foothold · GPU Computing for AI · Module 0: What Is AI, Really?**

In the Foothold lessons you *played* with each idea. In this lab you *write the code* for it — the same examples, the same numbers — and finish by training a real neural network that reads handwritten digits.

| Part | What you do | Goes with Foothold unit |
|---|---|---|
| A | Let Python search for the best pass/fail cut-off | 0.1 Rules vs Learning |
| B | Meet the MNIST digits; look inside a real image, a sentence and a tensor | 0.2 Everything Is Numbers |
| C | Build a neuron with a loop, then with `np.dot` | 0.3 The Neuron |
| D | Gradient descent from scratch | 0.4 Learning = Reducing Error |
| E | Prove that a layer is a matrix multiply | 0.5 Layers = Matrix Multiplication |
| F | Train a digit-reading network on the **CPU** and time it | 0.C Capstone |

⏱️ About 90 minutes. Course site: {FOOTHOLD}

💬 **Every code cell is commented.** Lines starting with `#` (and anything after a `#` on a line) are notes for you — Python ignores them. Read them before you run the cell.
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
import numpy as np                 # NumPy: arrays of numbers and fast maths on them ("np" is its short name)
import matplotlib.pyplot as plt    # Matplotlib: draws charts and pictures ("plt" is its short name)
import time                        # time: we use its stopwatch, time.perf_counter()

# Print arrays neatly: wide lines, 3 decimal places, no 1e-05 style numbers
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
# The data: three lists, lined up position by position (student 0 is SNEHA, 0.5 hours, failed)
names  = ["SNEHA","ARUN","ARJUN","DIVYA","RAHUL","VIJAY","NISHA","KARTHIK","MEENA","ANU","PRIYA","LAKSHMI"]
hours  = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.0, 3.5, 4.0, 4.5, 5.5, 6.0]   # study hours per day (the feature)
passed = [0,   0,   0,   0,   0,   0,   1,   1,   1,   1,   1,   1  ]   # 1 = passed, 0 = failed (the label)

def my_rule(h):
    # ✏️ a hand-written rule: PASS (1) if hours >= 5, otherwise FAIL (0)
    return 1 if h >= 5 else 0

# "correct" counts EVERY right prediction: a correct PASS and a correct FAIL both count
correct = 0
for name, h, p in zip(names, hours, passed):     # zip walks through the three lists together
    guess = my_rule(h)                           # what our rule predicts for this student
    ok = guess == p                              # True if the prediction matches what really happened
    correct += ok                                # True counts as 1, False as 0
    print(f"{name:8s} {h:3.1f} h   rule says {'PASS' if guess else 'FAIL'}   actually {'PASS' if p else 'FAIL'}   {'✓' if ok else '✗'}")
print(f"\\nMy hand-written rule gets {correct} / {len(hours)} right")
"""),
md("""
Now let the machine **learn** the cut-off: try every candidate, score it against the real answers, keep the best.
This loop *is* learning, in its simplest form.
"""),
code("""
candidates = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0]   # every cut-off we will try
best_cut, best_score = None, -1                  # nothing found yet

for cut in candidates:
    # score = how many students the rule "PASS if hours >= cut" gets right
    score = sum(1 for h, p in zip(hours, passed) if (1 if h >= cut else 0) == p)
    print(f"cut-off {cut:>3}: {score:2d} / 12")
    if score > best_score:            # better than anything so far? remember it (ties keep the FIRST one)
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

### First, what is MNIST?
**MNIST** (say "em-nist") is the most famous practice dataset in AI — the "Hello, World!" of machine learning.

- It is a collection of **70,000 small pictures of handwritten digits, 0 to 9**, written by about 500 different people (American high-school students and census-office staff).
- Each picture is **28 × 28 pixels, black-and-white (grey-scale)**: one number per pixel, from 0 (black) to 255 (white). So one picture = 28 × 28 = **784 numbers**.
- Every picture comes with its **label**: the correct answer, i.e. which digit the person meant to write.
- It is split into **60,000 training images** (the model learns from these) and **10,000 test images** (kept aside to check the model on digits it has never seen).
- The name stands for *Modified National Institute of Standards and Technology* — the US agency whose handwriting collections it was made from, in 1998.

**Why everyone starts with it:** it is free, small (about 11 MB), quick to train on even a laptop, and the task is easy to understand — *look at a picture, say which digit it is*. Yet it is a real AI problem: nobody can write exact rules for every person's handwriting (Unit 0.1!). Exactly the same ideas scale up to face unlock, number-plate reading and cheque scanning.

We get MNIST from **torchvision**, PyTorch's companion library that can download famous datasets with one line. The first run downloads it into a folder called `data` (a few seconds).
"""),
code("""
from torchvision import datasets       # torchvision knows how to download famous datasets like MNIST

# Download the 60,000 TRAINING images into the folder "data" (only the first time; after that it is reused)
mnist = datasets.MNIST(root="data", train=True, download=True)
print("Number of training images:", len(mnist))

# Draw the first 10 pictures with their labels, so you can see what MNIST looks like
plt.figure(figsize=(10, 1.6))                    # a wide, short drawing area (width, height in inches)
for i in range(10):
    image, label = mnist[i]                      # each item is a pair: (the picture, the correct digit)
    plt.subplot(1, 10, i + 1)                    # 1 row, 10 columns: draw in box number i+1
    plt.imshow(image, cmap="gray")               # show the picture in grey-scale
    plt.title(str(label))                        # write its label above it
    plt.axis("off")                              # hide the x/y axis numbers
plt.suptitle("The first 10 MNIST training images and their labels")
plt.show()                                       # display the drawing
"""),
md("""
Now look at **one** picture the way the computer sees it.
"""),
code("""
image, label = mnist[0]          # the very first training image and its label
pixels = np.array(image)         # turn the picture into a NumPy array: a 28 × 28 grid of numbers

print("This digit is a:", label)
# .shape = the size of each dimension; .min()/.max() = the smallest and largest number inside
print("Shape:", pixels.shape, "  smallest:", pixels.min(), "  largest:", pixels.max())
"""),
md("Print the raw numbers. Squint — you can see the digit drawn in the numbers themselves!"),
code("""
np.set_printoptions(linewidth=250)   # allow very long lines, so each of the 28 rows fits on one line
print(pixels)                        # 28 rows × 28 numbers: 0 = black background, up to 255 = white ink
"""),
code("""
# Turn the 784 numbers back into a picture
plt.figure(figsize=(3, 3))           # make a small 3 × 3-inch drawing area
plt.imshow(pixels, cmap="gray")      # colour each number as a shade of grey: 0 = black, 255 = white
plt.title(f"Label: {label}")         # show the correct answer (the label) above the picture
plt.axis("off")                      # hide the axis ticks and numbers — we only want the picture
plt.show()                           # display it
"""),
md("""
**Text becomes numbers too.** Real chatbots use a dictionary of ~1 lakh tokens; here is a tiny one so you can see the idea.
"""),
code("""
# A tiny "dictionary" (vocabulary): each word (token) has an ID number
vocab = {"i": 41, "love": 893, "mangoes": 2711, "the": 5, "bus": 1204, "is": 12, "late": 3330}

sentence = "I love mangoes"
tokens = sentence.lower().split()            # lower-case, then split at spaces → ['i', 'love', 'mangoes']
ids = [vocab.get(t, 0) for t in tokens]      # look up each token's ID; 0 = [UNK], an unknown word
print(tokens, "→", ids)
"""),
md("""
**Tensors and shapes.** A batch of 32 MNIST images stacked together is one 3-D tensor. Its *shape* says how the numbers are arranged.
"""),
code("""
# Take the first 32 pictures, turn each into a 28 × 28 array, and stack them into one block
batch = np.stack([np.array(mnist[i][0]) for i in range(32)])   # mnist[i][0] = the picture of item i
print("One image:", pixels.shape, " =", pixels.size, "numbers")  # .size = total count of numbers
print("A batch  :", batch.shape, " =", batch.size, "numbers")    # (32, 28, 28): 32 images, each 28 × 28
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
x = np.array([1, 1, 0])          # inputs: sunny? (1 = yes)  exam tomorrow? (1 = yes)  friends going? (0 = no)
w = np.array([2.0, -4.0, 1.5])   # weights: how much each input matters (negative = pushes towards NO)
b = -1.0                         # bias: how easily the neuron says YES

# the loop way: one multiply-add (MAC) at a time
z_loop = b                       # start from the bias
for i in range(len(x)):          # for each input...
    z_loop += w[i] * x[i]        # ...multiply by its weight and add it on

# the NumPy way: same arithmetic, one call (np.dot = multiply pairwise and add everything up)
z_dot = np.dot(w, x) + b

print("z (loop)   =", z_loop)
print("z (np.dot) =", z_dot)
print("Decision:", "GO to the match" if z_dot >= 0 else "STAY home")   # step activation: z >= 0 means YES
"""),
md("**Activation functions** bend the output. Plot the three from the lesson:"),
code("""
z = np.linspace(-5, 5, 200)          # 200 evenly spaced values from -5 to 5 (the x-axis)
step    = (z >= 0).astype(float)     # step: 1 if z >= 0, else 0
sigmoid = 1 / (1 + np.exp(-z))       # sigmoid: squashes any z into the range 0..1
relu    = np.maximum(0, z)           # ReLU: negative → 0, positive stays the same

plt.figure(figsize=(9, 2.8))         # one wide drawing area for three small charts
for k, (name, y) in enumerate([("Step", step), ("Sigmoid", sigmoid), ("ReLU", relu)]):
    plt.subplot(1, 3, k + 1)         # 1 row, 3 columns: draw in box k+1
    plt.plot(z, y)                   # draw the curve
    plt.title(name)                  # name it
    plt.grid(alpha=0.3)              # faint grid lines
plt.tight_layout()                   # stop the three charts from overlapping
plt.show()
"""),
md("Now the six students from the lesson, whose results depend on **both** hours and attendance."),
code("""
students = ["KAVYA", "RAVI", "SURESH", "GEETHA", "IMRAN", "POOJA"]
X = np.array([[4, 40], [2, 95], [5, 90], [1, 60], [3.5, 85], [2.5, 50]])   # one row per student: hours, attendance %
y = np.array([0, 1, 1, 0, 1, 0])                                           # the real results: 1 = pass, 0 = fail

w = np.array([1.0, 0.05])     # ✏️ weights for hours, attendance
b = -6.5                      # ✏️ bias

z = X @ w + b                 # @ = matrix multiply: one weighted sum per student, all six in one go
pred = (z >= 0).astype(int)   # step activation: 1 (PASS) where z >= 0, else 0 (FAIL)
for s, zi, p, t in zip(students, z, pred, y):
    print(f"{s:7s} z = {zi:6.2f} → {'PASS' if p else 'FAIL'}  {'✓' if p == t else '✗'}")
print("Correct:", (pred == y).sum(), "/ 6")   # count how many predictions match the real results
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
hours = np.array([1, 2, 3, 4, 5])          # 5 students' study hours
marks = np.array([30, 45, 55, 70, 80])     # their marks

def loss_fn(w):
    # how wrong is the model for this w? mean squared error = average of (actual - predicted)²
    pred = w * hours + 20
    return np.mean((marks - pred) ** 2)

def grad_fn(w):
    # the slope of the loss at this w (from calculus): tells us which way is downhill
    pred = w * hours + 20
    return np.mean(-2 * hours * (marks - pred))

def train(lr, epochs=15, w=0.0, verbose=False):
    # gradient descent: start at w, then take "epochs" small steps downhill of size lr × slope
    history = []                               # remember the loss after every step, to plot it later
    for epoch in range(epochs):
        history.append(loss_fn(w))
        if verbose:
            print(f"epoch {epoch:2d}  w = {w:8.3f}  loss = {loss_fn(w):10.2f}  grad = {grad_fn(w):9.2f}")
        w = w - lr * grad_fn(w)                # the nudge: move w a little against the slope
    return w, history

w_final, _ = train(lr=0.02, epochs=8, verbose=True)   # learning rate 0.02, 8 steps, print each one
"""),
md("Compare learning rates — the balancing act from the lesson:"),
code("""
plt.figure(figsize=(7, 3.5))
for lr in [0.005, 0.02, 0.08, 0.1]:                   # four learning rates to compare
    w_end, hist = train(lr, epochs=15)                # train with each one
    plt.plot(hist, marker="o", label=f"lr = {lr}  (final w = {w_end:.2f})")   # one line per learning rate
plt.yscale("log")                                     # log scale, so huge and tiny losses both fit
plt.xlabel("epoch"); plt.ylabel("loss (log scale)")   # axis labels
plt.legend(); plt.grid(alpha=0.3)                     # the colour key and faint grid lines
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
import torch                                   # PyTorch: the AI library we use for real networks

# Made-up data: a batch of 64 "images" of 784 numbers each, and random weights for 128 neurons
X = np.random.rand(64, 784).astype(np.float32)           # 64 rows (images) × 784 columns (pixels)
W = np.random.randn(128, 784).astype(np.float32) * 0.05  # one row of 784 weights per neuron
b = np.random.randn(128).astype(np.float32) * 0.05       # one bias per neuron

Y_numpy = X @ W.T + b                      # the maths, by hand: W.T = W turned on its side (transpose)

layer = torch.nn.Linear(784, 128)          # PyTorch's ready-made layer: 784 inputs → 128 neurons...
with torch.no_grad():                      # (no_grad: we are not training, so don't track gradients)
    layer.weight.copy_(torch.from_numpy(W))    # ...given OUR weights
    layer.bias.copy_(torch.from_numpy(b))      # ...and OUR biases
    Y_torch = layer(torch.from_numpy(X)).numpy()   # run the batch through it, convert back to NumPy

print("Output shape:", Y_numpy.shape)      # (64, 128): 128 outputs for each of the 64 images
print("Biggest difference between NumPy and PyTorch:", np.abs(Y_numpy - Y_torch).max())
print("MACs for this one layer, one batch:", f"{64 * 784 * 128:,}")   # images × inputs × neurons
"""),
md("""
The difference is essentially zero (tiny rounding only). **`nn.Linear` is a matrix multiply.** That is the operation GPUs are built to do fast.

### ✏️ YOUR TURN (E)
Time the plain-Python triple loop against `@` for a smaller case. Run it and note the ratio.
"""),
code("""
n = 60                                                 # small matrices: 60 × 60
A = np.random.rand(n, n); B = np.random.rand(n, n)     # two random matrices

t0 = time.perf_counter()                               # start the stopwatch
# plain Python: every cell C[i][j] = sum over k of A[i,k] × B[k,j], one multiply-add at a time
C = [[sum(A[i, k] * B[k, j] for k in range(n)) for j in range(n)] for i in range(n)]
t_loops = time.perf_counter() - t0                     # stop: time taken by the loops

t0 = time.perf_counter(); C2 = A @ B; t_numpy = time.perf_counter() - t0   # the same product with NumPy

print(f"Python loops: {t_loops*1000:8.1f} ms")         # × 1000 turns seconds into milliseconds
# np.allclose checks that both answers are the same (apart from tiny rounding)
print(f"NumPy @     : {t_numpy*1000:8.3f} ms   → about {t_loops / t_numpy:,.0f}× faster (same answer: {np.allclose(C, C2)})")
"""),
md("*How many times faster was NumPy? (Module 1 explains why.)*"),

# ── Part F ──
md("""
---
## Part F · Your First Real AI — on the CPU  *(Unit 0.C)*

A 784 → 128 → 10 network that reads MNIST handwritten digits, trained with PyTorch.
Everything you learned is here: tensors (B), neurons and layers (C, E), a loss and gradient descent (D).

We **time every epoch**. Keep this number — in Module 2 you will run the same thing on a GPU.
"""),
code("""
import torch
from torch import nn                             # nn = PyTorch's building blocks for networks
from torchvision import datasets, transforms
from torch.utils.data import DataLoader          # DataLoader serves the data in batches

to_tensor = transforms.ToTensor()          # converts each picture to a tensor; pixels 0..255 → floats 0..1
train_data = datasets.MNIST("data", train=True,  download=True, transform=to_tensor)   # 60,000 to learn from
test_data  = datasets.MNIST("data", train=False, download=True, transform=to_tensor)   # 10,000 kept for testing
train_loader = DataLoader(train_data, batch_size=64, shuffle=True)   # batches of 64, in a new random order each epoch
test_loader  = DataLoader(test_data,  batch_size=1000)               # big batches are fine for testing

model = nn.Sequential(         # the layers, applied one after another
    nn.Flatten(),              # 28×28 picture → one row of 784 numbers
    nn.Linear(784, 128),       # layer 1: 128 neurons, a (128 × 784) weight matrix
    nn.ReLU(),                 # the bend (activation)
    nn.Linear(128, 10),        # layer 2: 10 scores, one per digit 0–9; the biggest score is the guess
)
loss_fn = nn.CrossEntropyLoss()                            # the loss: how wrong are the 10 scores?
optimizer = torch.optim.SGD(model.parameters(), lr=0.1)    # gradient descent on every weight, learning rate 0.1

print(model)
print("Parameters (knobs):", sum(p.numel() for p in model.parameters()))   # count every weight and bias
"""),
code("""
device = "cpu"     # deliberately the CPU for now
model.to(device)   # put the model's weights on that device

for epoch in range(3):                         # 3 epochs = 3 full passes over the 60,000 images
    start = time.perf_counter()                # start the stopwatch for this epoch
    model.train()                              # switch the model to training mode
    for images, labels in train_loader:        # one batch of 64 images (and their labels) at a time
        images, labels = images.to(device), labels.to(device)
        scores = model(images)                 # 1. predict
        loss = loss_fn(scores, labels)         # 2. measure the loss
        optimizer.zero_grad()                  #    (clear the previous batch's gradients)
        loss.backward()                        # 3. gradients (backpropagation)
        optimizer.step()                       # 4. nudge every weight
    seconds = time.perf_counter() - start      # stop the stopwatch

    # Check on the 10,000 test images the model has never trained on
    model.eval(); correct = 0                  # evaluation mode; reset the counter
    with torch.no_grad():                      # no training here, so no gradients needed
        for images, labels in test_loader:
            # argmax(1) = the digit with the highest score; count how many match the labels
            correct += (model(images.to(device)).argmax(1) == labels.to(device)).sum().item()
    print(f"epoch {epoch + 1}: loss {loss.item():.3f}   test accuracy {correct / len(test_data):.1%}   time {seconds:.1f} s")
"""),
md("Let's see the trained network read some digits it has **never seen**:"),
code("""
images, labels = next(iter(test_loader))          # grab the first batch of test images
with torch.no_grad():
    guesses = model(images[:10]).argmax(1)        # the network's guess for the first 10

plt.figure(figsize=(10, 1.8))
for i in range(10):
    plt.subplot(1, 10, i + 1)                     # 1 row, 10 boxes: draw in box i+1
    plt.imshow(images[i, 0], cmap="gray")         # images[i, 0] = picture i (0 = its only grey channel)
    plt.axis("off")
    # write the guess above the picture: green if right, red if wrong
    plt.title(f"{guesses[i].item()}", color="green" if guesses[i] == labels[i] else "red")
plt.suptitle("The network's guesses (green = right, red = wrong)")
plt.show()
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
