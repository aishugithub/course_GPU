"""Assemble a self-contained Foothold lesson .jsx from a spec file.

Spec markers (each on its own line):
  //@@META {json}      unit, module, title, icon, lab (notebook file), labNo
  //@@WIDGETS          JSX widget functions (may use C, Insight, LabCard, Code)
  //@@SECTIONS [json]  list of [label, h3 title, WidgetName]  (4 entries; quiz added)
  //@@QUIZ             const QUESTIONS = [...]; const RESULT = {...};
  //@@WORDS            const UNIT_WORDS = [...];
"""
import json, re, sys, pathlib


# Textbook map. Abbreviations are expanded once in the strip itself.
BOOKS = {
  "1.1": "D2L Ch 1 (Introduction: the key parts of machine learning)",
  "1.2": "D2L §2.1 (Data manipulation: tensors) · D2L §9.2 (turning text into tokens)",
  "1.3": "D2L §3.1 (Linear regression: the neuron) · D2L §5.1 (Activation functions)",
  "1.4": "D2L §3.1–3.4 (Loss and minibatch stochastic gradient descent)",
  "1.5": "D2L §5.1–5.3 (Multilayer perceptrons, forward and backward propagation) · Kirk & Hwu Ch 16 (Deep learning)",
  "1.C": "D2L Ch 4 (Classification) and Ch 5 (Multilayer perceptrons)",
  "2.1": "Hamacher Ch 1 (Performance) · Stallings §2.4 (Basic measures of computer performance)",
  "2.2": "D2L §5.3 (Forward and backward propagation) · D2L Ch 12 (Optimization: minibatches)",
  "2.3": "Hamacher §12.2 (Vector (SIMD) processing: vectorization) · H&P §4.1 and §4.5 (Data-level and loop-level parallelism)",
  "2.C": "D2L Ch 13 (Computational performance) · Hamacher Ch 1 (Performance)",
  "3.1": "Stallings §2.2 (Multicore, MICs and GPGPUs) · H&P §4.4 (Graphics processing units) · Kirk & Hwu Ch 1",
  "3.2": "H&P Ch 1 (Trends in power and energy) · Stallings §2.1 (Designing for performance)",
  "3.3": "Hamacher §12.2 and §12.2.1 (Vector processing; GPUs) · H&P §4.2–4.4 · Mano Ch 9 (Vector and array processors)",
  "3.4": "Hamacher §12.7 (Performance modelling) · Stallings §2.3 (Amdahl's law) · H&P Ch 1 (Amdahl's law)",
  "3.C": "Hamacher §12.2.1 (GPUs) · H&P §4.4",
  "4.1": "H&P §4.4 (Graphics processing units) · Kirk & Hwu Ch 4 (Compute architecture and scheduling) · Hamacher §12.2.1",
  "4.2": "Kirk & Hwu Ch 4 (Warps and SIMD hardware; control divergence) · H&P §4.4",
  "4.3": "Kirk & Hwu Ch 4 (Latency tolerance) · Hamacher §12.1 (Hardware multithreading)",
  "4.4": "Kirk & Hwu Ch 5 (Memory architecture and data locality) · H&P §4.4 (GPU memory structures) · Hamacher Ch 8 (Memory)",
  "4.C": "Kirk & Hwu Ch 4–5 · H&P §4.4",
  "5.1": "Hamacher §12.2.1 (GPUs) and Ch 7 (PCI Express) · Kirk & Hwu Ch 2 (Heterogeneous data parallel computing)",
  "5.2": "Kirk & Hwu Ch 2 (Device memory and data transfer) · Hamacher §12.2.1",
  "5.3": "Kirk & Hwu Ch 2–3 (Kernel functions and threading; multidimensional grids)",
  "5.4": "Kirk & Hwu Ch 2 · Hamacher Ch 3 (Interrupts: the same 'start it and carry on' idea)",
  "5.C": "Kirk & Hwu Ch 2 · Hamacher §12.2.1",
  "6.1": "Kirk & Hwu Ch 5 (Tiling for reduced memory traffic) · Hamacher Ch 8 (Cache memories: locality)",
  "6.2": "Hamacher Ch 9 (Floating-point numbers) · Stallings Ch 10 (Computer arithmetic) · Kirk & Hwu Ch 16",
  "6.3": "H&P Ch 4 (The roofline performance model) · Kirk & Hwu Ch 5 (Arithmetic intensity)",
  "6.4": "D2L Ch 12 (Minibatch stochastic gradient descent) · D2L Ch 13 (Computational performance)",
  "6.C": "Kirk & Hwu Ch 16 (Deep learning) · D2L Ch 13",
  "7.1": "Kirk & Hwu Ch 1 (Libraries and frameworks) · D2L Ch 13",
  "7.2": "D2L Ch 13 (Computational performance) · Hamacher Ch 8 (Memory)",
  "7.3": "D2L Ch 13 · NVIDIA's nvidia-smi documentation",
  "7.4": "D2L §13.5–13.6 (Training on multiple GPUs) · Hamacher §12.3–12.5 (Multiprocessors)",
  "7.C": "Kirk & Hwu Ch 16 · D2L Ch 13",
}
BOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)"

