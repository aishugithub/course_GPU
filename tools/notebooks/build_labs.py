"""Build the 12 Core Lab notebooks and the Side Trail notebooks (Phase 2, Nov 2026).

    cd tools/notebooks && python build_labs.py          # writes notebooks/CoreLab01_….ipynb … and SideTrails_….ipynb

Core Lab n is the n-th two-hour session of the course (book: "Using This Book in a Skill Course").
Part letters restart at A in every notebook. The mapping from the old unit labs:
  CL1 = Lab 1 A,B     CL2 = Lab 1 C,D (+B2 backprop)   CL3 = Lab 1 E,F (+B2 overfitting)
  CL4 = Lab 2A A–D    CL5 = Lab 2B A,D,E               CL6 = Lab 3 A,B      CL7 = Lab 3 C,D
  CL8 = Lab 4 A–C     CL9 = Lab 4 D,E                  CL10 = Lab 5A A–C    CL11 = Lab 5A D,E
  CL12 = Lab 5B B,C,E
Side Trails: one notebook per Step (1, 2, 3, 4, 5) plus GPUs Beyond AI (the old Lab 5C).
"""
import re
import textwrap

from nbparts import (lab1, lab2a, lab2b, lab3, lab4, lab5a, lab5b, lab5c, take, relabel, fix, part_md,
                     book_html, header, how_to_run, build, md, code, GPU_SETUP, CUPY_SETUP, VERSIONS)
from bookcells import book

L1, L2A, L2B, L3, L4, L5A, L5B, L5C = (m.cells for m in (lab1, lab2a, lab2b, lab3, lab4, lab5a, lab5b, lab5c))
WRAP = "## 🎓"


def P(cells, letter, end=None):
    """One whole part of an old lab: from its heading to the next part (or the wrap-up)."""
    nxt = chr(ord(letter) + 1)
    if end is None:
        end = f"## Part {nxt} ·" if any(f"## Part {nxt} ·" in t for _, t in cells) else WRAP
    return take(cells, f"## Part {letter} ·", end)


def sections(cells):
    """'Unit 3.4' → 'Section 3.4' (the book's Step n = the course's Unit n)."""
    return [(k, re.sub(r"\bUnit (\d\.[\dC]+)", r"Section \1", t)) for k, t in cells]


def nb(name, cells, gpu):
    cells = sections(cells)
    build(name, name, cells, gpu=gpu)


def wrap(points, nxt):
    body = "\n".join(f"- {p}" for p in points)
    return md(f"---\n## 🎓 Wrap-up\n{body}\n- **Next — {nxt}")


CPU_SETUP = take(L1, "## 0 · Setup", "## Part A ·")
SETUP_MD = md("## 0 · Setup — run these cells first")

# ════════════════════════════ Core Lab 1 ════════════════════════════
OPENING_DEMO = [
    md("""
    ---
    ## 🎬 Opening demo · the same multiply, CPU vs GPU
    *(Your teacher runs this on a GPU runtime at the start of the session. On your CPU runtime it says there is no GPU, which is fine: Core Lab 5 is where you race them yourself.)*
    """),
    code("""
    import torch                                     # PyTorch: does maths on the CPU or the GPU
    n = 4096                                         # two 4,096 × 4,096 matrices: about 69 billion multiply-adds
    A, B = torch.rand(n, n), torch.rand(n, n)        # random numbers, made on the CPU
    t0 = time.perf_counter(); A @ B                  # start the stopwatch, multiply on the CPU
    cpu_s = time.perf_counter() - t0                 # seconds the CPU took
    print(f"CPU: {cpu_s:.2f} s")                     # show it
    if torch.cuda.is_available():                    # is there a GPU in this session?
        Ag, Bg = A.cuda(), B.cuda()                  # copy both matrices into the GPU's memory
        Ag @ Bg; torch.cuda.synchronize()            # one warm-up multiply (the first GPU call is slow), then wait for it
        t0 = time.perf_counter()                     # start the stopwatch again
        Ag @ Bg; torch.cuda.synchronize()            # the same multiply on the GPU; wait until it has really finished
        gpu_s = time.perf_counter() - t0             # seconds the GPU took
        print(f"GPU: {gpu_s:.3f} s  →  about {cpu_s / gpu_s:.0f}× faster ({torch.cuda.get_device_name(0)})")   # the speed-up
    else:                                            # a CPU runtime
        print("No GPU in this session (that's expected in Core Lab 1).")   # nothing more to show
    """),
]

cl1 = [header("core", 1, "Everything Is Numbers", 1, "1.1–1.2", "1.1–1.2",
              "the best cut-off found by search; a 28 × 28 digit as 784 numbers.",
              [("A", "Let Python search for the best pass/fail cut-off", "1.1"),
               ("B", "Meet MNIST: look inside a real image, a sentence and a tensor", "1.2")],
              "2 hours", "cpu", "D2L Ch 1, §2.1, §9.2"),
       how_to_run(gpu=False), md("## 0 · Setup"), VERSIONS] + CPU_SETUP[1:] + OPENING_DEMO \
    + P(L1, "A") + P(L1, "B") \
    + [wrap(["Learning = trying settings and keeping the one with the smallest error, instead of writing the rule by hand.",
             "Everything a machine reads (a picture, a sentence, a sound) becomes a tensor of numbers first."],
            "Core Lab 2: How a Neuron Learns.** One neuron, a bias, the nudge test and gradient descent.")]
nb("CoreLab01_Everything_Is_Numbers.ipynb", cl1, gpu=False)

# ════════════════════════════ Core Lab 2 ════════════════════════════
D2_CODE = book_html("step1.html", "# one example: the input and the answer we want")
cl2_parts = fix(P(L1, "C") + P(L1, "D"),
                ("the 12 students from Part A", "the 12 students from Core Lab 1, Part A"),
                ("The 12 students from Part A again", "The 12 students from Core Lab 1, Part A, again"),
                ("The network in Part F has", "The network in Core Lab 3 has"))
