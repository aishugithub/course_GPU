"""Shared helpers for building the course's Colab notebooks (.ipynb)."""
import json, pathlib, textwrap

OUT = pathlib.Path(__file__).resolve().parents[2] / "notebooks"   # course_GPU/notebooks
FOOTHOLD = "https://aishugithub.github.io/course_GPU/"
REPO_NB = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/"


def md(text):
    return ("markdown", textwrap.dedent(text).strip("\n"))


def code(text):
    return ("code", textwrap.dedent(text).strip("\n"))


GPU_SETUP = code("""
import time, subprocess
import numpy as np
import matplotlib.pyplot as plt
import torch

if torch.cuda.is_available():
    device = "cuda"
    print("✅ GPU found:", torch.cuda.get_device_name(0))
else:
    device = "cpu"
    print("⚠️ NO GPU! Go to Runtime → Change runtime type → T4 GPU → Save, then run this cell again.")
    print("   (The rest of the notebook will still run on the CPU, but you won't see any GPU speed-up.)")

def sync():
    # GPU work is asynchronous: wait for it to really finish before reading the clock
    if device == "cuda":
        torch.cuda.synchronize()

def timeit(fn, repeats=5):
    fn(); sync()                         # warm-up run (first GPU call has extra start-up cost)
    t0 = time.perf_counter()
    for _ in range(repeats):
        fn()
    sync()
    return (time.perf_counter() - t0) / repeats
""")


CUPY_SETUP = code("""
# CuPy lets Python compile and run small CUDA C kernels. It comes pre-installed on Colab.
try:
    import cupy as cp
    HAVE_CUPY = device == "cuda"
    print("CuPy", cp.__version__, "ready" if HAVE_CUPY else "(installed, but no GPU in this session)")
except ImportError:
    HAVE_CUPY = False
    print("CuPy not found. On Colab with a GPU, run:  !pip install cupy-cuda12x   then re-run this cell.")

def cuda_time_ms(launch, repeats=5):
    # time GPU work with CUDA events (they are recorded on the GPU itself)
    launch(); cp.cuda.Device().synchronize()
    start, end = cp.cuda.Event(), cp.cuda.Event()
    start.record()
    for _ in range(repeats):
        launch()
    end.record(); end.synchronize()
    return cp.cuda.get_elapsed_time(start, end) / repeats
""")


def how_to_run(gpu):
    runtime = (
        "3. **Switch on the GPU:** menu **Runtime → Change runtime type → Hardware accelerator: T4 GPU → Save**. "
        "(This lab needs it. If Colab says no GPU is available, wait a while and try again — the free tier has limits.)"
        if gpu else
        "3. **No GPU needed for this lab.** The default CPU runtime is fine — that is deliberate: you will compare against the GPU later."
    )
    return md(f"""
    ## ▶️ How to run this notebook

    1. **Save your own copy first:** menu **File → Save a copy in Drive**. Work in that copy — the original is read-only, and your copy is what you submit.
    2. **Run cells in order, top to bottom.** Click a grey code cell and press **Shift + Enter** (or the ▶ button on its left). Wait for it to finish (a ✓ and the output appear) before running the next one.
    {runtime}
    4. **Lost or confused?** Menu **Runtime → Restart session and run all** starts everything again from a clean slate.
    5. Cells marked **✏️ YOUR TURN** are exercises: change the code, run it again, and write your answer in the text cell below it (double-click a text cell to edit it).
    """)


def build(name, title, cells, gpu=False):
    nb_cells = []
    for kind, text in cells:
        lines = text.splitlines(keepends=True)
        cell = {"cell_type": kind, "metadata": {}, "source": lines}
        if kind == "code":
            cell.update({"execution_count": None, "outputs": []})
        nb_cells.append(cell)
    meta = {
        "colab": {"provenance": [], "toc_visible": True, "name": name},
        "kernelspec": {"display_name": "Python 3", "name": "python3"},
        "language_info": {"name": "python"},
    }
    if gpu:
        meta["accelerator"] = "GPU"
        meta["colab"]["gpuType"] = "T4"
    nb = {"nbformat": 4, "nbformat_minor": 0, "metadata": meta, "cells": nb_cells}
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / name
    p.write_text(json.dumps(nb, indent=1, ensure_ascii=False), encoding="utf-8")
    print("wrote", p, len(nb_cells), "cells")
    return p
