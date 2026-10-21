from common import md, code, how_to_run, build, FOOTHOLD, GPU_SETUP

cells = [
md(f"""
# 🛠️ Lab 5B — GPUs in Real AI Projects
**Foothold · GPU Computing for AI · Module 5**

The practical skills for real projects: inspect the software stack, measure memory, survive "CUDA out of memory", understand multi-GPU training, plan a project, and run a real language model on the GPU.

| Part | What you do | Goes with Foothold unit |
|---|---|---|
| A | Versions, a portable device picker, real kernel names | 5.6 The Software Stack |
| B | Watch memory grow step by step; check the 16-bytes rule | 5.7 Will It Fit? |
| C | Cause an OOM, read it, fix it; catch a leak | 5.8 nvidia-smi & Out-of-Memory |
| D | Prove data parallelism on one GPU | 5.9 Many GPUs & Other Accelerators |
| E | Plan a project, then run a real language model | 5.C Grand Capstone |

⏱️ About 2 hours. 📘 Textbook: D2L Ch 13 (computational performance, multiple GPUs) · Kirk & Hwu Ch 1 and 16 · Hamacher Ch 8, §12.3–12.5. Course site: {FOOTHOLD}
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
code("""
print("PyTorch      :", torch.__version__)
print("Built for CUDA:", torch.version.cuda)          # None = a CPU-only build
print("cuDNN        :", torch.backends.cudnn.version())
print("GPU available:", torch.cuda.is_available())
"""),
code("""
!nvidia-smi --query-gpu=name,driver_version --format=csv
"""),
md("**A portable device picker:** the same code runs on NVIDIA, Apple or CPU."),
code("""
if torch.cuda.is_available():
    dev = "cuda"
elif getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
    dev = "mps"
else:
    dev = "cpu"
print("Using:", dev)
"""),
md("**Real kernel names:** profile a small model and look for GEMM (matrix-multiply) kernels, element-wise kernels and copies."),
code("""
from torch import nn
from torch.profiler import profile, ProfilerActivity
net = nn.Sequential(nn.Linear(1024, 4096), nn.ReLU(), nn.Linear(4096, 10)).to(device)
x_cpu = torch.randn(256, 1024)
acts = [ProfilerActivity.CPU] + ([ProfilerActivity.CUDA] if device == "cuda" else [])
with profile(activities=acts) as prof:
    for _ in range(5):
        y = net(x_cpu.to(device))
    sync()
sort_key = "cuda_time_total" if device == "cuda" else "cpu_time_total"
print(prof.key_averages().table(sort_by=sort_key, row_limit=12))
"""),
md("""
### ✏️ YOUR TURN (A)
1. Write down the PyTorch, CUDA and driver versions. Is the driver new enough for the CUDA build (Unit 5.6's rule)?
2. In the profiler table, find one GEMM kernel, one element-wise (ReLU) kernel and one memory copy. Copy their names here.

*Your answers:*
"""),

# ── Part B ──
md("""
---
## Part B · Memory, Step by Step  *(Unit 5.7)*

A wide network (about 2 crore parameters) trained in **FP32 with Adam**: weights 4 + gradients 4 + Adam's two states 4 + 4 = **16 bytes per parameter**, plus activations. Watch `memory_allocated()` after each stage.
"""),
code("""
def mem_mb():
    return torch.cuda.memory_allocated() / 1e6 if device == "cuda" else float("nan")

if device == "cuda":
    torch.cuda.empty_cache(); torch.cuda.reset_peak_memory_stats()
stages = [("start", mem_mb())]
model = nn.Sequential(nn.Linear(784, 4096), nn.ReLU(), nn.Linear(4096, 4096), nn.ReLU(), nn.Linear(4096, 10)).to(device)
n_params = sum(p.numel() for p in model.parameters())
stages.append(("model created (weights)", mem_mb()))
x = torch.randn(512, 784, device=device); y = torch.randint(0, 10, (512,), device=device)
loss = nn.functional.cross_entropy(model(x), y)
stages.append(("after forward (+ activations)", mem_mb()))
loss.backward()
stages.append(("after backward (+ gradients, − activations)", mem_mb()))
opt = torch.optim.Adam(model.parameters())
opt.step()
stages.append(("after Adam step (+ m and v states)", mem_mb()))

for name, mb in stages:
    print(f"{name:45s} {mb:9.1f} MB")
print(f"\\nParameters: {n_params:,}")
print(f"Prediction, weights + grads + Adam = 16 B/param: {16 * n_params / 1e6:.0f} MB")
"""),
md("**Activations grow with the batch:** measure the peak memory of one forward + backward at several batch sizes."),
code("""
for B in [64, 256, 1024, 4096]:
    if device == "cuda":
        torch.cuda.empty_cache(); torch.cuda.reset_peak_memory_stats()
    xb = torch.randn(B, 784, device=device); yb = torch.randint(0, 10, (B,), device=device)
    base = mem_mb()
    nn.functional.cross_entropy(model(xb), yb).backward()
    peak = torch.cuda.max_memory_allocated() / 1e6 if device == "cuda" else float("nan")
    print(f"batch {B:5d}: peak extra memory for this step ≈ {peak - base:8.1f} MB")
    model.zero_grad(set_to_none=True)
"""),
md("""
### ✏️ YOUR TURN (B)
1. Which stage added the most memory? Did the final number match the 16-bytes-per-parameter prediction (roughly)?
2. Roughly how did the activation memory change when the batch went from 1,024 to 4,096?

*Your answers:*
"""),

# ── Part C ──
md("""
---
## Part C · Out of Memory: Cause It, Read It, Fix It  *(Unit 5.8)*

We ask for a batch far too big for the T4 and **catch** the error so the notebook keeps running.
"""),
code("""
def try_batch(B, amp=False):
    if device == "cuda":
        torch.cuda.empty_cache()
    try:
        xb = torch.randn(B, 784, device=device)
        with torch.autocast(device_type="cuda", dtype=torch.float16, enabled=amp and device == "cuda"):
            h = model(xb)
        h.float().sum().backward()
        model.zero_grad(set_to_none=True)
        print(f"batch {B:,} (amp={amp}): ✅ worked")
    except torch.cuda.OutOfMemoryError as e:
        print(f"batch {B:,} (amp={amp}): 💥 OutOfMemoryError\\n   {str(e).splitlines()[0][:300]}")
    finally:
        if device == "cuda":
            torch.cuda.empty_cache()

if device == "cuda":
    try_batch(400_000)              # far too big
    try_batch(100_000)              # fix 1: smaller batch
    try_batch(150_000, amp=True)    # fix 2: mixed precision roughly halves activation memory
else:
    print("Needs a GPU: skipped.")
"""),
md("""
**The classic leak:** collecting model outputs during evaluation **without** `torch.no_grad()` keeps every batch's graph and activations alive.
"""),
code("""
def eval_memory(use_no_grad, batches=15):
    if device == "cuda":
        torch.cuda.empty_cache()
    kept, trace = [], []
    for _ in range(batches):
        xb = torch.randn(2048, 784, device=device)
        if use_no_grad:
            with torch.no_grad():
                kept.append(model(xb))
        else:
            kept.append(model(xb))              # graph + activations kept alive!
        trace.append(mem_mb())
    del kept
    return trace

if device == "cuda":
    leak, ok = eval_memory(False), eval_memory(True)
    plt.figure(figsize=(6, 3.5))
    plt.plot(leak, "o-", c="tab:red", label="without no_grad (leak)")
    plt.plot(ok, "s-", c="tab:green", label="with torch.no_grad()")
    plt.xlabel("evaluation batch"); plt.ylabel("memory allocated (MB)"); plt.legend(); plt.grid(alpha=0.3)
    plt.title("A climbing curve = a leak"); plt.show()
else:
    print("Needs a GPU: skipped.")
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
code("""
torch.manual_seed(0)
net = nn.Sequential(nn.Linear(784, 256), nn.ReLU(), nn.Linear(256, 10)).to(device)
X = torch.randn(256, 784, device=device); Y = torch.randint(0, 10, (256,), device=device)

# one 'GPU' with the whole batch
net.zero_grad()
nn.functional.cross_entropy(net(X), Y).backward()
full = [p.grad.clone() for p in net.parameters()]

# four 'GPUs', 64 examples each, then average (= all-reduce)
slice_grads = []
for xs, ys in zip(X.chunk(4), Y.chunk(4)):
    net.zero_grad()
    nn.functional.cross_entropy(net(xs), ys).backward()
    slice_grads.append([p.grad.clone() for p in net.parameters()])
averaged = [sum(g[i] for g in slice_grads) / 4 for i in range(len(full))]

diff = max((a - b).abs().max().item() for a, b in zip(full, averaged))
print(f"Largest difference between full-batch and averaged gradients: {diff:.2e}")
print("✅ Identical (up to rounding): data parallelism computes the SAME update." if diff < 1e-5 else "Hmm, check the code.")
"""),
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
code("""
GPUS = {"T4": (16, 65e12, 320e9, 35), "L4": (24, 121e12, 300e9, 70), "A100-40": (40, 312e12, 1555e9, 250), "A100-80": (80, 312e12, 2000e9, 350)}

def plan_train(name, params, tokens):
    need = params * 18 / 1e9 + 0.5
    print(f"\\n{name}: training needs ≈ {need:.1f} GB")
    for g, (mem, tf, bw, price) in GPUS.items():
        n = max(1, int(-(-need // mem)))
        hours = 6 * params * tokens / (tf * 0.35) / 3600 / n
        print(f"   {g:8s} {n} GPU(s)  {hours:8.2f} h  ≈ ₹{hours * n * price:,.0f}")

def plan_chat(name, params, answers, bytes_per=2):
    need = params * bytes_per * 1.2 / 1e9 + 0.5
    print(f"\\n{name}: running needs ≈ {need:.1f} GB")
    for g, (mem, tf, bw, price) in GPUS.items():
        n = max(1, int(-(-need // mem)))
        hours = answers * 270 * (params * bytes_per / (bw * 0.6)) / 8 / 3600 / n
        print(f"   {g:8s} {n} GPU(s)  {hours:8.2f} GPU-h/day  ≈ ₹{hours * n * price:,.0f}/day")

plan_chat("Helpdesk chatbot, 7B, FP16", 7e9, 20_000)
plan_chat("Helpdesk chatbot, 7B, INT8", 7e9, 20_000, bytes_per=1)
plan_train("Fine-tune a 1B model on 50M tokens", 1e9, 50e6)
"""),
md("""
**A real language model.** `distilgpt2` has 82 million parameters (download ≈ 350 MB). Generate 100 tokens on the CPU and on the GPU.
Prediction (Unit 5.3): each token reads all the weights, so on the T4 in FP16 the time per token is at least 82M × 2 bytes ÷ 320 GB/s ≈ 0.5 ms (≈ 2,000 tokens/s at most).
"""),
code("""
from transformers import AutoTokenizer, AutoModelForCausalLM
name = "distilgpt2"
tok = AutoTokenizer.from_pretrained(name)
prompt = "The GPU is fast because"

for dev in (["cpu", "cuda"] if device == "cuda" else ["cpu"]):
    dtype = torch.float16 if dev == "cuda" else torch.float32
    lm = AutoModelForCausalLM.from_pretrained(name, torch_dtype=dtype).to(dev)
    ids = tok(prompt, return_tensors="pt").to(dev)
    lm.generate(**ids, max_new_tokens=5, do_sample=False, pad_token_id=tok.eos_token_id)   # warm-up
    if dev == "cuda":
        torch.cuda.synchronize(); torch.cuda.reset_peak_memory_stats()
    t0 = time.perf_counter()
    out = lm.generate(**ids, max_new_tokens=100, min_new_tokens=100, do_sample=False, pad_token_id=tok.eos_token_id)
    if dev == "cuda":
        torch.cuda.synchronize()
    dt = time.perf_counter() - t0
    mem = f", peak memory {torch.cuda.max_memory_allocated() / 1e6:.0f} MB" if dev == "cuda" else ""
    print(f"{dev.upper():4s} ({str(dtype)[6:]}): {100 / dt:6.0f} tokens/s{mem}")
print("\\nSample output:\\n", tok.decode(out[0], skip_special_tokens=True)[:300])
"""),
md("""
### ✏️ YOUR TURN (E) — record your results
| | CPU | GPU (T4, FP16) |
|---|---|---|
| Tokens per second | | |
| Peak GPU memory | — | |
| Bandwidth limit (predicted) | — | ≈ 2,000 tokens/s |

1. How far below the bandwidth limit was the real GPU speed? Explain using Amdahl's law and launch overheads (Units 2.4, 4.4).
2. Using the planner, which GPU would you recommend for the helpdesk chatbot, and why? State your assumptions.

*Your answers:*

---
## 🎓 Course wrap-up
You can now explain and measure every link in the chain: **AI = multiply-adds → GPUs do them in parallel → the CPU feeds the GPU over PCIe → speed comes from reuse, low precision and good feeding → real projects are planned by memory, time and cost.**

**Next:** your mini-project. Open `MiniProject_Template.ipynb` from the course site.
"""),
]

build("Lab5B_GPUs_in_Real_Projects.ipynb", "Lab 5B", cells, gpu=True)