cl2_parts = relabel(cl2_parts, {"C": "A", "D": "B"})
cl2_parts = fix(cl2_parts, ("### ✏️ YOUR TURN (B)\n", "### ✏️ YOUR TURN (B1)\n"))
cl2 = [header("core", 2, "How a Neuron Learns", 1, "1.3–1.4", "1.3–1.4",
              "the bias moving the cut-off; the nudge-test slope matching the formula; a learning rate that is too "
              "large diverging; backprop slopes matching the nudge test.",
              [("A", "Build a neuron with a loop, then with `np.dot`; see why it needs a bias", "1.3"),
               ("B", "The nudge test, gradient descent from scratch, and backpropagation checked against the nudge test", "1.4")],
              "2 hours", "cpu", "D2L §3.1–3.4, §5.1"),
       how_to_run(gpu=False), md("## 0 · Setup"), VERSIONS] + CPU_SETUP[1:] + cl2_parts + [
    md("""
    ### B2 · Check backpropagation against the nudge test
    The two-weight chain from the book's "Backpropagation by hand" (Section 1.4): x → (× w1) → h → (× w2) → y.
    The **backward pass** starts at the loss and passes the slope back one link at a time. The **nudge test** checks each slope the slow way.
    """),
    code(D2_CODE),
    md("""
    Both methods agree (the nudge slopes differ only in the third decimal, because a nudge of 0.001 is small but not zero). Backpropagation gets **every** slope from one backward pass; the nudge test needs one extra forward pass **per weight**. With a million weights, that is the difference between one pass and a million.

    ### ✏️ YOUR TURN (B2)
    1. Change `x` to 3. Work out the four backward slopes (dL_dy, dL_dw2, dL_dh, dL_dw1) **by hand** first, then run the cell to check.
    2. Why does the backward pass need `h`, the number kept from the forward pass? (Section 2.2 uses this to explain why training needs more memory than inference.)

    *Your answers:*
    """),
    wrap(["A neuron = weighted sum + bias, then an activation; the bias moves the cut-off.",
          "Gradient descent: measure the slope of the loss, take a small step downhill, repeat. Too big a step diverges.",
          "Backpropagation gives every weight's slope in one backward pass, and it agrees with the nudge test."],
         "Core Lab 3: Train a Real Network.** Layers as matrix multiplies, and a network that reads handwriting.")]
nb("CoreLab02_How_a_Neuron_Learns.ipynb", cl2, gpu=False)

# ════════════════════════════ Core Lab 3 ════════════════════════════
F2_CODE = book_html("step1.html", "# only 200 training images: few enough to memorise")
F2_CODE = F2_CODE.split("# the last two lines of the output")[0].rstrip()
cl3_E = take(L1, "## Part E ·", "### E2b ·") + take(L1, "### E3 ·", "## Part F ·")
cl3_F = take(L1, "## Part F ·", "A chatbot does the same over its whole dictionary") + [
    md("""
    ### ✏️ YOUR TURN (F0)
    Change the score for F from −1.0 to 3.0 and re-run. Which grade wins now, and do the four probabilities still add up to 1?

    *(How a chatbot uses these odds to pick its next word, and what the "temperature" setting does, is a Side Trail: Appendix A.3 and the Step 1 Side Trails notebook.)*

    *Your answer:*
    """)] + take(L1, "### F1 ·", WRAP)
cl3_parts = relabel(cl3_E + cl3_F, {"E": "A", "F": "B"})
cl3_parts = fix(cl3_parts,
                ("(Module 2 explains why.)", "(Core Lab 4 explains why.)"),
                ("Keep this number — in Module 2 you will run the same thing on a GPU.",
                 "Keep this number: in Core Lab 9 a GPU trains MNIST networks, and in Core Lab 4 you will count this network's work."),
                ("tensors (B), neurons and layers (C, E), a loss and gradient descent (D)",
                 "tensors (Core Lab 1), neurons (Core Lab 2), layers (Part A), a loss and gradient descent (Core Lab 2)"))
cl3 = [header("core", 3, "Train a Real Network", 1, "1.5, 1.C (read 1.6–1.7)", "1.5, 1.C",
              "layers collapsing without an activation; about 95% accuracy on MNIST; seconds per epoch on the CPU; "
              "validation loss rising when a model memorises.",
              [("A", "Build the B-grade network, let training find its cut-offs, and prove a layer is a matrix multiply", "1.5"),
               ("B", "Probabilities, then train a network that reads handwritten digits on the CPU; then catch it memorising", "1.C")],
              "2 hours", "cpu", "D2L Ch 4, §5.1–5.3 · Hwu, Kirk & El Hajj Ch 16"),
       how_to_run(gpu=False), md("## 0 · Setup"), VERSIONS] + CPU_SETUP[1:] + cl3_parts + [
    md("""
    ### B2 · Catch the network memorising: training vs validation loss
    Give the same 784 → 128 → 10 network only **200** training images, keep **10,000 other images** as a validation set it never trains on, and train for 100 epochs. Watch both losses. (About 1–2 minutes on Colab's CPU.)
    """),
    code(textwrap.dedent("""
    # the full 60,000 training images (Part B1 loaded them as train_data)
    full_train = train_data
    # a fixed random start, so everyone's run matches the book's
    torch.manual_seed(0)
    # a fresh copy of the Part B1 network: 784 → 128 → 10
    model = nn.Sequential(nn.Flatten(), nn.Linear(784, 128), nn.ReLU(), nn.Linear(128, 10))
    # the same loss as Part B1
    loss_fn = nn.CrossEntropyLoss()
    # the same gradient descent, learning rate 0.1
    optimizer = torch.optim.SGD(model.parameters(), lr=0.1)
    """) + "\n" + F2_CODE.replace("# the same four-step training loop as Part F", "# the same four-step training loop as Part B1")),
    code("""
    plt.figure(figsize=(6.5, 3.2))                                        # a new chart
    plt.plot(range(1, 101), train_hist, label="training loss (200 images)")   # blue: the images it learns from
    plt.plot(range(1, 101), val_hist, label="validation loss (10,000 images)") # orange: images it never trains on
    plt.axvline(best, ls="--", color="green", label=f"stop here: epoch {best}") # the epoch with the lowest validation loss
    plt.xlabel("epoch"); plt.ylabel("average loss")                       # axis labels
    plt.legend(); plt.grid(alpha=0.3)                                     # colour key and faint grid
    plt.title("Learning, then memorising")                                # the chart's title
    plt.show()                                                            # draw it
    """),
    md("""
    ### ✏️ YOUR TURN (B2)
    | | Your value |
    |---|---|
    | Epoch with the lowest validation loss | |
    | Lowest validation loss | |
    | Validation loss at epoch 100 | |
    | Training loss at epoch 100 | |

    1. After the best epoch, the training loss keeps falling but the validation loss rises. In one sentence: what is the network doing?
    2. Why must we never pick the best epoch (or the learning rate) using the **test** set?
    3. Change `range(0, 200)` to `range(0, 2000)` (10× more training images) and re-run. Does the turning point come later?

    *Your answers:*
    """),
    wrap(["A layer is a matrix multiply (`nn.Linear` = X @ W.T + b); without an activation between them, layers collapse into one.",
          "Softmax turns scores into probabilities; cross-entropy is −log of the right answer's probability.",
          "Your first real AI read handwritten digits at about 95%, and you timed it on the CPU.",
          "A validation set catches memorising: stop at the epoch with the lowest validation loss."],
         "Core Lab 4: How Much Work Is AI?** Count the multiply-adds, and measure what your CPU can do.")]
