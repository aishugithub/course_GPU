"""The labs' code cells come straight from the book, so the book and the labs can never disagree.

The book's lab code lives in course_GPU/book/tools/make_step<N>.py as L.cell("KEY", \"\"\"...\"\"\") calls
(run for real when the book is built). `book(step, key)` returns that cell as a notebook code cell,
with its end-of-line comments exactly as written (in the book they are printed above each line).
"""
import ast
import pathlib
import textwrap

from common import code

BOOK_TOOLS = pathlib.Path(__file__).resolve().parents[2] / "book" / "tools"
_CACHE = {}


def _cells(step):
    if step not in _CACHE:
        tree = ast.parse((BOOK_TOOLS / f"make_step{step}.py").read_text(encoding="utf-8"))
        found = {}
        for node in ast.walk(tree):
            if (isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == "cell"
                    and len(node.args) >= 2 and isinstance(node.args[0], ast.Constant) and isinstance(node.args[1], ast.Constant)):
                found[node.args[0].value] = textwrap.dedent(node.args[1].value).strip("\n")
        _CACHE[step] = found
    return _CACHE[step]


def book(step, key, before="", after="", replace=()):
    """The book's cell `key` from Step `step`, optionally with extra lines before or after it, and with
    (old, new) text replacements where the lab must differ from our book run (e.g. sizes for Colab's T4)."""
    body = _cells(step)[key]
    for old, new in replace:
        assert old in body, f"{key}: {old!r} not found"
        body = body.replace(old, new)
    parts = [textwrap.dedent(before).strip("\n"), body, textwrap.dedent(after).strip("\n")]
    return code("\n".join(p for p in parts if p))
