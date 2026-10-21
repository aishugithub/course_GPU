"""One-time migration (2026-10-21): renumber the course so Foothold modules match the syllabus units.

Old: M1 AI basics, M2 hungry, M3 CPU vs GPU, M4 inside GPU, M5 teamwork, M6 fast, M7 real projects.
New: M0 AI basics, M1 hungry, M2 CPU vs GPU, M3 inside GPU, M4 teamwork, M5 = old M6 + M7.
Lessons:  old 6.1-6.4 -> 5.1-5.4, 6.C -> 5.5, 7.1-7.4 -> 5.6-5.9, 7.C -> 5.C; others shift module by -1.
Labs:     1->0, 2->1, 3->2, 4->3, 5->4, 6->5A, 7->5B.
References to the COA course ("COA Unit 5") are left alone.
"""
import re

def unit(old):                       # "6.C" -> "5.5"
    m, l = old.split(".")
    m = int(m)
    if m <= 5:
        return f"{m - 1}.{l}"
    if m == 6:
        return "5.5" if l == "C" else f"5.{l}"
    return "5.C" if l == "C" else f"5.{int(l) + 5}"

def module(n):
    n = int(n)
    return str(min(n - 1, 5))

LAB = {"1": "0", "2": "1", "3": "2", "4": "3", "5": "4", "6": "5A", "7": "5B"}
LABFILE = {"Lab01_AI_Basics": "Lab0_AI_Basics", "Lab02_AI_Is_Hungry": "Lab1_AI_Is_Hungry",
           "Lab03_CPU_vs_GPU": "Lab2_CPU_vs_GPU", "Lab04_Inside_a_GPU": "Lab3_Inside_a_GPU",
           "Lab05_CPU_GPU_Teamwork": "Lab4_CPU_GPU_Teamwork", "Lab06_Why_GPUs_Make_AI_Fast": "Lab5A_Why_GPUs_Make_AI_Fast",
           "Lab07_GPUs_in_Real_Projects": "Lab5B_GPUs_in_Real_Projects"}

UREF = r"[1-7]\.(?:\d|C)"
SEP = r"\s*(?:,|and|–|-|/)\s*"

def remap_text(s):
    for a, b in LABFILE.items():
        s = s.replace(a, b)
    # Unit / Units followed by one or more lesson numbers (not "COA Unit 5")
    s = re.sub(rf"(?<!COA )\b(Units?|UNIT)(\s+)({UREF}(?:{SEP}{UREF})*)(?!\.?\d)",
               lambda m: m.group(1) + m.group(2) + re.sub(UREF, lambda x: unit(x.group(0)), m.group(3)), s)
    # Module / Modules / MODULE followed by one or more numbers
    s = re.sub(r"(?<!COA )\b(Modules?|MODULE)(\s+)([1-7](?:\s*(?:,|and|–|-)\s*[1-7])*)\b",
               lambda m: m.group(1) + m.group(2) + re.sub(r"[1-7]", lambda x: module(x.group(0)), m.group(3)), s)
    # Lab / Labs / LAB numbers
    s = re.sub(r"\b(Labs?|LAB)(\s+)([1-7](?:\s*(?:,|and|–|-)\s*[1-7])*)\b",
               lambda m: m.group(1) + m.group(2) + re.sub(r"[1-7]", lambda x: LAB[x.group(0)], m.group(3)), s)
    return s

if __name__ == "__main__":
    tests = ["see Unit 1.5", "Units 2.1, 4.1", "Modules 3–6", "Modules 5 and 6", "COA Unit 5", "Unit 6.C — Capstone",
             "Unit 7.C", "Lab 6 Part B", "Labs 4–6", "MODULE 3 › UNIT 3.1", "Unit 4.4's reuse", "Lab01_AI_Basics.ipynb",
             "hours 1.5 and 3.5", "Units 2.1, 2.2, 6.3, 7.2", "Module 7"]
    for t in tests:
        print(f"{t!r:32} -> {remap_text(t)!r}")
