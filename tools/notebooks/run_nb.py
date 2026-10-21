"""Execute a notebook's code cells in order (like Colab 'Run all'), headless.
Shell lines starting with '!' or '%' are skipped. Cells containing the marker
'# GPU-ONLY' are skipped when no CUDA device is present."""
import json, sys, os, io, contextlib, time
import matplotlib
matplotlib.use("Agg")

path = sys.argv[1]
nb = json.load(open(path, encoding="utf-8"))
ns = {"__name__": "__main__"}
os.chdir(os.path.dirname(os.path.abspath(__file__)))
try:
    import torch
    has_cuda = torch.cuda.is_available()
    if os.name == "nt":   # test-only: Windows can't start DataLoader workers from exec()'d code
        import torch.utils.data as _tud
        _orig_init = _tud.DataLoader.__init__
        def _init(self, *a, **k):
            k["num_workers"] = 0
            _orig_init(self, *a, **k)
        _tud.DataLoader.__init__ = _init
except Exception:
    has_cuda = False

n = 0
for idx, c in enumerate(nb["cells"]):
    if c["cell_type"] != "code":
        continue
    n += 1
    src = "".join(c["source"])
    if "# GPU-ONLY" in src and not has_cuda:
        print(f"--- cell {n}: SKIPPED (needs GPU)")
        continue
    src = "\n".join(l for l in src.splitlines() if not l.lstrip().startswith(("!", "%")))
    if os.name == "nt":
        src = src.replace("num_workers=2", "num_workers=0")   # test-only: Windows can't fork workers from exec()
    buf = io.StringIO()
    t0 = time.time()
    try:
        with contextlib.redirect_stdout(buf):
            exec(compile(src, f"cell{n}", "exec"), ns)
    except Exception as e:
        print(f"--- cell {n}: ERROR {type(e).__name__}: {e}")
        print(buf.getvalue()[-1500:])
        sys.exit(1)
    out = buf.getvalue()
    print(f"--- cell {n} ok ({time.time()-t0:.1f}s)")
    if out.strip():
        print("   " + out.strip()[-700:].replace("\n", "\n   "))
print("ALL CELLS OK")
