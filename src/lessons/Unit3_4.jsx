import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0D1117", surface: "#161B22", card: "#1C2333",
  accent: "#58A6FF", accentGlow: "#1F6FEB",
  green: "#3FB950", yellow: "#D29922", purple: "#BC8CFF",
  red: "#F85149", orange: "#F0883E", teal: "#39D0D8",
  text: "#E6EDF3", muted: "#8B949E", border: "#30363D",
};

const LAB_URL = "https://colab.research.google.com/github/aishugithub/course_GPU/blob/main/notebooks/Lab3_Inside_a_GPU.ipynb";

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
      <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>🧪 TRY IT FOR REAL — LAB 3 · PART {part}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{what}</div>
      <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}><b style={{ color: C.green }}>You should see:</b> {expect}</div>
      <a href={LAB_URL} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", borderRadius: 8, background: C.orange, color: "#0D1117", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Open Lab 3 in Colab ↗</a>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 8 }}>Colab opens in a new tab. Click <b>File → Save a copy in Drive</b> first, then scroll to Part {part}. Then choose <b>Runtime → Change runtime type → T4 GPU</b>.</div>
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

const TEXTBOOK = "Kirk & Hwu Ch 5 (Memory architecture and data locality) · H&P §4.4 (GPU memory structures) · Hamacher Ch 8 (Memory)";
const TEXTBOOK_KEY = "Hamacher = Computer Organization and Embedded Systems, 6e (COA textbook) · Mano = Computer System Architecture, 3e (COA textbook) · H&P = Hennessy & Patterson, Computer Architecture: A Quantitative Approach, 5e · Stallings = Computer Organization and Architecture, 11e · Kirk & Hwu = Programming Massively Parallel Processors, 4e · D2L = Dive into Deep Learning (free at d2l.ai)";