nb("CoreLab03_Train_a_Real_Network.ipynb", cl3, gpu=False)

# ════════════════════════════ Core Lab 4 ════════════════════════════
cl4_parts = fix(P(L2A, "A") + P(L2A, "B") + P(L2A, "C") + P(L2A, "D"),
                ("Change the Lab 1 network", "Change the Core Lab 3 network"),
                ("than your Lab 1 network?", "than your Core Lab 3 network?"),
                ("3 epochs of the Lab 1 network", "3 epochs of the Core Lab 3 network"),
                ("GPUs speed up the first kind enormously. That's Lab 2B.", "GPUs speed up the first kind enormously. That's Core Lab 5."))
cl4 = [header("core", 4, "How Much Work Is AI?", 2, "2.1–2.4", "2.1–2.4",
              "training ≈ 3× inference; vectorised code hundreds of times faster than loops; your CPU's GFLOPS in a compute bill.",
              [("A", "Count the parameters and multiply-adds of real networks", "2.1"),
               ("B", "Time inference vs training", "2.2"),
               ("C", "Independent work vs a chain", "2.3"),
               ("D", "Measure your CPU's speed, then run the compute bill", "2.4")],
              "2 hours", "cpu", "Hamacher Ch 1 · H&P §4.1 · D2L §5.3"),
       how_to_run(gpu=False), SETUP_MD, VERSIONS, book(2, "A_SETUP")] + cl4_parts + [
    wrap(["A layer costs n_in × n_out multiply-adds per input; training costs about 3× inference.",
          "Independent work (like ReLU) can be spread over many workers; a chain (a running total) cannot.",
          "Your CPU's measured GFLOPS turns a model's FLOPs into a time and a bill."],
         "Core Lab 5: CPU or GPU?** Your first code on a GPU, raced against today's CPU numbers.")]
nb("CoreLab04_How_Much_Work_Is_AI.ipynb", cl4, gpu=False)

# ════════════════════════════ Core Lab 5 ════════════════════════════
cl5_parts = relabel(P(L2B, "A", "## Part B ·") + P(L2B, "D") + P(L2B, "E"), {"D": "B", "E": "C"})
cl5_parts = fix(cl5_parts,
                ("Compare with your own computer's CPU cores (Part B shows how many Colab's CPU has).",
                 "Compare with Colab's CPU: run `import os; print(os.cpu_count())` in a new cell."),
                ("(Unit 3.1)", "(Section 3.1)"))
cl5 = [header("core", 5, "CPU or GPU?", 2, "2.5–2.8, 2.C", "2.5–2.8, 2.C",
              "the GPU winning only for large work; measured speed-up close to Amdahl's prediction; copies erasing the gain.",
              [("A", "Meet your GPU", "2.5"),
               ("B", "Amdahl's law on a real program", "2.8"),
               ("C", "The big race: matrix multiply, the cost of copying, and the decision tool", "2.C, App. B.2")],
              "2 hours", "gpu", "Stallings §2.2–2.3 · H&P §4.4",
              extra="🥾 Side Trails for this Step (clock speed and power, vector add, the decision tool's code) are in the **Step 2 Side Trails** notebook."),
       how_to_run(gpu=True), SETUP_MD, VERSIONS, GPU_SETUP] + cl5_parts + [
    wrap(["The GPU's cores are slower, but there are thousands of them: throughput beats latency for big, parallel work.",
          "Tiny jobs, serial code and copy-dominated jobs stay on the CPU.",
          "Amdahl's law: the serial part sets the ceiling."],
         "Core Lab 6: Inside the GPU.** SMs, warps, Tensor Cores and your first CUDA C kernel.")]
nb("CoreLab05_CPU_or_GPU.ipynb", cl5, gpu=True)

# ════════════════════════════ Core Lab 6 ════════════════════════════
cl6 = [header("core", 6, "Inside the GPU", 3, "3.1–3.2", "3.1–3.2",
              "peak FLOPS from the parts; FP16 several times faster than FP32; a diverging kernel about 2× slower.",
              [("A", "Work out the peak, then measure FP32 vs FP16", "3.1"),
               ("B", "Make a warp diverge, and time the damage", "3.2")],
              "2 hours", "gpu", "Hwu, Kirk & El Hajj Ch 4 · H&P §4.4"),
       how_to_run(gpu=True), SETUP_MD, VERSIONS, GPU_SETUP, CUPY_SETUP] + P(L3, "A") + P(L3, "B") + [
    wrap(["A GPU's peak = SMs × cores per SM × 2 FLOPs × clock; Tensor Cores in FP16 go far higher.",
          "32 threads (a warp) share one instruction; if they split on an if/else, both paths run one after the other."],
         "Core Lab 7: Feeding the GPU.** Hiding memory latency with threads, and coalesced vs strided reads.")]
nb("CoreLab06_Inside_the_GPU.ipynb", cl6, gpu=True)

