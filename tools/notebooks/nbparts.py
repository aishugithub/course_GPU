"""Helpers for the 12 Core Lab + Side Trail notebooks (Phase 2, Nov 2026).

The old per-unit generators (lab1.py … lab5c.py) are kept as the SOURCE of the lab cells: importing them
here builds their cell lists without writing the old notebooks. `take()` cuts a slice out of a cell list
by text markers, and `relabel()` renames the parts (e.g. Lab 2B's Parts A, D, E become Core Lab 5's A, B, C).
"""
import html
import pathlib
import re

import common

_real_build = common.build
common.build = lambda *a, **k: None          # importing the old generators must not write the old notebooks

import lab1, lab2a, lab2b, lab3, lab4, lab5a, lab5b, lab5c   # noqa: E402  (their `cells` lists)

common.build = _real_build
from common import md, code, how_to_run, build, GPU_SETUP, CUPY_SETUP   # noqa: E402,F401

BOOK_SRC = pathlib.Path(__file__).resolve().parents[2] / "book" / "src"
SITE = "https://aishugithub.github.io/course_GPU/"
BOOK = "A Billion Small Steps"
COURSE = "Hardware for AI"


def take(cells, start, end=None):
    """Cells from the one containing `start` (text before `start` in that cell is dropped) up to,
    not including, `end` (text from `end` on in that cell is dropped; a trailing '---' rule is removed)."""
    out, on = [], False
    for kind, text in cells:
        if not on:
            i = text.find(start)
            if i < 0:
                continue
            on, text = True, text[i:]
            if end and end in text[len(start):]:
                text = text[:len(start) + text[len(start):].find(end)]
                out.append((kind, _trim(text)))
                return [c for c in out if c[1].strip()]
            out.append((kind, text))
            continue
        if end and end in text:
            text = text[:text.find(end)]
            out.append((kind, _trim(text)))
            return [c for c in out if c[1].strip()]
        out.append((kind, text))
    assert on, f"marker not found: {start!r}"
    assert end is None, f"end marker not found: {end!r}"
    return out


def _trim(text):
    text = text.rstrip()
    if text.endswith("---"):
        text = text[:-3].rstrip()
    return text


def part_md(text):
    """A part's heading cell: always starts with a horizontal rule."""
    return md("---\n" + text.strip("\n"))


def relabel(cells, mapping):
    """Rename part letters in markdown and comments: mapping like {"D": "B", "E": "C"}.
    Touches '## Part X ·', 'Part X', 'Parts X and Y', 'YOUR TURN (X…)', '### X1 ·' and 'X1–X2'."""
    if not mapping:
        return cells

    def sub(text):
        def rep(m):
            return m.group(1) + mapping.get(m.group(2), m.group(2))
        text = re.sub(r"(\bParts? )([A-F])(?=\d?b?\b)", rep, text)
        text = re.sub(r"(\bParts [A-F],? (?:and )?)([A-F])(?=\b)", rep, text)
        text = re.sub(r"(YOUR TURN \()([A-F])(?=[\d)–b])", rep, text)
        text = re.sub(r"(–)([A-F])(?=\d)", rep, text)
        text = re.sub(r"(### )([A-F])(?=\d)", rep, text)
        text = re.sub(r"(\brun )([A-F])(?=\d\b)", rep, text)
        return text
    return [(k, sub(t)) for k, t in cells]


def fix(cells, *pairs):
    """Plain text replacements (old, new) across all cells; each `old` must be found somewhere."""
    for old, new in pairs:
        assert any(old in t for _, t in cells), f"fix: {old!r} not found"
        cells = [(k, t.replace(old, new)) for k, t in cells]
    return cells


def book_html(file, starts_with, nth=0):
    """The nth <pre class="py"> block in book/src/<file> whose code starts with `starts_with`."""
    s = (BOOK_SRC / file).read_text(encoding="utf-8")
    found = [html.unescape(m.group(1)) for m in re.finditer(r'<pre class="py">(.*?)</pre>', s, re.S)
             if html.unescape(m.group(1)).startswith(starts_with)]
    assert found, f"{file}: no code block starts with {starts_with!r}"
    return found[nth].strip("\n")


VERSIONS = code("""
# Which versions is this session running? The book's printed outputs used Colab's free Tesla T4
# with PyTorch 2.14.1 (CUDA 13.0 build) on 8 Nov 2026; small differences in your numbers are normal.
# If a cell fails after a Colab update: remove the "#" at the start of the next line, run this cell,
# then Runtime → Restart session (slow; only when needed).
# !pip install torch==2.14.1
import platform                                    # platform: tells us the Python version
import numpy, torch                                # NumPy and PyTorch, to read their version numbers
print("Python ", platform.python_version())        # the Python version
print("NumPy  ", numpy.__version__)                # the NumPy version
print("PyTorch", torch.__version__)                # the PyTorch version (and its CUDA build, after the +)
try:                                               # CuPy is only used by the CUDA C kernel labs
    import cupy                                    # try to load it
    print("CuPy   ", cupy.__version__)             # its version
except Exception:                                  # not installed, or no GPU for it in this session
    print("CuPy    not available in this session") # that is fine for this notebook
if torch.cuda.is_available():                      # is there an NVIDIA GPU in this session?
    print("GPU    ", torch.cuda.get_device_name(0))  # yes: its name (the book used a Tesla T4)
else:                                              # no GPU
    print("GPU     none (CPU runtime)")            # say so
""")


def header(kind, n, title, step, sections, lessons, observe, parts, minutes, gpu, textbooks, extra=""):
    """The first cell of a Core Lab or Side Trail notebook."""
    icon = "⛰ Core Lab" if kind == "core" else "🥾 Side Trails"
    label = f"{icon} {n}" if kind == "core" else f"{icon} · {n}"
    rows = "\n".join(f"| {p} | {what} | {where} |" for p, what, where in parts)
    run = ("Runs on a **GPU**: Runtime → Change runtime type → **T4 GPU**." if gpu == "gpu" else
           "Runs on the **CPU** on purpose: the default runtime is fine." if gpu == "cpu" else gpu)
    obs = f"\n**What you should see:** {observe}\n" if observe else ""
    text = (f"# {label} — {title}\n"
            f"**{BOOK} · {COURSE} · Step {step} · Book sections {sections} · Foothold lessons {lessons}**\n\n"
            f"Read the book sections first, then run this notebook from top to bottom. {run}\n{obs}\n"
            f"| Part | What you do | Book |\n|---|---|---|\n{rows}\n\n"
            f"⏱️ About {minutes}. 📘 Textbook: {textbooks}. Course site: {SITE}\n\n"
            + (extra.strip() + "\n\n" if extra else "")
            + "💬 **Every line of code has a comment** (after the `#`, or after `//` inside CUDA C). "
              "Read the comment, then the line it explains.")
    return ("markdown", text)
