import json, re, pathlib, shutil
from migrate_to_module0 import remap_text, unit, LAB

T = pathlib.Path(__file__).parent
R = T.parent

# 1) lesson specs
old_specs = sorted((T / "specs").glob("*.jsx"))
new_dir = T / "specs_new"
new_dir.mkdir(exist_ok=True)
for f in old_specs:
    s = f.read_text(encoding="utf-8")
    meta_line = s.split("//@@META", 1)[1].split("//@@", 1)[0]
    meta = json.loads(meta_line.strip())
    old_unit = meta["unit"]
    body = remap_text(s.replace(meta_line, "\n__META__\n"))
    meta["unit"] = unit(old_unit)
    meta["module"] = int(meta["unit"].split(".")[0])
    meta["lab"] = remap_text(meta["lab"])
    meta["labNo"] = LAB[str(meta["labNo"])]
    body = body.replace("\n__META__\n", "\n" + json.dumps(meta, ensure_ascii=False) + "\n")
    (new_dir / (meta["unit"].replace(".", "_") + ".jsx")).write_text(body, encoding="utf-8")
    print(f"{f.name:10s} -> {meta['unit']}")

# 2) the hand-written first lesson
u11 = (R / "src/lessons/Unit1_1.jsx").read_text(encoding="utf-8")
u01 = remap_text(u11).replace("Unit1_1", "Unit0_1")
(R / "src/lessons/Unit0_1.jsx").write_text(u01, encoding="utf-8")

# 3) textbook map keys in the assembler
a = (T / "assemble.py").read_text(encoding="utf-8")
a = re.sub(r'^(\s*)"([1-7]\.(?:\d|C))":', lambda m: f'{m.group(1)}"{unit(m.group(2))}":', a, flags=re.M)
(T / "assemble.py").write_text(a, encoding="utf-8")

# 4) notebook generators
NB = {"lab01.py": "lab0.py", "lab02.py": "lab1.py", "lab03.py": "lab2.py", "lab04.py": "lab3.py",
      "lab05.py": "lab4.py", "lab06.py": "lab5a.py", "lab07.py": "lab5b.py", "miniproject.py": "miniproject.py"}
for old, new in NB.items():
    p = T / "notebooks" / old
    s = remap_text(p.read_text(encoding="utf-8"))
    # lesson numbers in the notebooks' intro tables appear without the word "Unit"
    s = re.sub(r"\| ([1-7]\.(?:\d|C)) ", lambda m: f"| {unit(m.group(1))} ", s)
    (T / "notebooks" / new).write_text(s, encoding="utf-8")
    if new != old:
        p.unlink()
print("done")