# ════════════════════════════ Core Lab 7 ════════════════════════════
cl7_parts = relabel(P(L3, "C") + P(L3, "D"), {"C": "A", "D": "B"})
cl7 = [header("core", 7, "Feeding the GPU", 3, "3.3–3.4", "3.3–3.4",
              "bandwidth rising then levelling off as threads increase; strided access several times slower than coalesced.",
              [("A", "Add threads until the waiting is hidden", "3.3"),
               ("B", "Bandwidth: coalesced vs strided", "3.4")],
              "2 hours", "gpu", "Hwu, Kirk & El Hajj Ch 4–5 · Hamacher §12.1, Ch 8",
              extra="🥾 Side Trail for this Step (map a job onto a GPU: plan vs reality) is in the **Step 3 Side Trails** notebook."),
       how_to_run(gpu=True), SETUP_MD, VERSIONS, GPU_SETUP, CUPY_SETUP, code("""
    sms = torch.cuda.get_device_properties(0).multi_processor_count   # how many SMs this GPU has (Core Lab 6 found it too)
    print(f"This GPU has {sms} SMs")                                  # show it (a T4 has 40)
    """)] + cl7_parts + [
    wrap(["Memory is slow; the GPU hides the wait by switching between many warps. Too few threads leave it idle.",
          "Neighbouring threads should read neighbouring addresses (coalesced): strided reads waste most of each memory transaction."],
         "Core Lab 8: Hand a Job to the GPU.** Allocate, copy, launch your own kernel, copy back.")]
nb("CoreLab07_Feeding_the_GPU.ipynb", cl7, gpu=True)

# ════════════════════════════ Core Lab 8 ════════════════════════════
cl8_C = take(L4, "## Part C ·", "**A 2-D kernel:**") + [md("""
    *(A 2-D kernel that brightens an image, one thread per pixel, is a Side Trail: Appendix D.2 and the Step 4 Side Trails notebook.)*

    ### ✏️ YOUR TURN (C)
    1. Which block size was slowest? Explain using warps and the 16-blocks-per-SM limit.
    2. How many slots were overwritten without the check? Show the arithmetic: 4 × 256 − 1,000 = ?
    3. Why did no error message appear? (Section 4.3: the sentinel slots were our own memory.)

    *Your answers:*
    """)]
cl8_parts = fix(P(L4, "A") + P(L4, "B") + cl8_C,
                ("(measured in Lab 3)", "(measured in Core Lab 7)"))
cl8 = [header("core", 8, "Hand a Job to the GPU", 4, "4.1–4.3", "4.1–4.3",
              "PCIe far slower than GPU memory; copies dominating a single operation; block-size effects; writing past the end without the check.",
              [("A", "Where tensors live, and how fast PCIe is", "4.1"),
               ("B", "The five steps of offloading, one at a time", "4.2"),
               ("C", "Write your own kernels; what happens without the bounds check", "4.3")],
              "2 hours", "gpu", "Hwu, Kirk & El Hajj Ch 2–3 · Hamacher Ch 7"),
       how_to_run(gpu=True), SETUP_MD, VERSIONS, GPU_SETUP, CUPY_SETUP] + cl8_parts + [
    wrap(["Every GPU job does five steps: allocate, copy in, launch, copy out, free. The copies often cost more than the kernel.",
          "Each thread finds its element from blockIdx, blockDim and threadIdx, and must check `i < n`."],
         "Core Lab 9: Keep the GPU Busy.** Asynchronous launches, sync points, and profiling a slow training loop.")]
nb("CoreLab08_Hand_a_Job_to_the_GPU.ipynb", cl8, gpu=True)

# ════════════════════════════ Core Lab 9 ════════════════════════════
cl9_parts = relabel(P(L4, "D") + P(L4, "E"), {"D": "A", "E": "B"})
cl9_parts = fix(cl9_parts, ("(the handwritten digits from Lab 1)", "(the handwritten digits from Core Lab 3)"),
                ("using a Unit 4 idea", "using a Step 4 idea"))
cl9 = [header("core", 9, "Keep the GPU Busy", 4, "4.4, 4.C", "4.4, 4.C",
              "an \"impossible\" time without synchronisation; the cost of `.item()`; a profiled training loop made several times faster.",
              [("A", "The impossible timing, and the cost of `.item()`", "4.4"),
               ("B", "Profile and fix a slow training loop", "4.C")],
              "2 hours", "gpu", "Hwu, Kirk & El Hajj Ch 2 · Hamacher Ch 3"),
       how_to_run(gpu=True), SETUP_MD, VERSIONS, GPU_SETUP] + cl9_parts + [
    wrap(["GPU launches are asynchronous: time GPU work only after `torch.cuda.synchronize()`.",
          "Every `.item()`, `print` of a GPU value or `.cpu()` is a sync point that makes the CPU wait.",
          "Profile first, then fix the biggest cost: here, batch size, data on the GPU and fewer sync points."],
         "Core Lab 10: Make It Fast.** Tiling, low precision and your own roofline.")]
nb("CoreLab09_Keep_the_GPU_Busy.ipynb", cl9, gpu=True)

# ════════════════════════════ Core Lab 10 ════════════════════════════
cl10_parts = fix(P(L5A, "A") + P(L5A, "B") + P(L5A, "C"),
                 ("(the handwritten digits from Lab 1)", "(the handwritten digits from Core Lab 3)"))
cl10 = [header("core", 10, "Make It Fast", 5, "5.1–5.3", "5.1–5.3",
               "tiled faster than naive, cuBLAS faster still; the same accuracy with mixed precision; operations placed on your own roofline.",
               [("A", "Naive vs tiled matrix-multiply kernels vs cuBLAS (the code is printed in App. D.1)", "5.1"),
                ("B", "FP32 vs FP16: speed, error, overflow, mixed-precision training", "5.2"),
                ("C", "Measure your GPU's roof and plot your own roofline", "5.3")],
               "2 hours", "gpu", "Hwu, Kirk & El Hajj Ch 5 · Hamacher Ch 9 · H&P §4.3"),
        how_to_run(gpu=True), SETUP_MD, VERSIONS, GPU_SETUP, CUPY_SETUP] + cl10_parts + [
    wrap(["Tiling reuses each number from fast shared memory many times; cuBLAS adds years of tuning and Tensor Cores.",
          "Fewer bits = more speed and less memory; mixed precision keeps the accuracy.",
          "The roofline says whether a job is limited by compute or by memory, and so which fix can help."],
         "Core Lab 11: Batch Size and the Speed-up Ladder.**")]
