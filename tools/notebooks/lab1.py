from common import md, code, how_to_run, build, FOOTHOLD

cells = [
md(f"""
# 🧠 Lab 1 — AI Basics, by Hand and in Code
**Foothold · GPU Computing for AI · Module 1: What Is AI, Really?**

In the Foothold lessons you *played* with each idea. In this lab you *write the code* for it — the same examples, the same numbers — and finish by training a real neural network that reads handwritten digits.

Every part follows one class: **Nila's class** — their study hours, attendance, marks and grades.

| Part | What you do | Goes with Foothold unit |
|---|---|---|
| A | Let Python search for the best pass/fail cut-off | 1.1 Rules vs Learning |
| B | Meet the MNIST digits; look inside a real image, a sentence and a tensor | 1.2 Everything Is Numbers |
| C | Build a neuron with a loop, then with `np.dot`; see why it needs a bias | 1.3 The Neuron |
| D | The nudge test, then gradient descent from scratch | 1.4 Learning = Reducing Error |
| E | Build the B-grade network, let training find its cut-offs, and prove that a layer is a matrix multiply | 1.5 Layers = Matrix Multiplication |
| F | Train a network that reads handwritten marks, on the **CPU**, and time it | 1.C Capstone |

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
print("Ready! NumPy version:", np.__version__)   # show that everything loaded, and NumPy's version
"""),

# ── Part A ──
md("""
---
## Part A · Rules vs Learning  *(Unit 1.1)*

Last year's 12 students: study hours per day, and whether they passed (1) or failed (0).
First **you** write a rule, then Python **learns** one by trying every cut-off — exactly the search you watched in the lesson.
"""),
code("""
# The data: three lists, lined up position by position (student 0 is SNEHA, 0.5 hours, failed)
names  = ["SNEHA","ARUN","ARJUN","DIVYA","RAHUL","VIJAY","NISHA","KARTHIK","MEENA","ANU","PRIYA","LAKSHMI"]
hours  = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.0, 3.5, 4.0, 4.5, 5.5, 6.0]   # study hours per day (the feature)
passed = [0,   0,   0,   0,   0,   0,   1,   1,   1,   1,   1,   1  ]   # 1 = passed, 0 = failed (the label)

def my_rule(h):   # our own rule: give it hours, it answers 1 (PASS) or 0 (FAIL)
    # ✏️ a hand-written rule: PASS (1) if hours >= 5, otherwise FAIL (0)
    return 1 if h >= 5 else 0

# "correct" counts EVERY right prediction: a correct PASS and a correct FAIL both count
correct = 0
for name, h, p in zip(names, hours, passed):     # zip walks through the three lists together
    guess = my_rule(h)                           # what our rule predicts for this student
    ok = guess == p                              # True if the prediction matches what really happened
    correct += ok                                # True counts as 1, False as 0
    print(f"{name:8s} {h:3.1f} h   rule says {'PASS' if guess else 'FAIL'}   actually {'PASS' if p else 'FAIL'}   {'✓' if ok else '✗'}")   # one line per student: hours, the rule's answer, the truth, and a tick or cross
print(f"\\nMy hand-written rule gets {correct} / {len(hours)} right")   # the score (the backslash-n prints an empty line first)
"""),
md("""
Now let the machine **learn** the cut-off: try every candidate, score it against the real answers, keep the best.
This loop *is* learning, in its simplest form.
"""),
code("""
candidates = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0]   # every cut-off we will try
best_cut, best_score = None, -1                  # nothing found yet

for cut in candidates:   # try every candidate cut-off, one at a time
    # score = how many students the rule "PASS if hours >= cut" gets right
    score = sum(1 for h, p in zip(hours, passed) if (1 if h >= cut else 0) == p)
    print(f"cut-off {cut:>3}: {score:2d} / 12")   # show this cut-off's score
    if score > best_score:            # better than anything so far? remember it (ties keep the FIRST one)
        best_cut, best_score = cut, score   # remember it: the best so far

print(f"\\nLearned rule: PASS if hours >= {best_cut}  ({best_score} / 12 correct)")   # the winner (the backslash-n prints an empty line first)
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
## Part B · Everything Is Numbers  *(Unit 1.2)*

Nila's teacher would love a computer that reads the marks handwritten on answer sheets. To build one, we need thousands of examples of handwritten digits, each with the right answer. That is exactly what MNIST is.

### First, what is MNIST?
**MNIST** (say "em-nist") is the most famous practice dataset in AI — the "Hello, World!" of machine learning.

- It is a collection of **70,000 small pictures of handwritten digits, 0 to 9**, written by about 500 different people (American high-school students and census-office staff).
- Each picture is **28 × 28 pixels, black-and-white (grey-scale)**: one number per pixel, from 0 (black) to 255 (white). So one picture = 28 × 28 = **784 numbers**.
- Every picture comes with its **label**: the correct answer, i.e. which digit the person meant to write.
- It is split into **60,000 training images** (the model learns from these) and **10,000 test images** (kept aside to check the model on digits it has never seen).
- The name stands for *Modified National Institute of Standards and Technology* — the US agency whose handwriting collections it was made from, in 1998.

**Why everyone starts with it:** it is free, small (about 11 MB), quick to train on even a laptop, and the task is easy to understand — *look at a picture, say which digit it is*. Yet it is a real AI problem: nobody can write exact rules for every person's handwriting (Unit 1.1!). Exactly the same ideas scale up to face unlock, number-plate reading and cheque scanning.

We get MNIST from **torchvision**, PyTorch's companion library that can download famous datasets with one line. The first run downloads it into a folder called `data` (a few seconds).
"""),
code("""
from torchvision import datasets       # torchvision knows how to download famous datasets like MNIST

# Download the 60,000 TRAINING images into the folder "data" (only the first time; after that it is reused)
mnist = datasets.MNIST(root="data", train=True, download=True)
print("Number of training images:", len(mnist))   # how many pictures we have

# Draw the first 10 pictures with their labels, so you can see what MNIST looks like
plt.figure(figsize=(10, 1.6))                    # a wide, short drawing area (width, height in inches)
for i in range(10):   # the first 10 pictures
    image, label = mnist[i]                      # each item is a pair: (the picture, the correct digit)
    plt.subplot(1, 10, i + 1)                    # 1 row, 10 columns: draw in box number i+1
    plt.imshow(image, cmap="gray")               # show the picture in grey-scale
    plt.title(str(label))                        # write its label above it
    plt.axis("off")                              # hide the x/y axis numbers
plt.suptitle("The first 10 MNIST training images and their labels")   # a title over all 10 pictures
plt.show()                                       # display the drawing
"""),
md("""
Now look at **one** picture the way the computer sees it.
"""),
code("""
image, label = mnist[0]          # the very first training image and its label
pixels = np.array(image)         # turn the picture into a NumPy array: a 28 × 28 grid of numbers

print("This digit is a:", label)   # the digit this picture shows
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
**Text becomes numbers too.** At the end of term Nila writes feedback on the course. Real chatbots use a dictionary of ~1 lakh tokens; here is a tiny one so you can see the idea.
"""),
code("""
# A tiny "dictionary" (vocabulary): each word (token) has an ID number
vocab = {"i": 41, "love": 893, "maths": 2711, "the": 5, "class": 1204, "was": 12, "fun": 3330}

sentence = "I love maths"            # Nila's feedback on the course
tokens = sentence.lower().split()            # lower-case, then split at spaces → ['i', 'love', 'maths']
ids = [vocab.get(t, 0) for t in tokens]      # look up each token's ID; 0 = [UNK], an unknown word
print(tokens, "→", ids)   # show the words and their ID numbers
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
## Part C · The Neuron  *(Unit 1.3)*

A neuron: multiply each input by its weight, add them up, add the bias, then decide.

$$z = w_1x_1 + w_2x_2 + \\dots + w_nx_n + b$$

First with a plain Python loop — exactly what the hardware does — then with NumPy's `np.dot`.
"""),
code("""
# Nila's question tonight: go to the IPL match (YES) or stay home and study (NO)?
# The three inputs, written as 1 (yes) or 0 (no): sunny? yes · exam tomorrow? yes · friends going? no
x = np.array([1, 1, 0])
# How much each input matters: sunny pulls towards GO (+2), an exam pulls hard towards STAY (-4), friends pull a little towards GO (+1.5)
w = np.array([2.0, -4.0, 1.5])
b = -1.0                         # the bias: one fixed number added at the end (here it leans slightly towards STAY)

# The loop way: one multiply-add (MAC) at a time, exactly the way the hardware does it
z_loop = b                       # start the running total at the bias
for i in range(len(x)):          # visit the inputs one by one: i = 0, then 1, then 2
    z_loop += w[i] * x[i]        # multiply this input by its weight and add the result to the running total

# The NumPy way: np.dot multiplies the pairs and adds them all up in one call; then we add the bias
z_dot = np.dot(w, x) + b

print("z (loop)   =", z_loop)    # show the total the loop worked out
print("z (np.dot) =", z_dot)     # show the total np.dot worked out: it should be the same number
# Step activation: if z is 0 or more the answer is YES (go to the match), otherwise NO (stay home)
print("Decision:", "GO to the match" if z_dot >= 0 else "STAY home")
"""),
md("""
### Why does a neuron need a bias?
Back to the 12 students from Part A, with **one** input: study hours. The neuron computes `z = w × hours + b` and says PASS when `z ≥ 0`.
It switches from FAIL to PASS exactly where `z = 0`, that is at **hours = −b ÷ w**. That switching point is the neuron's **cut-off**.

Run it twice: first with **no bias** (`b = 0`), then with `b = −3`.
"""),
code("""
# The 12 students from Part A again. New names (hrs, res) because Part D uses "hours" for different data.
hrs = np.array([0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.0, 3.5, 4.0, 4.5, 5.5, 6.0])   # study hours per day
res = np.array([0,   0,   0,   0,   0,   0,   1,   1,   1,   1,   1,   1  ])   # real result: 1 = passed, 0 = failed

def one_input_neuron(w, b):               # a neuron with ONE input (hours); w and b are its two knobs
    z = w * hrs + b                       # weighted sum for all 12 students at once: weight × hours + bias
    pred = (z >= 0).astype(int)           # step activation: 1 (PASS) where z is 0 or more, else 0 (FAIL)
    correct = (pred == res).sum()         # compare with the real results and count how many match
    cut = -b / w + 0.0                    # the cut-off is where z = 0, i.e. hours = -b ÷ w (+ 0.0 stops it printing "-0.0")
    # print the two knobs, the cut-off they produce, and the score out of 12
    print(f"w = {w}, b = {b:5}:  cut-off = -b / w = {cut:4.1f} hours   correct = {correct} / 12")

one_input_neuron(w=1.0, b=0.0)    # no bias: z = hours, which is >= 0 for EVERY student, so everyone "passes"
one_input_neuron(w=3.0, b=0.0)    # a bigger weight doesn't help: the cut-off is still stuck at 0 hours
one_input_neuron(w=1.0, b=-3.0)   # with a bias: "start 3 hours in debt", pass once the debt is paid off
"""),
md("""
Without a bias, `z = w × hours` is 0 only at 0 hours, so the cut-off can never move, whatever `w` is. **The weight says how much each hour counts; the bias says where the pass mark is.** With `b = −3` the neuron reproduces the rule the machine learned in Part A (pass at 3 hours, 11 / 12).

### ✏️ YOUR TURN (C1)
1. Which `b` puts the cut-off at 4 hours when `w = 1`? Which `b` does it when `w = 2`? Check both with `one_input_neuron`.
2. Try `w = -1.0, b = 3.0`. Where is the cut-off now, and which side of it says PASS?

*Your answers:*
"""),
md("**Activation functions** bend the output. Plot the three from the lesson:"),
code("""
z = np.linspace(-5, 5, 200)          # 200 evenly spaced z values from -5 to 5 (the bottom axis of the charts)
step    = (z >= 0).astype(float)     # step: 1 if z >= 0, else 0 (a hard YES/NO)
sigmoid = 1 / (1 + np.exp(-z))       # sigmoid: squashes any z into the range 0..1 (a smooth "how sure")
relu    = np.maximum(0, z)           # ReLU: a negative z becomes 0, a positive z stays the same

plt.figure(figsize=(9, 2.8))         # one wide drawing area (9 × 2.8 inches) to hold three small charts
# Go through the three activations: k counts 0, 1, 2 and (name, y) is each one's name and output values
for k, (name, y) in enumerate([("Step", step), ("Sigmoid", sigmoid), ("ReLU", relu)]):
    plt.subplot(1, 3, k + 1)         # split the area into 1 row × 3 boxes and draw in box number k+1
    plt.plot(z, y)                   # draw the curve: z along the bottom, the activation's output going up
    plt.title(name)                  # write the activation's name above its box
    plt.grid(alpha=0.3)              # add faint grid lines so values are easier to read
plt.tight_layout()                   # space the three charts so they don't overlap
plt.show()                           # display the finished picture
"""),
md("Now the six students from the lesson, whose results depend on **both** hours and attendance."),
code("""
students = ["KAVYA", "RAVI", "SURESH", "GEETHA", "IMRAN", "POOJA"]          # the six names, used only for printing
X = np.array([[4, 40], [2, 95], [5, 90], [1, 60], [3.5, 85], [2.5, 50]])   # one row per student: hours, attendance %
y = np.array([0, 1, 1, 0, 1, 0])                                           # the real results: 1 = pass, 0 = fail

w = np.array([1.0, 0.05])     # ✏️ weights: each hour counts 1.0, each attendance % counts 0.05
b = -6.5                      # ✏️ bias: sets where the pass mark sits

z = X @ w + b                 # @ = matrix multiply: one weighted sum per student, all six in one go
pred = (z >= 0).astype(int)   # step activation: 1 (PASS) where z >= 0, else 0 (FAIL)
for s, zi, p, t in zip(students, z, pred, y):    # walk through name, z, prediction and real result together
    # print the student's z, the neuron's decision, and a tick if it matches what really happened
    print(f"{s:7s} z = {zi:6.2f} → {'PASS' if p else 'FAIL'}  {'✓' if p == t else '✗'}")
print("Correct:", (pred == y).sum(), "/ 6")   # count how many predictions match the real results
"""),
md("""
### ✏️ YOUR TURN (C2)
1. Set `w = np.array([1.0, 0.0])` (ignore attendance). How many are right now? Which students go wrong?
2. A neuron reading a 28 × 28 image has how many weights? How many multiplications per image?

*Your answers:*
"""),

# ── Part D ──
md("""
---
## Part D · Gradient Descent  *(Unit 1.4)*

Five of Nila's classmates studied 1, 2, 3, 4 and 5 hours and scored 30, 45, 55, 70 and 80. Model: `marks = w × hours + 20`. It has **one knob**, `w`. We want the `w` that makes the **mean squared error** (the loss) smallest.

**Step 1 · Score some guesses.** Compute the loss for a few settings of the knob.
"""),
code("""
hours = np.array([1, 2, 3, 4, 5])          # 5 classmates' study hours
marks = np.array([30, 45, 55, 70, 80])     # the marks they really got

def loss_fn(w):                            # the score for one setting of the knob w (lower = better)
    pred = w * hours + 20                  # the model's predicted marks for all 5 students
    return np.mean((marks - pred) ** 2)    # error = real − predicted; square each one, then average them (MSE)

for w in [8, 10, 12, 14, 16]:              # five guesses for the knob
    print(f"w = {w:2d}   loss = {loss_fn(w):6.1f}")   # print each guess next to its loss
"""),
md("""
Down, then up again: the loss makes a **valley**, with its bottom near 12. With one knob we could try every setting. The network in Part F has 101,770 knobs, so trying them all is hopeless. We need to know **which way is downhill** from where we stand.

**Step 2 · The nudge test.** Move the knob a tiny bit (+0.1) and see how the loss changes. Change ÷ nudge = the **slope** (the gradient).
"""),
code("""
def nudge_slope(w, nudge=0.1):             # the nudge test at the point w
    # (loss a tiny step to the right − loss here) ÷ size of the step = the slope
    return (loss_fn(w + nudge) - loss_fn(w)) / nudge

def grad_fn(w):                            # the EXACT slope at w, from calculus (for this data it equals 22*w - 266)
    pred = w * hours + 20                  # the predictions for this w
    return np.mean(-2 * hours * (marks - pred))   # the calculus formula for the slope of the MSE

for w in [8, 16, 12.09]:                   # three places: left of the bottom, right of it, and at the bottom
    s = nudge_slope(w)                     # feel the slope where we stand
    # negative slope: going right lowers the loss; positive: going right raises it; near 0: flat ground
    advice = "increase w" if s < -5 else "decrease w" if s > 5 else "almost flat: at the bottom"
    # print the loss before and after the nudge, the nudge slope, the exact slope, and which way to move
    print(f"w = {w:5}:  loss {loss_fn(w):7.2f} -> {loss_fn(w + 0.1):7.2f}   nudge slope = {s:6.1f}   exact = {grad_fn(w):6.1f}   -> {advice}")
"""),
md("""
A negative slope means "going right makes the loss smaller", so increase `w`. A positive slope means decrease `w`. One rule covers both: **`new w = w − learning_rate × slope`**. The minus sign *is* "go downhill".

**Step 3 · Why a step neuron can't learn.** Try the nudge test on the pass/fail neuron from Part C (`w = 1`), nudging the **bias** by 0.01. With the step activation the loss is "fraction of students wrong"; with sigmoid it is the average squared gap between the output (0 to 1) and the real answer.
"""),
code("""
def step_loss(b):                                    # the loss of the STEP neuron for bias b (weight fixed at 1)
    pred = (1.0 * hrs + b >= 0).astype(int)          # hard PASS (1) / FAIL (0) for each of the 12 students
    return np.mean(pred != res)                      # the fraction of students it gets wrong

def sigmoid_loss(b):                                 # the loss of the same neuron with SIGMOID instead of step
    out = 1 / (1 + np.exp(-(1.0 * hrs + b)))         # a smooth "how sure" between 0 and 1 for each student
    return np.mean((out - res) ** 2)                 # the average squared gap from the real answer

b = -2.6                                             # where we stand: a bias of -2.6
for name, f in [("step", step_loss), ("sigmoid", sigmoid_loss)]:   # do the nudge test on both neurons
    s = (f(b + 0.01) - f(b)) / 0.01                  # nudge b by 0.01 and measure the slope
    print(f"{name:8s} loss {f(b):.4f} -> {f(b + 0.01):.4f}   slope = {s:.3f}")   # loss before, after, and the slope
"""),
md("""
The step loss doesn't move at all: a tiny nudge flips no PASS/FAIL answer, so the slope is 0 and gradient descent has **no direction**. Sigmoid always changes a little, so there is always a slope to follow. That is why real networks use smooth activations (sigmoid, ReLU).

**Step 4 · Walk downhill.** Repeat "feel the slope, take a step" from `w = 0`:
"""),
code("""
# Gradient descent: start at w, then take "epochs" steps, each one moving w by lr × slope against the slope
def train(lr, epochs=15, w=0.0, verbose=False):
    history = []                               # an empty list that will remember the loss at every step (for plotting)
    for epoch in range(epochs):                # repeat once for every step (epoch)
        history.append(loss_fn(w))             # write down how wrong the model is right now
        if verbose:                            # only when we asked for printing...
            # ...show the step number, the knob, the loss and the slope
            print(f"epoch {epoch:2d}  w = {w:8.3f}  loss = {loss_fn(w):10.2f}  grad = {grad_fn(w):9.2f}")
        w = w - lr * grad_fn(w)                # THE step: move w a little against the slope (downhill)
    return w, history                          # hand back the final knob and the list of losses

# Learning rate 0.02, 8 steps, print every one ("_" means "I don't need the loss list here")
w_final, _ = train(lr=0.02, epochs=8, verbose=True)
"""),
md("Compare learning rates — the balancing act from the lesson:"),
code("""
plt.figure(figsize=(7, 3.5))                          # a fresh drawing area, 7 × 3.5 inches
for lr in [0.005, 0.02, 0.08, 0.1]:                   # four learning rates to compare
    w_end, hist = train(lr, epochs=15)                # train with this one; keep the final w and the list of losses
    plt.plot(hist, marker="o", label=f"lr = {lr}  (final w = {w_end:.2f})")   # draw one line per learning rate
plt.yscale("log")                                     # log scale, so huge and tiny losses both fit on one chart
plt.xlabel("epoch"); plt.ylabel("loss (log scale)")   # label the bottom axis and the side axis
plt.legend(); plt.grid(alpha=0.3)                     # show the colour key and faint grid lines
plt.title("Too small crawls · just right settles · too big zig-zags or explodes")   # the chart's heading
plt.show()                                            # display the chart
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
## Part E · Why More Than One Neuron, and Why a Layer Is a Matrix Multiply  *(Unit 1.5)*

### E1 · Who got a B?
In Nila's college a **B grade means marks from 60 to 75**. One neuron has one cut-off, so it can only say "higher than X" or "lower than X". A B has two edges, so we split the question:

| Neuron | Asks | Weighted sum |
|---|---|---|
| 1 | at least 60? (YES for higher marks) | `z1 = 1 × m − 60` |
| 2 | 75 or below? (YES for lower marks) | `z2 = −1 × m + 75` |
| 3 | both yes? | `z3 = 1 × a1 + 1 × a2 − 1.5` |

Neurons 1 and 2 read the **same** input (the marks `m`), each with its own weight and bias: together they are a **layer**. Neuron 3 reads their answers `a1`, `a2`.

*Same idea, different world:* a room feels comfortable between 20 °C and 28 °C. That question also has two edges, so it needs the same three neurons.
"""),
code("""
def step(z):                               # the step activation
    return 1 if z >= 0 else 0              # 1 = YES when z is 0 or more, otherwise 0 = NO

def b_grade(m, activation=step):           # the 3-neuron B-grade network for marks m (step, unless told otherwise)
    z1 = 1 * m - 60                        # neuron 1, "at least 60?": weight +1, bias -60, so z1 >= 0 from 60 marks up
    z2 = -1 * m + 75                       # neuron 2, "75 or below?": weight -1, bias +75, so z2 >= 0 up to 75 marks
    a1, a2 = activation(z1), activation(z2)   # each neuron's answer, after its activation
    z3 = 1 * a1 + 1 * a2 - 1.5             # neuron 3, "both yes?": only a1 + a2 = 2 gets above 1.5
    return z1, a1, z2, a2, z3              # hand back every number so we can print the whole trace

print("marks |   z1  a1 |   z2  a2 |   z3  | answer")   # the table heading
for m in [52, 68, 81]:                     # three students: below the band, inside it, above it
    z1, a1, z2, a2, z3 = b_grade(m)        # run the network and unpack its five numbers
    # print one row: the two sums, their answers, z3, and B if z3 >= 0
    print(f"{m:5} | {z1:4} {a1:3} | {z2:4} {a2:3} | {z3:5} | {'B' if z3 >= 0 else 'NOT B'}")
"""),
md("""
Now **remove the activation**: each neuron passes on its raw sum `z` instead of a YES/NO answer.
"""),
code("""
no_activation = lambda z: z                # "no activation": pass z straight through unchanged (lambda = a one-line function)

for m in [35, 52, 68, 81, 96]:             # five students, from low marks to high
    z1, a1, z2, a2, z3 = b_grade(m, activation=no_activation)   # the same network with the activation switched off
    print(f"marks {m}:  z3 = ({z1}) + ({z2}) - 1.5 = {z3}")      # show how z3 is built for this student
"""),
md("""
`z3` is **13.5 every time**: `(m − 60) + (75 − m) − 1.5 = 13.5`. The `+m` from neuron 1 and the `−m` from neuron 2 cancel, so the network gives a B to a student with 35 marks and to one with 96. Any mix of the two raw sums works out to `(a − b) × m + constant`: one weight and one bias, which is **just one neuron again**. The activation between the layers is what stops this collapse.

### E2 · Who picks the questions? Let training find them
Above, **we** chose the cut-offs 60 and 75. In a real network the designer only chooses **how many** neurons. Here: 2 hidden neurons (sigmoid) and 1 output neuron, starting from random weights, trained on 17 students' marks and grades. Gradient descent (Part D) does the rest. Afterwards we read each hidden neuron's cut-off, `−b ÷ w`.
"""),
code("""
import torch                                   # PyTorch: the AI library we use for real networks
torch.manual_seed(0)                           # fix the "random" starting weights, so everyone gets the same numbers

# The marks of 17 students in Nila's class
m_data = torch.tensor([35., 41, 46, 50, 54, 58, 62, 64, 66, 68, 70, 72, 78, 82, 86, 91, 96])
y_data = ((m_data >= 60) & (m_data <= 75)).float()   # the label for each one: 1.0 = got a B, 0.0 = did not
# Shift and shrink the marks so the numbers stay near 0 (this helps training).
# unsqueeze(1) turns the list of 17 numbers into a column (17 rows × 1 input), the shape a layer expects.
x = ((m_data - 65) / 10).unsqueeze(1)

hidden = torch.nn.Linear(1, 2)                 # layer 1: 2 neurons, each with its own (random) weight and bias
output = torch.nn.Linear(2, 1)                 # layer 2: 1 neuron that combines their two answers
def network(x):                                # the whole network: input → layer 1 → sigmoid → layer 2
    return output(torch.sigmoid(hidden(x)))    # sigmoid between the layers: a smooth, learnable "YES/NO"

def cutoffs():                                 # read each hidden neuron's cut-off, in marks
    w = hidden.weight.detach().squeeze()       # the two hidden weights (detach = only read them, don't train them)
    b = hidden.bias.detach()                   # the two hidden biases
    return 65 + 10 * (-b / w)                  # cut-off = -b ÷ w, then undo the shift and shrink to get marks

loss_fn_bce = torch.nn.BCEWithLogitsLoss()     # the usual loss for YES/NO questions (binary cross-entropy)
# The optimizer does gradient descent (SGD) on all 4 weights and 3 biases, with learning rate 1.0
opt = torch.optim.SGD(list(hidden.parameters()) + list(output.parameters()), lr=1.0)
for step_no in range(1501):                    # 1,501 training steps
    loss = loss_fn_bce(network(x).squeeze(), y_data)   # predict all 17 students and score the answers
    opt.zero_grad()                            # wipe the slopes left over from the previous step
    loss.backward()                            # backpropagation: find the slope for every weight and bias
    opt.step()                                 # nudge every weight and bias a little against its slope
    if step_no in (0, 100, 300, 1500):         # report at only a few steps, to keep the output short
        # the fraction of the 17 students the network now gets right (output >= 0 means B)
        acc = ((network(x).squeeze() >= 0).float() == y_data).float().mean()
        c = cutoffs()                          # the two hidden neurons' cut-offs right now
        # print the step, the loss, the score and both cut-offs
        print(f"step {step_no:4d}: loss {loss.item():.3f}   correct {acc.item():.0%}   hidden cut-offs = {c[0]:6.1f} and {c[1]:6.1f} marks")
"""),
md("""
Nobody told the neurons "60" and "75". They started at meaningless cut-offs, and gradient descent moved them until they asked the useful questions. A neuron may ask its question the other way round (for example "above 75?") and let the output neuron subtract it; the cut-offs are what matter. **That is what "the machine learns" really means.**

### ✏️ YOUR TURN (E1–E2)
1. Change `torch.manual_seed(0)` to another number and run E2 again. Do the cut-offs still end up near 60 and 75? (Most seeds do; now and then training gets stuck, so try one more.)
2. Make a B mean 55 to 70 marks (change `y_data`). What cut-offs does training find?

*Your answers:*

### E2b · How many neurons? Train a network to find a circle
Two neurons gave the B band two edges. A shape with more edges needs more neurons. Here the job is: *which dots lie inside a circle?* We train five networks, with 1, 2, 3, 6 and 32 hidden neurons, and shade where each one says YES. (Real networks use the smooth ReLU bend between layers; we use it here.)
"""),
code("""
rng = np.random.default_rng(0)                 # a fixed random-number generator, so everyone gets the same dots
dots = rng.uniform(-1.1, 1.1, size=(600, 2)).astype(np.float32)        # 600 random dots on a square map: (x, y) each
inside = ((dots ** 2).sum(1) < 0.55 ** 2 * 1.9).astype(np.float32)     # label: 1 if a dot is inside the circle, else 0
dots_t = torch.from_numpy(dots)                # the dots as a PyTorch tensor
inside_t = torch.from_numpy(inside)[:, None]   # the labels as a column, the shape the loss expects

g = np.linspace(-1.2, 1.2, 241)                # 241 evenly spaced points along each side of the map
GX, GY = np.meshgrid(g, g)                     # every (x, y) point of a 241 × 241 grid, used to shade the answer
# all the grid points as one long list of (x, y) pairs, so the network can answer for every one at once
grid = torch.tensor(np.c_[GX.ravel(), GY.ravel()], dtype=torch.float32)

def train_circle(h):                           # train a network with h hidden neurons; return (accuracy, network)
    best = None                                # the best network found so far (none yet)
    for trial in range(5):                     # 5 different random starts; keep the best (people do this in practice)
        torch.manual_seed(trial)               # a fixed random start for this trial
        # 2 inputs (x, y) → h hidden neurons with ReLU → 1 output neuron
        net = torch.nn.Sequential(torch.nn.Linear(2, h), torch.nn.ReLU(), torch.nn.Linear(h, 1))
        opt = torch.optim.Adam(net.parameters(), lr=0.03)   # Adam: a smarter version of gradient descent
        for _ in range(1500):                  # 1,500 training steps
            # predict all 600 dots and score the answers (the usual YES/NO loss)
            loss = torch.nn.functional.binary_cross_entropy_with_logits(net(dots_t), inside_t)
            opt.zero_grad()                    # wipe the slopes from the last step
            loss.backward()                    # find the slope of every weight and bias
            opt.step()                         # nudge every weight and bias
        with torch.no_grad():                  # just checking now, not training
            # the fraction of dots it gets right (an output above 0 means YES)
            acc = float(((net(dots_t) > 0).float() == inside_t).float().mean())
        if best is None or acc > best[0]:      # better than the best start so far?
            best = (acc, net)                  # then keep it
    return best                                # the best accuracy and its network

plt.figure(figsize=(12, 2.8))                  # one wide drawing area for five maps
for k, h in enumerate([1, 2, 3, 6, 32]):       # five networks, from 1 hidden neuron to 32
    acc, net = train_circle(h)                 # train it (best of 5 random starts)
    with torch.no_grad():                      # no training here, just answering
        Z = (net(grid) > 0).numpy().reshape(GX.shape)   # the network's YES (1) or NO (0) at every grid point
    plt.subplot(1, 5, k + 1)                   # draw in box number k+1 of 5
    plt.contourf(GX, GY, Z, levels=[0.5, 1.5], colors=["green"], alpha=0.35)    # shade where it says YES
    plt.scatter(dots[:, 0], dots[:, 1], c=np.where(inside > 0, "green", "red"), s=3)   # the dots: green inside, red outside
    plt.title(f"{h} neuron{'s' if h > 1 else ''}: {acc:.0%} right")            # how many neurons, how many dots right
    plt.axis("off")                            # hide the axis numbers
    print(f"{h:2d} hidden neurons: {acc:.1%} of the dots right")              # the same result in words
plt.tight_layout()                             # space the five maps so they don't overlap
plt.show()                                     # display them
"""),
md("""
With 1 neuron the network gives up and says NO everywhere (61% right, because most dots are outside). 2 neurons make a strip, 3 a rough triangle, and from about 6 neurons the circle is found. With a smooth bend like ReLU a few neurons can make a few extra corners, but the idea is the same: **more neurons, more corners**, and every extra neuron means more multiply-adds.

### E3 · A layer is a matrix multiply
A layer of 128 neurons reading 784 inputs has a weight matrix `W` of shape (128, 784).
For a batch `X` of 64 images: `Y = X @ W.T + b`. We check that PyTorch's `nn.Linear` does **exactly** this.
"""),
code("""
# Made-up data: a batch of 64 "images" of 784 numbers each, and random weights for 128 neurons
X = np.random.rand(64, 784).astype(np.float32)           # 64 rows (images) × 784 columns (pixels), random values 0..1
W = np.random.randn(128, 784).astype(np.float32) * 0.05  # one row of 784 weights for each of the 128 neurons
b = np.random.randn(128).astype(np.float32) * 0.05       # one bias for each neuron

Y_numpy = X @ W.T + b                      # the maths by hand: W.T is W turned on its side (transposed) so the shapes line up

layer = torch.nn.Linear(784, 128)          # PyTorch's ready-made layer: 784 inputs → 128 neurons...
with torch.no_grad():                      # (no_grad: we are not training here, so don't track slopes)
    layer.weight.copy_(torch.from_numpy(W))    # ...given OUR weights instead of its own random ones
    layer.bias.copy_(torch.from_numpy(b))      # ...and OUR biases
    Y_torch = layer(torch.from_numpy(X)).numpy()   # push the batch through the layer, then turn the answer back into NumPy

print("Output shape:", Y_numpy.shape)      # (64, 128): 128 outputs for each of the 64 images
# the biggest gap between the two answers: it should be tiny (only rounding)
print("Biggest difference between NumPy and PyTorch:", np.abs(Y_numpy - Y_torch).max())
print("MACs for this one layer, one batch:", f"{64 * 784 * 128:,}")   # images × inputs × neurons multiply-adds
"""),
md("""
The difference is essentially zero (tiny rounding only). **`nn.Linear` is a matrix multiply.** That is the operation GPUs are built to do fast.

### ✏️ YOUR TURN (E)
Time the plain-Python triple loop against `@` for a smaller case. Run it and note the ratio.
"""),
code("""
n = 60                                                 # small matrices: 60 × 60
A = np.random.rand(n, n); B = np.random.rand(n, n)     # two random 60 × 60 matrices to multiply

t0 = time.perf_counter()                               # start the stopwatch
# Plain Python: work out every cell C[i][j] on its own, by adding up A[i,k] × B[k,j] for every k (one multiply-add each)
C = [[sum(A[i, k] * B[k, j] for k in range(n)) for j in range(n)] for i in range(n)]
t_loops = time.perf_counter() - t0                     # stop the stopwatch: the time the loops took

# The same product with NumPy's @, timed the same way (start, multiply, stop)
t0 = time.perf_counter(); C2 = A @ B; t_numpy = time.perf_counter() - t0

print(f"Python loops: {t_loops*1000:8.1f} ms")         # × 1000 turns seconds into milliseconds
# np.allclose checks that both answers are the same (apart from tiny rounding); also print how many times faster @ was
print(f"NumPy @     : {t_numpy*1000:8.3f} ms   → about {t_loops / t_numpy:,.0f}× faster (same answer: {np.allclose(C, C2)})")
"""),
md("*How many times faster was NumPy? (Module 2 explains why.)*"),

# ── Part F ──
md("""
---
## Part F · Your First Real AI — on the CPU  *(Unit 1.C)*

A machine that reads the marks handwritten on answer sheets: a 784 → 128 → 10 network that reads MNIST handwritten digits, trained with PyTorch.
Everything you learned is here: tensors (B), neurons and layers (C, E), a loss and gradient descent (D).

We **time every epoch**. Keep this number — in Module 2 you will run the same thing on a GPU.
"""),
code("""
import torch   # PyTorch: the toolkit for building and training AI models
from torch import nn                             # nn = PyTorch's building blocks for networks
from torchvision import datasets, transforms   # ready-made datasets (MNIST), and ways to convert images to tensors
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

print(model)   # show the network's layers
print("Parameters (knobs):", sum(p.numel() for p in model.parameters()))   # count every weight and bias
"""),
code("""
device = "cpu"     # deliberately the CPU for now
model.to(device)   # put the model's weights on that device

for epoch in range(3):                         # 3 epochs = 3 full passes over the 60,000 images
    start = time.perf_counter()                # start the stopwatch for this epoch
    model.train()                              # switch the model to training mode
    for images, labels in train_loader:        # one batch of 64 images (and their labels) at a time
        images, labels = images.to(device), labels.to(device)   # move this batch to the device the model is on
        scores = model(images)                 # 1. predict
        loss = loss_fn(scores, labels)         # 2. measure the loss
        optimizer.zero_grad()                  #    (clear the previous batch's gradients)
        loss.backward()                        # 3. gradients (backpropagation)
        optimizer.step()                       # 4. nudge every weight
    seconds = time.perf_counter() - start      # stop the stopwatch

    # Check on the 10,000 test images the model has never trained on
    model.eval(); correct = 0                  # evaluation mode; reset the counter
    with torch.no_grad():                      # no training here, so no gradients needed
        for images, labels in test_loader:   # go through the test pictures, one batch at a time
            # argmax(1) = the digit with the highest score; count how many match the labels
            correct += (model(images.to(device)).argmax(1) == labels.to(device)).sum().item()
    print(f"epoch {epoch + 1}: loss {loss.item():.3f}   test accuracy {correct / len(test_data):.1%}   time {seconds:.1f} s")   # show this epoch's loss, test accuracy and time
"""),
md("Let's see the trained network read some digits it has **never seen**:"),
code("""
images, labels = next(iter(test_loader))          # grab the first batch of test images
with torch.no_grad():   # just checking, not learning: keep no history
    guesses = model(images[:10]).argmax(1)        # the network's guess for the first 10

plt.figure(figsize=(10, 1.8))   # one wide, short drawing area
for i in range(10):   # the first 10 pictures
    plt.subplot(1, 10, i + 1)                     # 1 row, 10 boxes: draw in box i+1
    plt.imshow(images[i, 0], cmap="gray")         # images[i, 0] = picture i (0 = its only grey channel)
    plt.axis("off")   # no axes around the picture
    # write the guess above the picture: green if right, red if wrong
    plt.title(f"{guesses[i].item()}", color="green" if guesses[i] == labels[i] else "red")
plt.suptitle("The network's guesses (green = right, red = wrong)")   # a title over all the pictures
plt.show()   # draw it
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
- **Next — Module 2: Why Is AI So Hungry?** You'll count the work in real models and see why the CPU starts to struggle.
"""),
]

build("Lab1_AI_Basics.ipynb", "Lab 1", cells, gpu=False)