HEAD = r'''import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/__LAB__";

function Insight({ color = C.accent, title, children }) {
  return (
    <div style={{ marginTop: 16, background: color + "18", border: `1px solid ${color}44`, borderRadius: 8, padding: "12px 16px", fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
      🔑 <strong style={{ color }}>{title}</strong> {children}
    </div>
  );
}

function Frame({ children }) {
  return <p style={{ color: C.muted, fontSize: 13, marginBottom: 14, lineHeight: 1.7 }}>{children}</p>;
}

function Code({ children, color = C.border, title }) {
  return (
    <div style={{ background: C.card, border: `1.5px solid ${color}`, borderRadius: 10, padding: 14 }}>
      {title && <div style={{ color, fontWeight: 700, fontSize: 12, marginBottom: 8 }}>{title}</div>}
      <pre style={{ fontFamily: "monospace", fontSize: 12, color: C.text, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{children}</pre>
    </div>
  );
}

function LabCard({ part, title, what, expect }) {
  return (
    <div style={{ marginTop: 18, background: C.card, border: `1.5px solid ${C.orange}66`, borderRadius: 10, padding: 16 }}>
      <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>🧪 TRY IT FOR REAL — LAB __LABNO__ · PART {part}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{what}</div>
      <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}><b style={{ color: C.green }}>You should see:</b> {expect}</div>
      <a href={LAB_URL} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", borderRadius: 8, background: C.orange, color: "#0D1117", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Open Lab __LABNO__ in Colab ↗</a>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 8 }}>Colab opens in a new tab. Click <b>File → Save a copy in Drive</b> first, then scroll to Part {part}.__GPUNOTE__</div>
    </div>
  );
}

function Btn({ onClick, children, color = C.accentGlow, ghost, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: "8px 16px", borderRadius: 8, background: ghost ? C.card : color, border: ghost ? `1px solid ${C.border}` : "none", color: ghost ? C.muted : "#fff", fontWeight: 600, cursor: disabled ? "default" : "pointer", fontSize: 13, opacity: disabled ? 0.5 : 1 }}>{children}</button>
  );
}

function Slider({ label, value, min, max, step = 1, onChange, color = C.accent }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ color: C.muted, fontSize: 12 }}>{label}</label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", accentColor: color }} />
    </div>
  );
}

function Stat({ label, value, color = C.teal }) {
  return (
    <div style={{ background: C.card, border: `1.5px solid ${color}`, borderRadius: 8, padding: "8px 12px", flex: 1, minWidth: 120 }}>
      <div style={{ color: C.muted, fontSize: 11, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ color, fontFamily: "monospace", fontSize: 15, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
'''