nb("CoreLab10_Make_It_Fast.ipynb", cl10, gpu=True)

# ════════════════════════════ Core Lab 11 ════════════════════════════
cl11_parts = relabel(P(L5A, "D") + P(L5A, "E"), {"D": "A", "E": "B"})
cl11_parts = fix(cl11_parts, ("Compare with the small Lab 1 network", "Compare with the small Core Lab 3 network"),
                 ("Not every rung helps on every machine, and that is the real lesson.",
                  "Not every rung helps on every machine, and that is the real lesson. Rung 4 (mixed precision) may do "
                  "little or even slow things down: while the CPU still loads and copies every batch, faster GPU arithmetic barely shows."),
                 ("3. Did you reach the 5× target?",
                  "3. Did you reach the 5× target?\n"
                  "4. Rung 5 keeps mixed precision switched on. In the `ladder` cell, change `amp = rung >= 4` to "
                  "`amp = rung == 4`, re-run that cell (it climbs the whole ladder again, about half a minute), then run `ladder(5)` in a new cell. Is rung 5 faster without "
                  "mixed precision? Then change `B = 256 if rung >= 3 else 32` to `B = 1024 if rung >= 3 else 32` and compare "
                  "`ladder(5)` with and without mixed precision again. When does mixed precision pay off, and why? "
                  "*(Our T4 numbers are in Section 5.5.)*"))
cl11 = [header("core", 11, "Batch Size and the Speed-up Ladder", 5, "5.4–5.5", "5.4–5.5",
               "throughput levelling off with batch size; a measured total speed-up at the same accuracy.",
               [("A", "CPU vs GPU training, and a batch-size sweep", "5.4"),
                ("B", "The speed-up ladder on Fashion-MNIST", "5.5")],
               "2 hours", "gpu", "D2L Ch 12–13 · Hwu, Kirk & El Hajj Ch 16"),
        how_to_run(gpu=True), SETUP_MD, VERSIONS, GPU_SETUP, code("""
    from torchvision import datasets                 # ready-made datasets (MNIST, Fashion-MNIST) for Part B
    """),
        md("The same MNIST data, wide network and helpers as Core Lab 10, Part B (only the definitions; no training yet):"),
        code(book(5, "B_MIXED")[1].split("\nmixed = {}")[0].rstrip())] + cl11_parts + [
    wrap(["Bigger batches keep the GPU busy until throughput levels off; memory keeps growing.",
          "Climb the ladder one change at a time and measure each rung: not every rung helps on every machine."],
         "Core Lab 12: Will It Fit? Plan a Project.**")]
nb("CoreLab11_Batch_Size_and_the_Ladder.ipynb", cl11, gpu=True)

# ════════════════════════════ Core Lab 12 ════════════════════════════
cl12_parts = relabel(P(L5B, "B", "## Part C ·") + P(L5B, "C", "## Part D ·") + P(L5B, "E", WRAP), {"B": "A", "C": "B", "E": "C"})
cl12_parts = fix(cl12_parts, ("Generate 100 tokens on the CPU and on the GPU.",
                              "Generate 100 tokens on the CPU and on the GPU. (If Colab warns that the `HF_TOKEN` secret can't be read, ignore it: this small model downloads without one.)"))
cl12 = [header("core", 12, "Will It Fit? Plan a Project", 5, "5.7–5.9, 5.C", "5.7–5.9, 5.C",
               "memory close to 16 bytes per parameter; a real out-of-memory message read and fixed; tokens per second on CPU vs GPU; a fit → time → cost plan.",
               [("A", "Watch memory grow, step by step", "5.7"),
                ("B", "Cause an out-of-memory error, read it, fix it; catch a leak", "5.8"),
                ("C", "Plan the project (planner code in App. F), then run a real language model", "5.C")],
               "2 hours", "gpu", "D2L Ch 13 · Hwu, Kirk & El Hajj Ch 16",
               extra="🥾 Side Trails for this Step (the software stack, INT8 quantisation, data parallelism on one GPU) are in the **Step 5 Side Trails** notebook; GPUs beyond AI has its own notebook."),
        how_to_run(gpu=True), SETUP_MD, VERSIONS, GPU_SETUP] + cl12_parts + [
    md("""
    ---
    ## 🎓 Course wrap-up: the Main Climb is done
    - Step 1: AI is multiply-adds, learned by gradient descent.  Step 2: a lot of them, mostly independent.
    - Step 3: a GPU is thousands of simple cores fed by a fast memory.  Step 4: the CPU hands it work in five steps, asynchronously.
    - Step 5: tiling, low precision, batching and the roofline make it fast; memory decides whether it fits.
    - **Next:** your mini-project (you can complete it with the Core Labs alone), and any 🥾 Side Trail you like.
    """)]
nb("CoreLab12_Will_It_Fit.ipynb", cl12, gpu=True)

