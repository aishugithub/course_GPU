from common import md, code, how_to_run, build, FOOTHOLD, GPU_SETUP, CUPY_SETUP
from bookcells import book   # the code cells come from the book (Step 5, Section 5.10)

cells = [
md(f"""
# 🌈 Lab 5C — GPUs Beyond AI: A Ray Tracer
**Foothold · GPU Computing for AI · Unit 5 (closing lesson) · Book: Step 5, Section 5.10**

Everything in this course (thousands of threads, **one thread per output**, fed by a fast memory) is not special to AI.
Today you use the same pattern to **draw a 3-D picture**: one thread per pixel, each sending a ray of light into a scene of spheres.
Then you meet the same pattern in finance (Monte Carlo).

| Part | What you do | When |
|---|---|---|
| A | Trace one pixel in Python, then every pixel on the CPU and on the GPU; time them | In class (≈ 15 min) |
| B | Shadows, a moving light, and frames per second | At home (≈ 15 min) |
| C | The same pattern in finance: a Monte Carlo estimate of π | At home (≈ 15 min) |

📘 Textbook: Kirk & Hwu Ch 2–3 (kernels and threads, again). Course site: {FOOTHOLD}

💬 **Every line of code has a comment** (after `#` in Python, after `//` inside the CUDA C kernel). The code is the same as in the book, Section 5.10.
"""),
how_to_run(gpu=True),
md("## 0 · Setup — run both cells"),
GPU_SETUP,
CUPY_SETUP,

# ── Part A ──
md("""
---
## Part A · One Ray per Pixel  *(Unit 5.10)*

**How a ray tracer works.** The camera sits at the origin and looks into the screen. For each pixel:
1. Send a ray from the camera through that pixel.
2. Find the **nearest sphere** the ray hits (or none: then the pixel shows the sky).
3. Colour the hit point by how directly it faces the light.

Each pixel needs only the scene, never another pixel. **Every output is independent**, just like the cells of a matrix multiply in Unit 2.3.

### A1 · The scene
Each sphere is 7 numbers: its centre (x, y, z), its radius, and its colour (red, green, blue, each 0 to 1). The "floor" is a giant sphere.
"""),
book(5, "K_SCENE"),
md("""
### A2 · Trace ONE pixel, in plain Python
This function is the whole idea. Read it slowly: the GPU kernel in A4 does exactly these steps, line for line.
"""),
book(5, "K_TRACE"),
md("Now call it for **every** pixel of a small 160 × 90 image, one after another, like one CPU worker would."),
book(5, "K_PYTHON", after="""
plt.figure(figsize=(5, 3)); plt.imshow(small); plt.axis("off")   # show the picture, without axes
plt.title("160 × 90, plain Python"); plt.show()   # title, then draw it
"""),
md("""
### A3 · Every pixel at once on the CPU (NumPy)
A fair race needs a fast CPU version. NumPy runs the **same maths on whole arrays** (one number per pixel), using compiled code and the CPU's SIMD units (Unit 2).

⚠️ **Be honest about the race:** NumPy is not the fastest possible CPU version. It writes every in-between result to memory as a big array (20 lakh numbers each, for full HD), so it is **memory-bound**, while each GPU thread keeps its numbers in registers (Unit 3.4) and is **compute-bound**. A hand-written multi-core C version would close part of the gap. The GPU still wins by a wide margin.
"""),
book(5, "K_NUMPY"),
md("""
### A4 · Every pixel at once on the GPU: one thread per pixel
Here is the kernel. Compare it with `trace_pixel` above: **it is the same function**, written in CUDA C. The only new lines are the first ones, where each thread works out *which pixel is mine* (the 2-D grid from Unit 4.3).
"""),
book(5, "K_KERNEL"),
md("""
### A5 · The race: full-size pictures
Time the CPU (NumPy) and the GPU kernel at four sizes. The GPU time does not include copying the picture back to the CPU: a real renderer keeps the picture on the GPU and sends it straight to the screen.
"""),
book(5, "K_RACE", after="""
plt.figure(figsize=(8, 4.5)); plt.imshow(big); plt.axis("off")   # show the full-HD picture
plt.title("1920 × 1080, one GPU thread per pixel"); plt.show()   # title, then draw it
"""),
md("""
### ✏️ YOUR TURN (A)
1. Fill in the table from your run.

| Size | CPU (NumPy) | GPU kernel | Speed-up | GPU frames per second |
|---|---|---|---|---|
| 640 × 360 | | | | |
| 1920 × 1080 | | | | |
| 3840 × 2160 | | | | |

2. Games need 60 frames per second. Which sizes reach 60 on the GPU? On the CPU?
3. In the kernel, what is **one output**, and why are the outputs independent? Name the line that makes each thread pick its own pixel.
4. Run the race cell twice. Why do the smallest pictures' GPU times jump about from run to run? (Hint: Unit 4.4, launch overhead.)

*Your answers:*
"""),

# ── Part B ──
md("""
---
## Part B · Shadows and a Moving Light  *(at home)*

**Shadows** cost a second ray per lit pixel (towards the light), so each thread does more work. How much slower is it? Then the cell swings the light once round the scene in 60 frames and measures the frames per second.
"""),
book(5, "K_SHADOW", after="""
plt.figure(figsize=(8, 4.5)); plt.imshow(pic); plt.axis("off")   # the picture with shadows
plt.title("With shadows: a second ray per pixel"); plt.show()   # title, then draw it
fig, ax = plt.subplots(1, 4, figsize=(14, 2.3))   # four small pictures side by side
for i, im in enumerate(shown):   # each kept frame of the moving light
    ax[i].imshow(im); ax[i].axis("off"); ax[i].set_title(f"frame {15*i}")   # show it with its frame number
plt.show()   # draw them
"""),
md("""
### ✏️ YOUR TURN (B)
1. How much longer did a frame take with shadows? Is that close to "one extra ray per pixel"?
2. Add a fifth sphere: put a new row in `SPHERES` (re-run A1 and the kernel cell in A4, then this part). Try `[0.9, 0.6, -5.0, 0.7, 0.9, 0.8, 0.2]` (a yellow sphere behind). Does the frame rate change much? Why does each extra sphere cost every pixel a little?
3. Real games test rays against millions of triangles, not four spheres. Which GPU unit did NVIDIA add for exactly this test? (Unit 5.10)

*Your answers:*
"""),

# ── Part C ──
md("""
---
## Part C · The Same Pattern in Finance: Monte Carlo  *(at home)*

Banks price options by simulating lakhs of **independent** random futures and averaging them. The simplest Monte Carlo job: throw random darts at a 1 × 1 square. The fraction landing inside the quarter circle is π/4, so **π ≈ 4 × (darts inside) ÷ (all darts)**. One dart = one independent output.
"""),
book(5, "K_PI"),
md("""
### ✏️ YOUR TURN (C)
1. Run the cell with `N = 50_000` and then `N = 50_000_000`. How does the error in π change? (Monte Carlo needs **lots** of samples, which is why it suits the GPU.)
2. Fill in the "one pattern" table:

| Field | One output is … | Why are the outputs independent? |
|---|---|---|
| AI (Unit 2) | one cell of a matrix multiply | |
| Ray tracing (Part A) | | |
| Monte Carlo (Part C) | | |
| Weather simulation | one grid cell at one time step | |

*Your answers:*

---
## 🎓 Where next?
You have now used one idea, **one thread per independent output**, for AI, graphics and finance. The same skills (counting the work, CPU or GPU, mapping outputs to threads, memory and precision, profiling) are what GPU, graphics, HPC and AI-kernel engineers use every day.

**Mini-project idea:** extend this ray tracer (reflections, more spheres, an animation), or build another GPU application (an image filter, a heat-flow simulation), and plan, measure and optimise it like any AI task. Open `MiniProject_Template.ipynb` from the course site.
"""),
]

build("Lab5C_GPUs_Beyond_AI.ipynb", "Lab 5C", cells, gpu=True)