// ── Section 1: Need — feeding the beast ──
function NeedWidget() {
  const [r, setR] = useState(1);
  const bw = 320e9, peak = 8.1e12;
  const flops = Math.min(peak, (bw * r) / 4);    // 1 FMA = 2 FLOPs needs 2 floats = 8 bytes when nothing is reused
  return (
    <div>
      <Frame>
        The T4 can do 8.1 TFLOPS (FP32), but every FMA needs two numbers to work on. Its main memory delivers <b style={{ color: C.teal }}>320 GB/s</b>.
        If every number had to come fresh from memory and be used once, how fast could the T4 really go? Now let each fetched number be
        <b style={{ color: C.green }}> reused</b> several times from fast on-chip storage.
      </Frame>
      <Slider label={<>Reuse: each number fetched from memory is used in <b style={{ color: C.green }}>{r}</b> FMA{r > 1 ? "s" : ""}</>} value={r} min={1} max={200} onChange={setR} color={C.green} />
      <div style={{ height: 26, background: C.card, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
        <div style={{ width: `${(flops / peak) * 100}%`, height: "100%", background: flops >= peak ? C.green : C.yellow, transition: "width 0.3s" }} />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="ACHIEVABLE SPEED" value={`${(flops / 1e12).toFixed(2)} TFLOPS`} color={flops >= peak ? C.green : C.yellow} />
        <Stat label="SHARE OF PEAK" value={`${((flops / peak) * 100).toFixed(1)}%`} color={C.purple} />
        <Stat label="BANDWIDTH NEEDED WITH NO REUSE" value="≈ 32 TB/s (100× too much)" color={C.red} />
      </div>
      <Insight color={C.yellow} title="Without reuse the T4 runs at about 1% of its peak, starved for data.">
        The arithmetic is cheap; moving the numbers is expensive. Every fast GPU program is really a plan for reusing data held in small, fast
        memories close to the cores. This unit maps those memories.
      </Insight>
    </div>
  );
}

// ── Section 2: The memory hierarchy ──
const LEVELS = [
  { k: "reg", t: "Registers", size: "256 KB per SM (≈ 10 MB on the chip)", lat: "≈ 1 cycle", who: "one thread", c: C.green, coa: "Processor registers R0…Rn" },
  { k: "smem", t: "Shared memory / L1 cache", size: "96 KB per SM", lat: "≈ 20–30 cycles", who: "one thread block, on one SM", c: C.teal, coa: "L1 cache" },
  { k: "l2", t: "L2 cache", size: "4 MB (whole chip)", lat: "≈ 200 cycles", who: "all SMs", c: C.accent, coa: "L2 / L3 cache" },
  { k: "global", t: "Global memory (GDDR6)", size: "16 GB", lat: "≈ 400–600 cycles · 320 GB/s", who: "every thread, and the CPU (by copying)", c: C.purple, coa: "Main memory (RAM)" },
  { k: "host", t: "CPU's RAM, over PCIe", size: "12+ GB on Colab", lat: "microseconds · ≈ 12 GB/s", who: "reached only by explicit copies", c: C.orange, coa: "(like a disk: far away)" },
];
function HierarchyWidget() {
  const [k, setK] = useState("smem");
  const [coa, setCoa] = useState(false);
  const L = LEVELS.find((x) => x.k === k);
  return (
    <div>
      <Frame>
        Like the CPU memory hierarchy in COA (Hamacher Ch 8), a GPU has layers: the closer to the cores, the faster and smaller. Click a level.
        Toggle to see the matching COA level. (Approximate T4 figures.)
      </Frame>
      <label style={{ color: C.muted, fontSize: 12.5, cursor: "pointer" }}><input type="checkbox" checked={coa} onChange={(e) => setCoa(e.target.checked)} /> Show the matching CPU (COA) level</label>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 10 }}>
        {LEVELS.map((x, i) => (
          <div key={x.k} onClick={() => setK(x.k)} style={{ width: `${40 + i * 15}%`, cursor: "pointer", padding: "8px 10px", borderRadius: 6, textAlign: "center", background: x.c + (k === x.k ? "44" : "1A"), border: `1.5px solid ${x.c}`, color: C.text, fontSize: 12.5, fontWeight: k === x.k ? 700 : 400 }}>
            {x.t}{coa && <span style={{ color: C.muted, fontWeight: 400 }}> · COA: {x.coa}</span>}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <Stat label="SIZE" value={L.size} color={L.c} />
        <Stat label="SPEED" value={L.lat} color={L.c} />
        <Stat label="WHO CAN SEE IT" value={L.who} color={L.c} />
      </div>
      <Insight color={C.teal} title="Same idea as COA: keep the data you're using in the small, fast levels.">
        The difference is who manages it. A CPU's caches work automatically. On a GPU, the fastest shared level (shared memory) is a
        scratchpad that the programmer fills deliberately. Unit 5.1 does exactly that.
      </Insight>
    </div>
  );
}

// ── Section 3: Who shares what — confusing names ──
const SPACES = {
  register: { t: "Registers", who: "one thread only", scope: (sm, b, th) => sm === 0 && b === 0 && th === 0, note: "Each thread's own variables, like i in the vector-add kernel. The fastest storage there is." },
  shared: { t: "'Shared' memory", who: "the threads of ONE block (on one SM)", scope: (sm, b) => sm === 0 && b === 0, note: "The name misleads: it's shared only inside one thread block, a team of threads that runs together on one SM (Unit 4.3 shows how you pick block sizes). Hennessy & Patterson point out that it's really LOCAL to the block." },
  global: { t: "'Global' memory", who: "EVERY thread on the GPU, plus the CPU by copying", scope: () => true, note: "The big 16 GB memory. This is the one that's truly shared: every thread, in every block, on every SM, can read and write it. Your tensors live here." },
};
function ScopeWidget() {
  const [k, setK] = useState("shared");
  const s = SPACES[k];
  return (
    <div>
      <Frame>
        CUDA's memory names are famously confusing. Pick one and see which threads can reach it. The picture shows 2 SMs, each running 2
        thread blocks of 8 threads.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {Object.entries(SPACES).map(([key, v]) => <Btn key={key} ghost={key !== k} onClick={() => setK(key)}>{v.t}</Btn>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[0, 1].map((sm) => (
          <div key={sm} style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 8 }}>
            <div style={{ color: C.muted, fontSize: 11, marginBottom: 6 }}>SM {sm}</div>
            {[0, 1].map((b) => (
              <div key={b} style={{ border: `1px dashed ${C.border}`, borderRadius: 8, padding: 6, marginBottom: 6 }}>
                <div style={{ color: C.muted, fontSize: 10, marginBottom: 4 }}>block {b}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 3 }}>
                  {Array.from({ length: 8 }, (_, th) => {
                    const on = s.scope(sm, b, th);
                    return <div key={th} style={{ height: 18, borderRadius: 3, background: on ? C.green : C.card, border: `1px solid ${on ? C.green : C.border}` }} />;
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
        <b style={{ color: C.green }}>{s.t}: visible to {s.who}.</b> {s.note}
      </div>
      <Insight color={C.purple} title="'Shared' = shared by one block. 'Global' = shared by everyone.">
        A handy memory trick: global is like the college library (anyone can go there, but it's a walk); shared memory is your department's
        cupboard (only your team, but right next to you); registers are your own pocket.
      </Insight>
    </div>
  );
}

// ── Section 4: Coalescing + bandwidth ──
function CoalesceWidget() {
  const [pattern, setPattern] = useState("seq");
  const [mb, setMb] = useState(400);
  const addr = Array.from({ length: 32 }, (_, i) => (pattern === "seq" ? i : pattern === "stride" ? i * 32 : [5, 900, 33, 412, 77, 640, 2, 1000, 300, 150, 820, 64, 501, 13, 700, 222, 999, 45, 380, 610, 91, 870, 256, 128, 777, 18, 560, 430, 330, 950, 60, 705][i]));
  const segs = new Set(addr.map((a) => Math.floor(a / 32)));   // 32 floats = one 128-byte segment
  const eff = 1 / segs.size;
  return (
    <div>
      <Frame>
        Memory delivers data in chunks of <b style={{ color: C.text }}>128 bytes</b> (32 floats). When the 32 threads of a warp read 32 neighbouring
        floats, one chunk serves them all. That's <b style={{ color: C.green }}>coalesced</b>. If their addresses are far apart, the memory must fetch
        many chunks and throw most of each away. Choose how the warp reads.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        <Btn ghost={pattern !== "seq"} onClick={() => setPattern("seq")} color={C.green}>x[i]: neighbours</Btn>
        <Btn ghost={pattern !== "stride"} onClick={() => setPattern("stride")} color={C.red}>x[i * 32]: strided</Btn>
        <Btn ghost={pattern !== "rand"} onClick={() => setPattern("rand")} color={C.orange}>random</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(32, 1fr)", gap: 1 }}>
        {Array.from({ length: 32 }, (_, s) => <div key={s} style={{ height: 16, background: segs.has(s) ? (pattern === "seq" ? C.green : C.red) : C.card, border: `1px solid ${C.border}` }} />)}
      </div>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 4 }}>Each box = one 128-byte chunk of memory (32 shown). Coloured = fetched for this one warp read.</div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="CHUNKS FETCHED" value={segs.size} color={segs.size === 1 ? C.green : C.red} />
        <Stat label="USEFUL BYTES" value={`${(eff * 100).toFixed(0)}%`} color={segs.size === 1 ? C.green : C.red} />
      </div>
      <div style={{ marginTop: 16, background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Bandwidth calculator</div>
        <Slider label={<>Data to read + write = <b style={{ color: C.teal }}>{mb} MB</b></>} value={mb} min={1} max={4000} onChange={setMb} color={C.teal} />
        <div style={{ fontFamily: "monospace", fontSize: 13, color: C.text }}>
          time ≥ {mb} MB ÷ 320 GB/s = <b style={{ color: C.green }}>{((mb / 320000) * 1000).toFixed(2)} ms</b> (coalesced) · ≈ <b style={{ color: C.red }}>{((mb / 320000) * 1000 / Math.max(eff, 1 / 32)).toFixed(1)} ms</b> ({pattern === "seq" ? "same" : "this pattern"})
        </div>
      </div>
      <Insight color={C.green} title="Neighbouring threads should read neighbouring addresses.">
        Simple operations like ReLU or vector add are limited by memory, not maths, so their speed is set by bytes ÷ bandwidth, and only if access is
        coalesced. PyTorch's built-in operations are written to coalesce.
      </Insight>
      <LabCard part="D" title="Measure your GPU's memory bandwidth"
        what="Copy a large tensor inside the GPU and compute GB/s, then time a kernel reading with stride 1 vs stride 32."
        expect="roughly 200–250 GB/s for the copy (a good fraction of the 320 GB/s peak) and the strided read running several times slower." />
    </div>
  );
}

const QUESTIONS = [
  { q: "Without any data reuse, the T4 (320 GB/s, 8.1 TFLOPS) reaches about what share of its peak?", options: ["100%", "50%", "10%", "1%"], answer: 3, explain: "320 GB/s ÷ 8 bytes per FMA × 2 FLOPs ≈ 80 GFLOPS: about 1% of 8.1 TFLOPS. Reuse is essential." },
  { q: "CUDA 'shared memory' is visible to…", options: ["Every thread on the GPU", "The threads of one thread block, on one SM", "Only the CPU", "One thread"], answer: 1, explain: "Despite the name, it's private to one block. 'Global memory' is the one everyone shares." },
  { q: "Which access pattern is coalesced?", options: ["Thread i reads x[i]", "Thread i reads x[i * 32]", "Thread i reads a random element", "Thread i reads x[1000 − 37·i]"], answer: 0, explain: "Neighbouring threads reading neighbouring addresses fall in the same 128-byte chunk, so one fetch serves the whole warp." },
  { q: "A ReLU kernel reads 200 MB and writes 200 MB on a 320 GB/s GPU. Its best possible time is about…", options: ["0.125 ms", "1.25 ms", "12.5 ms", "125 ms"], answer: 1, explain: "400 MB ÷ 320 GB/s = 1.25 ms. ReLU barely does any maths; memory sets its speed." },
];
const RESULT = {
  perfect: "Perfect! You understand what really limits GPU speed.",
  good: "Good. Replay 'Feeding the Beast' and see how much reuse is needed.",
  low: "Revisit 'The Hierarchy' and 'Coalescing': bytes, not FLOPs, are often the limit.",
  done: "Unit 3.4 Complete!",
  body: "You can map the GPU memory hierarchy, explain CUDA's memory spaces, coalescing, and bandwidth-limited speed.",
  next: "Next up: Unit 3.C — Capstone: Map a Job onto a GPU.",
  teaser: "Take a real AI job and plan it on the T4: threads, warps, SMs, bytes, and time.",
};

const UNIT_WORDS = [
  ["GB/s / TB/s", "gigabytes / terabytes per second", "Bandwidth: how many bytes per second memory can deliver.", "from Unit 2.C"],
  ["GDDR6", "Graphics Double Data Rate 6", "The GPU's global memory.", "from Unit 3.1"],
  ["coalesced", "combined", "A warp's 32 reads merged into as few memory chunks as possible.", "new here"],
  ["thread block", "a team of threads on one SM", "Threads that run together and share 'shared memory'. Chosen by the programmer in Unit 4.3.", "new here"],
  ["PCIe", "Peripheral Component Interconnect Express", "The CPU–GPU bus.", "from Unit 2.C"],
];

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

export default function Unit3_4({ student, onUnitComplete }) {
  const sections = [
    { id: "s0", label: "Feeding the Beast" },
    { id: "s1", label: "The Hierarchy" },
    { id: "s2", label: "Who Shares What" },
    { id: "s3", label: "Coalescing" },
    { id: "quiz", label: "Quiz & Wrap-up" },
  ];
  const [activeSection, setActiveSection] = useState(0);
  const [completed, setCompleted] = useState([]);
  const markComplete = (idx) => { if (!completed.includes(idx)) setCompleted((p) => [...p, idx]); };
  const goNext = () => { markComplete(activeSection); setActiveSection((s) => Math.min(sections.length - 1, s + 1)); };
  const quizIdx = sections.length - 1;

  const content = [
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🚰 Feeding the Beast — FLOPS need bytes</h3><NeedWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🏔️ The Memory Hierarchy — registers to PCIe</h3><HierarchyWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🗝️ Who Shares What — 'shared' vs 'global'</h3><ScopeWidget /></div>,
    <div><h3 style={{ color: C.text, marginBottom: 6 }}>🧲 Coalescing — read like a warp</h3><CoalesceWidget /></div>,
    <div>
      <h3 style={{ color: C.text, marginBottom: 6 }}>Quick Quiz</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>4 questions to check your understanding of Unit 3.4.</p>
      <Quiz onComplete={() => { markComplete(quizIdx); onUnitComplete && onUnitComplete(); }} />
    </div>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, paddingBottom: 40 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🚰</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1 }}>MODULE 3 › UNIT 3.4</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>GPU Memory & Bandwidth</div>
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