# ════════════════════════════ Side Trails ════════════════════════════
# ---- Step 1 ----
CNN = book_html("appendix.html", "# the CNN: two conv layers")
ATTN = book_html("appendix.html", "# attention: scores, softmax, mix the values")
st1 = [header("trail", "Step 1", "More AI Maths", 1, "App. A (from 1.5, 1.6, 1.7, 1.C)", "1.5, 1.C",
              "", [("A", "Shapes a network can draw: train a network to find a circle", "A.1 (from 1.5)"),
                   ("B", "Temperature: why the same question gets different answers", "A.3 (from 1.C)"),
                   ("C", "A CNN reads MNIST, on the CPU and on a GPU", "A.4 (from 1.6)"),
                   ("D", "Time attention as the context grows", "A.5 (from 1.7)")],
              "1–2 hours (any part on its own)",
              "Parts A–B run anywhere; Parts C–D compare the CPU with a **GPU**: Runtime → Change runtime type → **T4 GPU**.",
              "D2L Ch 4, Ch 7, Ch 11",
              extra="🥾 **Side Trails are optional.** Nothing in a later Core Lab needs them. Each part says where it leaves the Main Climb and where it rejoins."),
       how_to_run(gpu=True), md("## 0 · Setup"), VERSIONS] + CPU_SETUP[1:] + [
    code("""
    import torch                                     # PyTorch: networks, on the CPU or the GPU
    from torch import nn                             # nn: PyTorch's layers and losses
    device = "cuda" if torch.cuda.is_available() else "cpu"   # use the GPU if this session has one
    print("device:", device)                         # say which
    """)] + relabel(
    [md("---\n## Part A · Shapes a network can draw  *(leaves from 1.5 → rejoin at 1.5)*")]
    + take(L1, "### E2b ·", "### E3 ·"), {"E": "A"}) + [
    md("""
    ### ✏️ YOUR TURN (A)
    How many hidden neurons did it take before the network found the circle? Why can't 1 or 2 neurons draw it?

    *Your answer:*

    ---
    ## Part B · Temperature  *(leaves from 1.C → rejoin at 1.C)*
    A chatbot does not always pick its most likely next word: it **draws** one at random, using the probabilities as the odds. The **temperature** T divides every score by T before softmax. Four candidate words after *"The exam was …"*: easy, hard, long, cancelled.
    """),
    code(textwrap.dedent("""
    scores = np.array([2.0, 1.0, 0.1, -1.0])         # the four words' scores: easy, hard, long, cancelled
    """) + "\n" + book_html("appendix.html", "# try three temperatures")),
    md("""
    ### ✏️ YOUR TURN (B)
    At T = 0.5 and at T = 2.0, how likely is *"cancelled"*? Why can the same question get different answers from a chatbot?

    *Your answer:*

    ---
    ## Part C · A CNN reads MNIST, on the CPU and on a GPU  *(leaves from 1.6 → rejoin at 1.7)*
    Two convolution layers, a max-pool and one ordinary layer to the 10 digits, trained for **one epoch** on all 60,000 images: first on the CPU (a few minutes), then on the GPU.
    """),
    code("""
    from torchvision import datasets, transforms     # MNIST, and a converter from pictures to tensors
    from torch.utils.data import DataLoader          # serves the data in batches
    to_tensor = transforms.ToTensor()                # pixels 0..255 → floats 0..1
    train_data = datasets.MNIST("data", train=True, download=True, transform=to_tensor)    # 60,000 to learn from
    test_data = datasets.MNIST("data", train=False, download=True, transform=to_tensor)    # 10,000 to test on
    train_loader = DataLoader(train_data, batch_size=64, shuffle=True)   # batches of 64, shuffled every epoch
    loss_fn = nn.CrossEntropyLoss()                  # the loss for "which digit?"
    """),
    code(CNN.replace("# plain gradient descent, as in Part F", "# plain gradient descent, as in Core Lab 3").replace('print("CPU:", run("cpu"), "s   GPU:", run("cuda"), "s")', """# the CPU first: one epoch
cpu_s = run("cpu")
# show it
print(f"CPU: 1 epoch in {cpu_s:.1f} s")
# then the GPU, if this session has one
if device == "cuda":
    # a warm-up epoch first: the first CUDA call is slow
    run("cuda")
    # the timed epoch
    gpu_s = run("cuda")
    # the time and the speed-up
    print(f"GPU: 1 epoch in {gpu_s:.1f} s  ({cpu_s / gpu_s:.1f}x faster)")
# no GPU in this session
else:
    # say so
    print("No GPU in this session: switch to a T4 runtime to see the GPU time.")""")),
    md("""
    ### ✏️ YOUR TURN (C)
    Change Conv 2 to **128** filters (`nn.Conv2d(32, 128, …)` and `nn.Linear(128 * 12 * 12, 10)`). Predict the change in multiply-adds from the formula in Section 1.6 first, then time it.

    *Your answer:*

    ---
    ## Part D · Time attention as the context grows  *(leaves from 1.7 → rejoin at 1.C)*
    Attention in four lines of PyTorch, timed for context lengths 512 to 4,096 (d = 64, one head), on the CPU and the GPU. Each time is the best of 5 calls after a warm-up.
    """),
    code(ATTN.split("# the length of each query")[0].rstrip() + """

# the length of each query, key and value list
d = 64
# the column titles
print("context   score-table numbers    CPU ms    GPU ms")
# double the context each time
for n in [512, 1024, 2048, 4096]:
    # the context and the size of the n × n score table
    row = f"{n:7,}   {n * n:20,}"
    # time it on the CPU, then on the GPU (if there is one)
    for dev in ["cpu", "cuda"] if device == "cuda" else ["cpu"]:
        # random Q, K and V of shape (n, d) on this device
        Q, K, V = (torch.randn(n, d, device=dev) for _ in range(3))
        # the best of 5 timed calls, in milliseconds
        best = float("inf")
        # a warm-up call, then 5 timed ones
        for rep in range(6):
            # wait for any earlier GPU work, then start the stopwatch
            sync() if dev == "cuda" else None; t0 = time.perf_counter()
            # one attention call
            out = attention(Q, K, V)
            # wait until the GPU has really finished (no-op on the CPU)
            sync() if dev == "cuda" else None
            # keep the fastest of the timed calls (rep 0 is the warm-up)
            best = min(best, (time.perf_counter() - t0) * 1000) if rep else best
        # add this device's time to the row
        row += f"   {best:7.2f}"
    # print the row
    print(row)"""),
    md("""
    ### ✏️ YOUR TURN (D)
    1. Each doubling of the context makes the score table 4× bigger. Does the time grow about 4× per doubling?
    2. Predict the GPU time at n = 8,192 from the 4,096 row, then add 8192 to the list and time it. How big is the score table in MB at 4 bytes per number?

    *Your answers:*
    """)]
# sync() for Part D: the GPU setup's helper, defined here so this notebook needs no other setup cell
st1.insert(st1.index(next(c for c in st1 if "device = \"cuda\" if torch.cuda.is_available()" in c[1])) + 1, code("""
def sync():                                          # wait until all queued GPU work has really finished
    if torch.cuda.is_available():                    # (only when there is a GPU)
        torch.cuda.synchronize()                     # wait for it
"""))
nb("SideTrails_Step1_More_AI_Maths.ipynb", st1, gpu=True)

