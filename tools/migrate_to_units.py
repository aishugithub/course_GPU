"""One-time migration (2026-11-01): renumber Foothold and the labs so that Unit n = Module n = book Step n = Lab n.

Old: M0 AI foundations (0.1–0.5, 0.C), M1 hungry (1.1–1.3, 1.C), M2 CPU vs GPU (2.1–2.4, 2.C), M3–M5.
New: M1 = old M0 (1.1–1.5, 1.C); M2 = old M1 + M2 (2.1–2.4 with 2.4 = the Compute Bill capstone, then 2.5–2.8, 2.C);
     M3–M5 unchanged.
Labs: 0 → 1, 1 → 2A, 2 → 2B; 3, 4, 5A, 5B unchanged.
Only numbers after the words Unit/Units/lesson/Module/Lab are remapped ("1.5 hours" is left alone), and
references to the COA course ("COA Unit 5") are left alone.

    python tools/migrate_to_units.py        (run once, from course_GPU/)
"""
import json
import pathlib
import re
import shutil

T = pathlib.Path(__file__).parent
R = T.parent
UNIT = {"0.1": "1.1", "0.2": "1.2", "0.3": "1.3", "0.4": "1.4", "0.5": "1.5", "0.C": "1.C",
        "1.1": "2.1", "1.2": "2.2", "1.3": "2.3", "1.C": "2.4",
        "2.1": "2.5", "2.2": "2.6", "2.3": "2.7", "2.4": "2.8", "2.C": "2.C"}
MODULE = {"0": "1", "1": "2", "2": "2"}
LAB = {"0": "1", "1": "2A", "2": "2B"}
LABFILE = {"Lab0_AI_Basics": "Lab1_AI_Basics", "Lab1_AI_Is_Hungry": "Lab2A_AI_Is_Hungry", "Lab2_CPU_vs_GPU": "Lab2B_CPU_vs_GPU"}


def unit(old):
    return UNIT.get(old, old)


UREF = r"[0-5]\.(?:\d|C)"
SEP = r"\s*(?:,|and|or|–|-|/|to)\s*"


def remap_text(s):
    for a, b in LABFILE.items():
        s = s.replace(a, b)
    # Unit / Units / lesson followed by one or more lesson numbers (not "COA Unit 5")
    s = re.sub(rf"(?<!COA )\b(Units?|UNIT|[Ll]essons?)(\s+)({UREF}(?:{SEP}{UREF})*)(?!\.?\d)",
               lambda m: m.group(1) + m.group(2) + re.sub(UREF, lambda x: unit(x.group(0)), m.group(3)), s)
    # Module / Modules / MODULE followed by one or more numbers
    s = re.sub(r"(?<!COA )\b(Modules?|MODULE)(\s+)([0-5](?:\s*(?:,|and|–|-)\s*[0-5])*)\b(?!\.\d)",
               lambda m: m.group(1) + m.group(2) + re.sub(r"[0-5]", lambda x: MODULE.get(x.group(0), x.group(0)), m.group(3)), s)
    # Lab / Labs / LAB numbers (5A and 5B stay as they are)
    s = re.sub(r"\b(Labs?|LAB)(\s+)([0-5](?![0-9AB])(?:\s*(?:,|and|–|-)\s*[0-5](?![0-9AB]))*)",
               lambda m: m.group(1) + m.group(2) + re.sub(r"[0-5]", lambda x: LAB.get(x.group(0), x.group(0)), m.group(3)), s)
    return s


def main():
    tmp = T / "_migrate_tmp"
    if tmp.exists():
        shutil.rmtree(tmp)
    (tmp / "specs").mkdir(parents=True)
    (tmp / "notebooks").mkdir()

    # 1) lesson specs: remap the text, rewrite META, new file names
    for f in sorted((T / "specs").glob("*.jsx")):
        s = f.read_text(encoding="utf-8")
        meta_line = s.split("//@@META", 1)[1].split("//@@", 1)[0]
        meta = json.loads(meta_line.strip())
        body = remap_text(s.replace(meta_line, "\n__META__\n"))
        meta["unit"] = unit(meta["unit"])
        meta["module"] = int(meta["unit"].split(".")[0])
        meta["lab"] = remap_text(meta["lab"])
        meta["labNo"] = LAB.get(str(meta["labNo"]), str(meta["labNo"]))
        body = body.replace("\n__META__\n", "\n" + json.dumps(meta, ensure_ascii=False) + "\n")
        (tmp / "specs" / (meta["unit"].replace(".", "_") + ".jsx")).write_text(body, encoding="utf-8")
        print(f"spec {f.name:9s} -> {meta['unit']}  (lab {meta['lab']}, labNo {meta['labNo']})")

    # 2) the hand-written first lesson
    u01 = (R / "src/lessons/Unit0_1.jsx").read_text(encoding="utf-8")
    (tmp / "Unit1_1.jsx").write_text(remap_text(u01).replace("Unit0_1", "Unit1_1"), encoding="utf-8")

    # 3) notebook generators (new names for Labs 1, 2A, 2B)
    NB = {"lab0.py": "lab1.py", "lab1.py": "lab2a.py", "lab2.py": "lab2b.py", "lab3.py": "lab3.py",
          "lab4.py": "lab4.py", "lab5a.py": "lab5a.py", "lab5b.py": "lab5b.py", "miniproject.py": "miniproject.py",
          "common.py": "common.py"}
    for old, new in NB.items():
        s = remap_text((T / "notebooks" / old).read_text(encoding="utf-8"))
        s = re.sub(rf"\| ({UREF}) ", lambda m: f"| {unit(m.group(1))} ", s)      # lesson numbers in the intro tables
        (tmp / "notebooks" / new).write_text(s, encoding="utf-8")

    # 4) move everything into place
    for f in (T / "specs").glob("*.jsx"):
        f.unlink()
    for f in (tmp / "specs").glob("*.jsx"):
        shutil.move(str(f), T / "specs" / f.name)
    for old in NB:
        (T / "notebooks" / old).unlink()
    for f in (tmp / "notebooks").glob("*.py"):
        shutil.move(str(f), T / "notebooks" / f.name)
    shutil.move(str(tmp / "Unit1_1.jsx"), R / "src/lessons/Unit1_1.jsx.new")
    shutil.rmtree(tmp)

    # 5) textbook map keys in the assembler (renumber from the highest down is not needed: keys are rewritten in one pass)
    a = (T / "assemble.py").read_text(encoding="utf-8")
    a = re.sub(r'^(\s*)"([0-5]\.(?:\d|C))":', lambda m: f'{m.group(1)}"{unit(m.group(2))}":', a, flags=re.M)
    (T / "assemble.py").write_text(a, encoding="utf-8")
    print("done")


if __name__ == "__main__":
    import sys
    if sys.argv[1:] == ["test"]:
        for t in ["see Unit 0.5", "Units 1.1, 2.1", "Modules 1–5", "COA Unit 5", "Unit 1.C — Capstone", "Lab 0 Part B",
                  "Labs 0–1", "MODULE 0 › UNIT 0.1", "Unit 2.4's law", "Lab0_AI_Basics.ipynb", "hours 1.5 and 3.5",
                  "Lab 5A", "Lab 5B Part C", "Unit 3.4", "lesson 0.3", "Units 0.1–0.5 and 0.C", "Module 2.", "Unit 1.2.", "2.4× faster"]:
            print(f"{t!r:30} -> {remap_text(t)!r}")
    else:
        main()