QUIZ = r'''
// ── Quiz ──
function Quiz({ onComplete }) {
  const questions = QUESTIONS;
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const choose = (i) => { if (selected !== null) return; setSelected(i); if (i === questions[current].answer) setScore((s) => s + 1); };
  const next = () => { if (current < questions.length - 1) { setCurrent((c) => c + 1); setSelected(null); } else { setDone(true); onComplete && onComplete(); } };
  if (done) {
    return (
      <div style={{ textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: 52 }}>{score >= 3 ? "🎉" : "👍"}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginTop: 10 }}>You scored {score} / {questions.length}</div>
        <div style={{ color: C.muted, marginTop: 8, marginBottom: 20 }}>{score === 4 ? RESULT.perfect : score >= 2 ? RESULT.good : RESULT.low}</div>
        <div style={{ padding: 20, borderRadius: 12, background: `linear-gradient(135deg, ${C.accentGlow}22, ${C.purple}22)`, border: `1px solid ${C.accent}55` }}>
          <div style={{ color: C.accent, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>🎓 {RESULT.done}</div>
          <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
            {RESULT.body}<br /><br />
            <strong style={{ color: C.accent }}>{RESULT.next}</strong> {RESULT.teaser}
          </div>
        </div>
      </div>
    );
  }
  const q = questions[current];
  const codey = q.q.includes("\n");
  return (
    <div>
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>Question {current + 1} of {questions.length}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 15, marginBottom: 16, whiteSpace: "pre-wrap", fontFamily: codey ? "monospace" : "inherit" }}>{q.q}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {q.options.map((opt, i) => {
          let bg = C.card, border = C.border, col = C.text;
          if (selected !== null) {
            if (i === q.answer) { bg = C.green + "22"; border = C.green; col = C.green; }
            else if (i === selected) { bg = C.red + "22"; border = C.red; col = C.red; }
          }
          return (
            <button key={i} onClick={() => choose(i)} style={{ textAlign: "left", padding: "10px 14px", borderRadius: 8, background: bg, border: `1.5px solid ${border}`, color: col, cursor: selected !== null ? "default" : "pointer", fontSize: 13, transition: "all 0.25s" }}>
              {i === q.answer && selected !== null ? "✓ " : i === selected && selected !== q.answer ? "✗ " : ""}{opt}
            </button>
          );
        })}
      </div>
      {selected !== null && <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: C.purple + "18", border: `1px solid ${C.purple}44`, color: C.muted, fontSize: 13 }}>💡 {q.explain}</div>}
      {selected !== null && <button onClick={next} style={{ marginTop: 14, padding: "10px 24px", borderRadius: 8, background: C.accentGlow, border: "none", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>{current < questions.length - 1 ? "Next Question →" : "See Results"}</button>}
    </div>
  );
}

// ── Word bank: every short name used in this unit, spelled out ──
function UnitWordBank() {
  const [open, setOpen] = useState(false);
  if (!UNIT_WORDS.length) return null;
  return (
    <div style={{ marginBottom: 18, borderRadius: 8, border: `1px solid ${C.teal}44`, background: C.teal + "0D", padding: "8px 12px" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: C.teal, fontSize: 12, fontWeight: 700, textAlign: "left", lineHeight: 1.5 }}>
        📖 Short names in this unit: <span style={{ fontFamily: "monospace", fontWeight: 400 }}>{UNIT_WORDS.map((w) => w[0]).join(" · ")}</span> {open ? "▲" : "▼ tap to see what they mean"}
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          {UNIT_WORDS.map(([w, full, plain, from]) => (
            <div key={w} style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6, marginBottom: 3 }}>
              <span style={{ fontFamily: "monospace", color: C.teal, fontWeight: 700 }}>{w}</span> = <b style={{ color: C.text }}>{full}</b>. {plain}{" "}
              <span style={{ fontSize: 11, color: from === "new here" ? C.yellow : C.muted }}>({from})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
'''

NOTE = r'''
function TextbookNote() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 18, borderRadius: 8, border: `1px solid ${C.purple}44`, background: C.purple + "0D", padding: "8px 12px" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: C.purple, fontSize: 12, fontWeight: 700, textAlign: "left", lineHeight: 1.6 }}>
        📘 Textbook: <span style={{ fontWeight: 400, color: C.text }}>{TEXTBOOK}</span> {open ? "▲" : "▼ which books?"}
      </button>
      {open && <div style={{ marginTop: 6, fontSize: 12, color: C.muted, lineHeight: 1.7 }}>{TEXTBOOK_KEY}</div>}
    </div>
  );
}
'''