# ---- Step 2 ----
st2_parts = relabel(P(L2B, "B") + P(L2B, "C"), {"B": "A", "C": "B"})
st2 = [header("trail", "Step 2", "The Power Wall, SIMD and the Decision Tool", 2, "2.6, 2.7, App. B", "2.6–2.7, 2.C", "",
              [("A", "Clock speed and power", "2.6 (leaves 2.6 → rejoin 2.7)"),
               ("B", "Vector add: CPU vs GPU, from tiny to huge", "2.7 (leaves 2.7 → rejoin 2.8)"),
               ("C", "The CPU-or-GPU decision tool, versions 1 and 2", "App. B.1 (from 2.C)")],
              "1 hour", "gpu", "H&P Ch 1 · Hamacher §12.2",
              extra="🥾 **Side Trails are optional.** Nothing in a later Core Lab needs them."),
       how_to_run(gpu=True), SETUP_MD, VERSIONS, GPU_SETUP] + st2_parts + [
    md("""
    ---
    ## Part C · The decision tool in code  *(Appendix B.1, from 2.C)*
    Version 1 always picks the GPU. Version 2 also knows the bytes and where the data is, using rough T4-class numbers.
    """),
    code(book_html("appendix.html", "# version 1 of our decision tool") + "\n# what version 1 says about a tiny job\nprint(\"v1, 1,000 FLOPs:\", decide(1_000))"),
    code(book_html("appendix.html", "# version 2: it also knows the bytes") + """
# a tiny job with its data still on the CPU
print("v2, tiny job, data on the CPU:", decide(1_000, 8_000, on_gpu=False))
# a 4,096 × 4,096 matrix multiply (2n³ FLOPs, three n × n FP32 matrices) with the data already on the GPU
print("v2, 4,096 matmul, data on the GPU:", decide(2 * 4096**3, 3 * 4096**2 * 4, on_gpu=True))"""),
    md("""
    ### ✏️ YOUR TURN (C)
    Use version 2 on a ReLU over 10 crore numbers (1 FLOP and 8 bytes per number) with the data on the CPU. Which does it pick, and why?

    *Your answer:*
    """)]
nb("SideTrails_Step2_Power_SIMD_Decision.ipynb", st2, gpu=True)

# ---- Step 3 ----
st3_E = relabel(P(L3, "E", WRAP), {"E": "C"})
st3_E = fix(st3_E, ("measured in Parts A and D", "measured in Parts A and B"))
st3 = [header("trail", "Step 3", "Map a Job onto a GPU", 3, "App. C (from 3.4)", "3.C", "",
              [("A", "Measure this GPU's best FP32/FP16 speed", "3.1 (Core Lab 6 Part A again)"),
               ("B", "Measure its best bandwidth", "3.4 (Core Lab 7 Part B again)"),
               ("C", "Your plan vs reality", "App. C")],
              "1 hour", "gpu", "Hwu, Kirk & El Hajj Ch 4–5 · H&P §4.4",
              extra="🥾 **Side Trail: leaves from 3.4 → rejoin at Step 4.** Parts A and B re-measure the two numbers the plan needs."),
       how_to_run(gpu=True), SETUP_MD, VERSIONS, GPU_SETUP, CUPY_SETUP,
       md("---\n## Part A · This GPU's best speed  *(Section 3.1)*"), book(3, "A_PEAK"), book(3, "A_MEASURE"),
       md("---\n## Part B · This GPU's best bandwidth  *(Section 3.4)*"), book(3, "D_BEST")] + st3_E
nb("SideTrails_Step3_Map_a_Job.ipynb", st3, gpu=True)

# ---- Step 4 ----
st4 = [header("trail", "Step 4", "More Kernels", 4, "App. D.2 (from 4.3)", "4.3", "",
              [("A", "A 2-D kernel: brighten an image, one thread per pixel", "App. D.2")],
              "30 minutes", "gpu", "Hwu, Kirk & El Hajj Ch 3",
              extra="🥾 **Side Trail: leaves from 4.3 → rejoin at 4.4.**"),
       how_to_run(gpu=True), SETUP_MD, VERSIONS, GPU_SETUP, CUPY_SETUP,
       md("---\n## Part A · A 2-D kernel: brighten an image  *(Appendix D.2)*\nOne thread per pixel, with 16 × 16 blocks: each thread finds its row and column from `blockIdx`, `blockDim` and `threadIdx` in two dimensions.")] \
    + [book(4, "C_IMAGE")] \
    + take(L4, "fig, ax = plt.subplots(1, 2", "### ✏️ YOUR TURN (C)") + [md("""
    ### ✏️ YOUR TURN (A)
    1. Change the kernel to make the image **darker**. Which single line did you change?
    2. The image is not a multiple of 16 pixels wide. Which line stops the threads past the edge from writing?

    *Your answers:*
    """)]
nb("SideTrails_Step4_More_Kernels.ipynb", st4, gpu=True)

