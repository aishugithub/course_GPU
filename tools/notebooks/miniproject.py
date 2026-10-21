from common import md, code, how_to_run, build, FOOTHOLD, GPU_SETUP

cells = [
md(f"""
# 🎓 Mini-Project — CPU vs GPU on a Real AI Task
**Foothold · GPU Computing for AI · Final assessment (30%)**

Work in **pairs**. Choose ONE small AI task, plan it, run it on the CPU and on the GPU, find where the time goes, apply at least one optimisation, and report.

**Team:** *(names and roll numbers)*

**Task chosen** (tick one, or propose your own to your teacher):
- ☐ Image classification (e.g. Fashion-MNIST, CIFAR-10 with an MLP)
- ☐ Text sentiment (e.g. a small model from Hugging Face on movie reviews)
- ☐ Running a small pretrained model (e.g. distilgpt2 text generation, or an image model)
- ☐ Own idea: ______________

Course site: {FOOTHOLD}
"""),
how_to_run(gpu=True),
md("## 0 · Setup"),
GPU_SETUP,
md("""
---
## 1 · Plan  *(Units 1.1, 1.2, 5.3, 5.7)*
Before writing any training code, estimate:
| Quantity | Your estimate | How you got it |
|---|---|---|
| Parameters | | |
| Memory needed (GB) | | 2 B/param to run, ~16 to train + activations |
| FLOPs per epoch / per answer | | 6·N·D for training, 2·N per token for inference |
| Expected time on the T4 | | FLOPs ÷ (peak × utilisation), or bytes ÷ bandwidth |
| Compute-bound or memory-bound? | | roofline |
"""),
code("""
# ✏️ Your planning calculations here
params = 0
print("parameters:", params)
"""),
md("""
---
## 2 · Baseline: run it on the CPU
Load your data and model, train (or run) on the **CPU**, and time it honestly.
"""),
code("""
# ✏️ Data and model
"""),
code("""
# ✏️ CPU run + timing
"""),
md("""
---
## 3 · Run it on the GPU  *(Modules 2, 4)*
Same code, `device = "cuda"`. Remember: move the model once, synchronise before reading the clock.
"""),
code("""
# ✏️ GPU run + timing
"""),
md("""
---
## 4 · Where does the time go?  *(Unit 4.C)*
Time the phases (data, copy, compute) with `sync()`, or use the PyTorch profiler. Check `!nvidia-smi` while it runs.
"""),
code("""
# ✏️ Phase timings or profiler table
"""),
md("""
---
## 5 · Optimise  *(Module 5)*
Apply at least ONE: bigger batch · num_workers + pin_memory · no per-step sync · mixed precision (autocast) · data kept on the GPU · INT8/FP16 for inference.
Change one thing at a time and measure each.
"""),
code("""
# ✏️ Optimised version + timing
"""),
md("""
---
## 6 · Results
| Version | Time | Speed-up vs CPU | Accuracy / output quality | GPU memory |
|---|---|---|---|---|
| CPU baseline | | 1.0× | | — |
| GPU, first version | | | | |
| GPU, optimised | | | | |

---
## 7 · One-page report (write it here)
1. **Task and model** (2–3 sentences).
2. **Plan vs reality:** your estimates from section 1 vs your measurements. Where were you wrong, and why?
3. **Where the time went:** data vs copy vs compute (section 4).
4. **Optimisation:** what you changed, the speed-up, and whether accuracy changed.
5. **One thing you'd do with a bigger GPU or more time.**

---
### Assessment (30 marks)
| Criterion | Marks |
|---|---|
| Plan with correct reasoning (memory, FLOPs, limit) | 6 |
| Working CPU and GPU runs, honestly timed | 8 |
| Time breakdown / profiling | 5 |
| At least one measured optimisation | 6 |
| Report clarity and demo/viva | 5 |
"""),
]

build("MiniProject_Template.ipynb", "Mini-project", cells, gpu=True)