MAIN = r'''
export default function __COMP__({ student, onUnitComplete }) {
  const sections = [
__SECTIONS__
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
__CONTENT__
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit __UNIT__.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>__ICON__</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE __MODULE__ › UNIT __UNIT__</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>__TITLE__</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>{completed.length} / {sections.length} done</div>
      </div>
      <div style={{ height: 3, background: C.border }}>
        <div style={{ height: "100%", width: `${(completed.length / sections.length) * 100}%`, background: C.green, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: C.surface, borderRadius: 10, padding: 4, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
          {sections.map((s, i) => (
            <button key={i} onClick={() => setActiveSection(i)} style={{ flex: 1, minWidth: 80, padding: "8px 6px", borderRadius: 7, background: activeSection === i ? C.accentGlow : "transparent", border: "none", color: activeSection === i ? "#fff" : C.muted, cursor: "pointer", fontSize: 11, fontWeight: activeSection === i ? 600 : 400, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "all 0.2s" }}>
              {completed.includes(i) && <span style={{ color: C.green }}>✓</span>}{s.label}
            </button>
          ))}
        </div>
        <div style={{ background: C.surface, borderRadius: 12, padding: "24px 20px", border: `1px solid ${C.border}`, minHeight: 300 }}>
          <UnitWordBank />
          <TextbookNote />
          {content[activeSection]}
        </div>
        {activeSection < sections.length - 1 && (
          <button onClick={goNext} style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: 8, background: C.accentGlow, border: "none", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Mark Complete &amp; Continue →</button>
        )}
      </div>
    </div>
  );
}
'''


def build(spec_path, out_dir):
    src = pathlib.Path(spec_path).read_text(encoding="utf-8")
    parts = re.split(r"^//@@(\w+)", src, flags=re.M)
    blocks = {}
    for i in range(1, len(parts), 2):
        blocks[parts[i]] = parts[i + 1]
    meta = json.loads(blocks["META"].strip())
    sections = json.loads(blocks["SECTIONS"].strip())
    comp = "Unit" + meta["unit"].replace(".", "_")
    gpu_note = " Then choose <b>Runtime → Change runtime type → T4 GPU</b>." if meta.get("gpu") else ""
    head = (HEAD.replace("__LAB__", meta["lab"]).replace("__LABNO__", str(meta["labNo"]))
            .replace("__GPUNOTE__", gpu_note))
    sec_lines = "\n".join(f'    {{ id: "s{i}", label: {json.dumps(s[0], ensure_ascii=False)} }},' for i, s in enumerate(sections))
    content = "\n".join(
        f'    <div><h3 style={{{{ color: C.text, marginBottom: 6 }}}}>{s[1]}</h3><{s[2]} /></div>,' for s in sections)
    main = (MAIN.replace("__COMP__", comp).replace("__SECTIONS__", sec_lines).replace("__CONTENT__", content)
            .replace("__UNIT__", meta["unit"]).replace("__MODULE__", str(meta["module"]))
            .replace("__ICON__", meta["icon"]).replace("__TITLE__", meta["title"]))
    nl = chr(10)
    book = (nl + "const TEXTBOOK = " + json.dumps(BOOKS[meta["unit"]], ensure_ascii=False) + ";" + nl
            + "const TEXTBOOK_KEY = " + json.dumps(BOOK_KEY, ensure_ascii=False) + ";" + nl)
    out = head + book + blocks["WIDGETS"].rstrip() + "\n" + blocks["QUIZ"].rstrip() + "\n\n" + blocks["WORDS"].strip() + "\n" + QUIZ + NOTE + main
    p = pathlib.Path(out_dir) / f"{comp}.jsx"
    p.write_text(out, encoding="utf-8")
    print("wrote", p, len(out.splitlines()), "lines")


if __name__ == "__main__":
    for s in sys.argv[2:]:
        build(s, sys.argv[1])
