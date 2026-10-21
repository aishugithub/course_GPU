# Foothold — GPU Computing for AI · HANDOFF

Single source of truth for the course's status. Read this first in any new session.

## What this is
A 1-credit, skill-based (0-0-2) Foothold course: **why AI runs on GPUs and how the CPU hands work to the GPU**.
It starts with AI basics (no GPU yet), then CPU vs GPU, GPU internals, CPU–GPU teamwork, speed tricks, and real projects.
Built 2026-10-17/18. Syllabus draft: https://claude.ai/code/artifact/c058ab5c-6645-4aa9-a85f-f54416ebc774

## Status: complete first version
- **35 lessons** in `src/lessons/` (7 modules × 4–5 units + a capstone each), all registered in `config/course.config.js`.
- **7 lab notebooks + 1 mini-project template** in `notebooks/` (Google Colab, one per module, split into Parts that match the units).
- Every lesson: 4 interactive sections + quiz, a 📖 word bank, a 📘 textbook strip, and a 🧪 "Open in Colab" lab card.
- Build passes (`npx vite build`); an automated click-through of all 35 lessons × 5 tabs found no runtime errors.
- Labs 1–7 were test-run end to end on CPU (`tools/notebooks/run_nb.py`). **Not yet run on a real GPU:** the CuPy kernel
  cells in Labs 4–6 and the GPU-only cells skip on CPU. Run each lab once on Colab with a T4 before teaching.

| Module | Units | Lab |
|---|---|---|
| M1 What Is AI, Really? | 1.1–1.5, 1.C | Lab01_AI_Basics (CPU only) |
| M2 Why Is AI So Hungry? | 2.1–2.3, 2.C | Lab02_AI_Is_Hungry (CPU only) |
| M3 CPU vs GPU | 3.1–3.4, 3.C | Lab03_CPU_vs_GPU |
| M4 Inside a GPU | 4.1–4.4, 4.C | Lab04_Inside_a_GPU (CuPy kernels) |
| M5 CPU–GPU Teamwork | 5.1–5.4, 5.C | Lab05_CPU_GPU_Teamwork (CuPy kernels) |
| M6 Why GPUs Make AI Fast | 6.1–6.4, 6.C | Lab06_Why_GPUs_Make_AI_Fast (CuPy kernels) |
| M7 GPUs in Real AI Projects | 7.1–7.4, 7.C | Lab07_GPUs_in_Real_Projects + MiniProject_Template |

## How the Colab links work
Lessons link to `https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/<file>.ipynb`.
That only works once this folder is pushed to a **public** GitHub repo named `course_GPU` under `aishugithub`.
Students click → File → Save a copy in Drive → Runtime → T4 GPU.

## Textbooks (agreed with Aishu)
GPU modules follow the COA books: Hamacher 6e (§12.1–12.2.1, Ch 7, 8, 9), Hennessy & Patterson 5e Ch 4, Stallings 11e §2.2–2.4, Mano 3e Ch 9.
Plus Kirk & Hwu, *Programming Massively Parallel Processors* 4e (main GPU text) and *Dive into Deep Learning* (d2l.ai, free) for AI basics.
The per-unit map lives in `tools/assemble.py` (`BOOKS`).

## How to edit (tools/)
- Lessons are generated from specs: `tools/specs/<unit>.jsx` → `python tools/assemble.py src/lessons tools/specs/4_2.jsx`.
  The assembler wraps the spec's widgets in the standard shell (header, tabs, quiz, word bank, textbook strip, lab card).
  Unit 1.1 is hand-written (no spec): edit `src/lessons/Unit1_1.jsx` directly.
  You can also edit a generated `.jsx` directly, but regenerating from its spec will overwrite that.
- Notebooks: `cd tools/notebooks && python lab05.py` regenerates `notebooks/Lab05_….ipynb`.
  Test (CPU): `python tools/notebooks/run_nb.py notebooks/Lab05_….ipynb` (needs numpy, torch, torchvision, matplotlib, scikit-learn, transformers).
- Palette rule: never name a variable `C` inside a widget (it hides the colour palette).
- A `<` inside a section title must be written `&lt;` (titles are inserted into JSX).

## Before deploying
1. Backend: the dedicated Google Sheet **course_GPU** exists
   (https://docs.google.com/spreadsheets/d/18TU3ZbowIEhBUkElNjx9XxJns9KA6q_bdiCZ0TFpISs/edit). Paste `Code.gs` into its
   Apps Script, run menu "Foothold GPU → 1. Set up sheets", deploy as a Web App, and put the /exec URL in
   `config/gas.config.js` (it still points at the COA backend until then). The Sheet's menu also has
   "2. Refresh progress summary" (Summary tab per student, completion count per unit on the Units tab).
2. GitHub repo: https://github.com/aishugithub/course_GPU (public). Push, and enable Pages (same workflow as course_COA: `.github/workflows/deploy.yml`).
3. Run every lab once on a Colab T4 and note real timings; adjust lesson numbers if any are far off.

## Known simplifications (stated in the lessons)
Timing models in widgets are illustrative and say so; hardware figures are published T4/A100/L4 peaks; cloud prices are labelled assumptions.