# ---- Step 5 ----
INT8 = book_html("step5.html", "# INT8: each nn.Linear")
st5_A = relabel(P(L5B, "A"), {})
st5_D = relabel(P(L5B, "D"), {"D": "C"})
st5 = [header("trail", "Step 5", "Software Stack, INT8 and Data Parallelism", 5, "5.6, 5.9", "5.6, 5.9", "",
              [("A", "Every layer of the software stack, a device picker, real kernel names", "5.6 (leaves 5.6 → rejoin 5.7)"),
               ("B", "Shrink the MNIST model to INT8", "5.9 (leaves 5.9 → rejoin 5.C)"),
               ("C", "Prove data parallelism on one GPU", "5.9 (leaves 5.9 → rejoin 5.C)")],
              "1–1½ hours", "gpu", "Hwu, Kirk & El Hajj Ch 1 · D2L §13.5–13.6",
              extra="🥾 **Side Trails are optional.** Nothing in a later Core Lab needs them."),
       how_to_run(gpu=True), SETUP_MD, VERSIONS, GPU_SETUP] + st5_A + [
    md("""
    ---
    ## Part B · Shrink the MNIST model to INT8  *(Section 5.9)*
    Train the Core Lab 3 network (784 → 128 → 10, 3 epochs), then store every weight as an 8-bit whole number plus one scale factor per layer, and compare size, speed and accuracy. INT8 here runs on the **CPU**, as on a phone or an edge board. (About 1 minute.)
    """),
    code("""
    import io, os                                    # io: an in-memory "file"; os: count the CPU cores
    from torchvision import datasets, transforms     # MNIST, and a converter from pictures to tensors
    torch.manual_seed(0)                             # a fixed random start, so runs match
    torch.set_num_threads(min(4, os.cpu_count() or 1))   # Colab has 2 CPU cores; use at most 4
    tf = transforms.ToTensor()                       # pixels 0..255 → floats 0..1
    train = datasets.MNIST("data", train=True, download=True, transform=tf)    # 60,000 training images
    test = datasets.MNIST("data", train=False, download=True, transform=tf)    # 10,000 test images
    train_loader = torch.utils.data.DataLoader(train, batch_size=64, shuffle=True)   # batches of 64
    X_test = torch.stack([test[i][0] for i in range(len(test))])   # all 10,000 test pictures in one tensor
    y_test = torch.tensor([test[i][1] for i in range(len(test))])  # and their right answers

    model = nn.Sequential(nn.Flatten(), nn.Linear(784, 128), nn.ReLU(), nn.Linear(128, 10))   # the Core Lab 3 network
    opt = torch.optim.SGD(model.parameters(), lr=0.1)   # gradient descent, learning rate 0.1
    loss_fn = nn.CrossEntropyLoss()                  # the loss for "which digit?"
    for epoch in range(3):                           # 3 epochs, on the CPU
        for x, y in train_loader:                    # one batch at a time
            loss = loss_fn(model(x), y)              # 1. predict and 2. measure the loss
            opt.zero_grad(); loss.backward(); opt.step()   # 3. slopes, 4. nudge every weight
    model.eval()                                     # finished training: switch to "using" mode

    def size_kb(m):                                  # the size of a model's saved weights, in KB
        buf = io.BytesIO()                           # an empty in-memory file
        torch.save(m.state_dict(), buf)              # save the weights into it
        return buf.tell() / 1024                     # its length in bytes ÷ 1,024

    def accuracy_and_ms(m):                          # accuracy on 10,000 test images, and the time for them
        with torch.no_grad():                        # only using the model, not training
            m(X_test)                                # a warm-up run
            best = float("inf")                      # the best of 20 timed runs, in ms
            for _ in range(20):                      # 20 runs (Colab's 2 cores make single timings jumpy)
                t = time.perf_counter()              # start the stopwatch
                pred = m(X_test).argmax(1)           # the guess for every test image
                best = min(best, (time.perf_counter() - t) * 1000)   # keep the fastest
        return (pred == y_test).float().mean().item(), best   # fraction right, and ms
    print("trained; threads used:", torch.get_num_threads())   # ready
    """),
    code("""
    # INT8: each nn.Linear keeps its weights as 8-bit whole numbers and a scale factor
    try:
        # the classic PyTorch way (prints a DeprecationWarning on recent versions, but works)
        qmodel = torch.ao.quantization.quantize_dynamic(model, {nn.Linear}, dtype=torch.qint8)
    # if your PyTorch has removed it, use its replacement, the torchao library
    except (AttributeError, RuntimeError, NotImplementedError):
        # torchao: PyTorch's new home for quantisation (on Colab: !pip install torchao)
        from torchao.quantization import quantize_, Int8DynamicActivationInt8WeightConfig
        # a copy of the model, so the FP32 one stays as it is
        import copy; qmodel = copy.deepcopy(model)
        # turn every nn.Linear's weights into INT8, in place
        quantize_(qmodel, Int8DynamicActivationInt8WeightConfig())
    # the same test for both models: size, time for 10,000 images, accuracy
    for name, m in [("FP32", model), ("INT8", qmodel)]:
        # measure this model
        acc, ms = accuracy_and_ms(m)
        # print one line per model
        print(f"{name}: size {size_kb(m):6.1f} KB   10,000 test images in {ms:5.1f} ms   accuracy {acc:.2%}")
    """),
    md("""
    ### ✏️ YOUR TURN (B)
    | | FP32 | INT8 |
    |---|---|---|
    | Size (KB) | | |
    | Time for 10,000 images (ms) | | |
    | Accuracy | | |

    1. The size dropped to about a quarter. Why a quarter? (Section 5.2: bytes per number.)
    2. Did the accuracy change? Would you ship the INT8 model on a phone?

    *Your answers:*
    """)] + st5_D + [md("""
    ---
    ## 🎓 Where next?
    Back to the Main Climb at Section 5.7 / 5.C (Core Lab 12), or on to the **GPUs Beyond AI** Side Trail notebook.
    """)]
nb("SideTrails_Step5_Stack_INT8_Parallel.ipynb", st5, gpu=True)

# ---- GPUs beyond AI (the old Lab 5C) ----
st6_parts = take(L5C, "## Part A ·", None)
st6_parts = fix(st6_parts, ("*(Unit 5.10)*", "*(Appendix G)*"), ("| AI (Unit 2) |", "| AI (Step 2) |"))
st6 = [header("trail", "Beyond AI", "GPUs Beyond AI", 5, "App. G (from 5.C)", "5.10", "",
              [("A", "A ray tracer: one thread per pixel", "App. G"),
               ("B", "Shadows and a moving light", "App. G"),
               ("C", "Monte Carlo: estimate π with 5 crore darts", "App. G")],
              "1–1½ hours", "gpu", "Hwu, Kirk & El Hajj Ch 2–3, Ch 17–18",
              extra="🥾 **Side Trail: leaves from 5.C → rejoin at the summit.**"),
       how_to_run(gpu=True), SETUP_MD, VERSIONS, GPU_SETUP, CUPY_SETUP] + st6_parts
nb("SideTrails_GPUs_Beyond_AI.ipynb", st6, gpu=True)
