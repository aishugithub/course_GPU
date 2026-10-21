# Foothold — GPU Computing for AI · HANDOFF

Single source of truth for the course's status. Read this first in any new session.

## What this is
A 1-credit, skill-based (0-0-2) Foothold course: **why AI runs on GPUs and how the CPU hands work to the GPU**.
It starts with AI basics (no GPU yet), then CPU vs GPU, GPU internals, CPU–GPU teamwork, speed tricks, and real projects.
Built 2026-10-17/18. Syllabus draft: https://claude.ai/code/artifact/c058ab5c-6645-4aa9-a85f-f54416ebc774

## Status: complete first version
- **35 lessons** in `src/lessons/`, organised as Module 0 (AI foundations) + Modules 1–5, which match syllabus Units 1–5 / CO1–CO5
  (reorganised 2026-10-21 from the original 7 modules by `tools/migrate_to_module0.py` + `tools/run_migration.py`; kept for the record).
- **8 lab notebooks (Lab0–Lab4, Lab5A, Lab5B) + 1 mini-project template** in `notebooks/` (Google Colab, split into Parts that match the lessons).
- Every lesson: 4 interactive sections + quiz, a 📖 word bank, a 📘 textbook strip, and a 🧪 "Open in Colab" lab card.
- Build passes (`npx vite build`); an automated click-through of all 35 lessons × 5 tabs found no runtime errors.
- Labs 1–7 were test-run end to end on CPU (`tools/notebooks/run_nb.py`). **Not yet run on a real GPU:** the CuPy kernel
  cells in Labs 3, 4 and 5A and the GPU-only cells skip on CPU. Run each lab once on Colab with a T4 before teaching.

| Foothold module (= syllabus unit) | Lessons | Lab notebook |
|---|---|---|
| M0 What Is AI, Really? (foundation for syllabus Unit 1) | 0.1–0.5, 0.C | Lab0_AI_Basics (CPU only) |
| M1 Why Is AI So Hungry? (Unit 1, CO1) | 1.1–1.3, 1.C | Lab1_AI_Is_Hungry (CPU only) |
| M2 CPU vs GPU (Unit 2, CO2) | 2.1–2.4, 2.C | Lab2_CPU_vs_GPU |
| M3 Inside a GPU (Unit 3, CO3) | 3.1–3.4, 3.C | Lab3_Inside_a_GPU (CuPy kernels) |
| M4 CPU–GPU Teamwork (Unit 4, CO4) | 4.1–4.4, 4.C | Lab4_CPU_GPU_Teamwork (CuPy kernels) |
| M5 Making AI Fast & Real Projects (Unit 5, CO5) | 5.1–5.5 (5.5 = speed-up capstone), 5.6–5.9, 5.C | Lab5A_Why_GPUs_Make_AI_Fast (CuPy) + Lab5B_GPUs_in_Real_Projects + MiniProject_Template |

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
  Unit 0.1 is hand-written (no spec): edit `src/lessons/Unit0_1.jsx` directly.
  You can also edit a generated `.jsx` directly, but regenerating from its spec will overwrite that.
- Notebooks: `cd tools/notebooks && python lab4.py` regenerates `notebooks/Lab4_….ipynb`.
  Test (CPU): `python tools/notebooks/run_nb.py notebooks/Lab4_….ipynb` (needs numpy, torch, torchvision, matplotlib, scikit-learn, transformers).
- Palette rule: never name a variable `C` inside a widget (it hides the colour palette).
- A `<` inside a section title must be written `&lt;` (titles are inserted into JSX).

## Before deploying
1. Backend: the dedicated Google Sheet **course_GPU** exists
   (https://docs.google.com/spreadsheets/d/18TU3ZbowIEhBUkElNjx9XxJns9KA6q_bdiCZ0TFpISs/edit). Paste `Code.gs` into its
   Apps Script, run menu "Foothold GPU → 1. Set up sheets", deploy as a Web App: DONE 2026-10-21, and the /exec URL is in
   `config/gas.config.js`. The Sheet's menu also has
   "2. Refresh progress summary" (Summary tab per student, completion count per unit on the Units tab).
2. GitHub repo: https://github.com/aishugithub/course_GPU (public). Push, and enable Pages (same workflow as course_COA: `.github/workflows/deploy.yml`).
3. Run every lab once on a Colab T4 and note real timings; adjust lesson numbers if any are far off.

## Known simplifications (stated in the lessons)
Timing models in widgets are illustrative and say so; hardware figures are published T4/A100/L4 peaks; cloud prices are labelled assumptions.
