//@@META
{"unit": "1.7", "module": 1, "title": "Attention: Tokens Looking at Tokens", "icon": "👀", "lab": "SideTrails_Step1_More_AI_Maths.ipynb", "labNo": "Step 1 Side Trails", "labTrail": true, "gpu": true}
//@@WIDGETS

const fmtIN = (n) => Math.round(n).toLocaleString("en-IN");
function inWords(n) {
  if (n >= 1e7) return `${(n / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 1 })} crore`;
  if (n >= 1e5) return `${(n / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 1 })} lakh`;
  return fmtIN(n);
}

// ── Section 1: Need — the same token, two meanings ──
const SENTENCES = [
  { words: ["Nila", "sat", "on", "the", "river", "bank", "."], hint: "river", meaning: "the side of a river 🌊" },
  { words: ["Nila", "opened", "an", "account", "at", "the", "bank", "."], hint: "account", meaning: "a place for money 🏦" },
];
const BANK_EMB = [0.42, -0.17, 0.88, 0.05, -0.61, 0.33];
function MeaningWidget() {
  const [k, setK] = useState(0);
  const [peek, setPeek] = useState(false);
  const s = SENTENCES[k];
  return (
    <div>
      <Frame>
        In Lesson 1.2 every token got its own <b style={{ color: C.teal }}>embedding</b>: one fixed list of numbers. Switch between the two sentences
        and look at the list for "bank".
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {SENTENCES.map((x, i) => <Btn key={i} ghost={k !== i} onClick={() => { setK(i); setPeek(false); }}>Sentence {i + 1}</Btn>)}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {s.words.map((w, i) => (
          <span key={i} style={{ padding: "6px 10px", borderRadius: 6, fontSize: 14, background: w === "bank" ? C.accent + "33" : peek && w === s.hint ? C.green + "33" : C.card,
            border: `1px solid ${w === "bank" ? C.accent : peek && w === s.hint ? C.green : C.border}`, color: C.text }}>{w}</span>
        ))}
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 12.5, color: C.muted, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px" }}>
        embedding of "bank" = [ {BANK_EMB.join(", ")}, … ] <span style={{ color: C.yellow }}>(the same in both sentences)</span>
      </div>
      <div style={{ marginTop: 10 }}><Btn color={C.green} onClick={() => setPeek(true)}>Which word gives it away?</Btn></div>
      {peek && <div style={{ color: C.green, fontSize: 13, marginTop: 8 }}>"{s.hint}" tells you: here, bank means {s.meaning}.</div>}
      <Insight color={C.purple} title="The model needs a way to let 'bank' look at the other tokens and borrow meaning from the ones that matter.">
        That way is <b>attention</b>, the heart of every chatbot: the T in GPT stands for <b>Transformer</b>, the network built from attention layers.
      </Insight>
    </div>
  );
}

// ── Section 2: Query, key, value — the book's worked example ──
const TOKS = ["the", "river", "bank"];
const KEYS = [[0, 0], [2, 0], [1, 1]];
const VALS = [[0, 0], [1, 0], [0.5, 0.5]];
function attend(q) {
  const scores = KEYS.map((k) => (q[0] * k[0] + q[1] * k[1]) / Math.SQRT2);
  const ex = scores.map((s) => Math.exp(s));
  const tot = ex.reduce((a, b) => a + b, 0);
  const w = ex.map((e) => e / tot);
  const out = [0, 1].map((d) => w.reduce((s, wi, i) => s + wi * VALS[i][d], 0));
  return { dots: KEYS.map((k) => q[0] * k[0] + q[1] * k[1]), scores, ex, tot, w, out };
}
function QKVWidget() {
  const [q1, setQ1] = useState(2);
  const [q2, setQ2] = useState(0);
  const r = attend([q1, q2]);
  const f3 = (x) => x.toFixed(3);
  return (
    <div>
      <Frame>
        Each token makes three lists from its embedding, each with a learned layer (Lesson 1.5): a <b style={{ color: C.accent }}>query</b> (what am I
        looking for?), a <b style={{ color: C.green }}>key</b> (what do I offer?) and a <b style={{ color: C.purple }}>value</b> (what I hand over if you pick me).
        Here: three tokens, lists of length 2. Keys: the = [0, 0], river = [2, 0], bank = [1, 1]. The query of "bank" starts as [2, 0]: "is there water nearby?"
      </Frame>
      <Slider label={<>bank's query, first number: <b style={{ color: C.accent }}>{q1}</b></>} value={q1} min={-2} max={3} step={0.5} onChange={setQ1} />
      <Slider label={<>bank's query, second number: <b style={{ color: C.accent }}>{q2}</b></>} value={q2} min={-2} max={3} step={0.5} onChange={setQ2} />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, fontFamily: "monospace", marginTop: 6 }}>
          <thead><tr style={{ color: C.muted }}>{["token", "Q · K", "÷ √2", "e^score", "softmax weight", ""].map((h) => <th key={h} style={{ textAlign: "left", padding: "4px 6px", borderBottom: `1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
          <tbody>
            {TOKS.map((t, i) => (
              <tr key={t}>
                <td style={{ padding: "4px 6px", color: C.text }}>{t}</td>
                <td style={{ padding: "4px 6px", color: C.muted }}>{q1}×{KEYS[i][0]} + {q2}×{KEYS[i][1]} = {r.dots[i]}</td>
                <td style={{ padding: "4px 6px", color: C.muted }}>{r.scores[i].toFixed(2)}</td>
                <td style={{ padding: "4px 6px", color: C.muted }}>{f3(r.ex[i])}</td>
                <td style={{ padding: "4px 6px", color: C.yellow }}>{f3(r.ex[i])} ÷ {f3(r.tot)} = {f3(r.w[i])}</td>
                <td style={{ padding: "4px 6px", width: 120 }}><div style={{ height: 10, width: `${r.w[i] * 100}%`, background: C.yellow, borderRadius: 3 }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 12.5, color: C.muted, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", marginTop: 10 }}>
        new list for bank = {r.w.map((w, i) => `${f3(w)} × [${VALS[i].join(", ")}]`).join(" + ")} = <b style={{ color: C.purple }}>[{f3(r.out[0])}, {f3(r.out[1])}]</b>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        <Btn ghost onClick={() => { setQ1(2); setQ2(0); }}>Reset to the book's query [2, 0]</Btn>
      </div>
      <Insight color={C.green} title="With the query [2, 0], bank pays 77% of its attention to river.">
        Its new list, [0.861, 0.093], has moved towards river's meaning: in this sentence, bank now "means" the water kind. Three steps, all things you
        already know: dot products (scores), <b>softmax</b> (e to the power of each score, divided by their total, so the weights add up to 1), and a weighted mix.
      </Insight>
    </div>
  );
}

// ── Section 3: every token at once — two matrix multiplies ──
const QUERIES = [[0, 0], [1, 1], [2, 0]];
function TableWidget() {
  const [row, setRow] = useState(2);
  const scores = QUERIES.map((q) => KEYS.map((k) => (q[0] * k[0] + q[1] * k[1]) / Math.SQRT2));
  const weights = scores.map((r) => { const e = r.map(Math.exp); const t = e.reduce((a, b) => a + b, 0); return e.map((x) => x / t); });
  const cell = { padding: "6px 8px", textAlign: "center", fontFamily: "monospace", fontSize: 12.5, border: `1px solid ${C.border}` };
  return (
    <div>
      <Frame>
        Every token does this at the same time. Stack all the queries as the rows of Q and all the keys as the rows of K. Then
        <b style={{ color: C.accent }}> Q · Kᵀ</b> is an n × n table of scores, every token against every token: a matrix multiply. (Toy queries for
        "the" and "river" are made up here; "bank" uses the query from before.) Click a row.
      </Frame>
      <table style={{ borderCollapse: "collapse", marginBottom: 10 }}>
        <thead><tr><th style={{ ...cell, color: C.muted }}>query ↓ · key →</th>{TOKS.map((t) => <th key={t} style={{ ...cell, color: C.green }}>{t}</th>)}</tr></thead>
        <tbody>
          {TOKS.map((t, i) => (
            <tr key={t} onClick={() => setRow(i)} style={{ cursor: "pointer", background: row === i ? C.accent + "22" : "transparent" }}>
              <td style={{ ...cell, color: C.accent }}>{t} [{QUERIES[i].join(", ")}]</td>
              {scores[i].map((s, j) => <td key={j} style={{ ...cell, color: C.text }}>{s.toFixed(2)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ color: C.muted, fontSize: 13 }}>
        Softmax of the <b style={{ color: C.accent }}>{TOKS[row]}</b> row: {weights[row].map((w, j) => <span key={j} style={{ marginRight: 10 }}><b style={{ color: C.yellow }}>{w.toFixed(3)}</b> → {TOKS[j]}</span>)}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <Stat label="MATRIX MULTIPLY 1" value="Q · Kᵀ → (n × n) scores" color={C.accent} />
        <Stat label="SOFTMAX" value="each row adds up to 1" color={C.yellow} />
        <Stat label="MATRIX MULTIPLY 2" value="weights · V → new lists" color={C.purple} />
      </div>
      <Insight title="Attention is, once again, matrix multiplication.">
        Softmax each row of the score table, then multiply the (n × n) weights by V (n × d). Every one of the n × n scores is an independent dot product.
      </Insight>
    </div>
  );
}

// ── Section 4: the catch — the cost grows with the square of the context ──
const CTX = [[1000, "a page or two"], [4000, "a chat"], [32000, "a long report"], [100000, "a whole book"]];
const ATTN_RUN = [[512, 1.49, 0.12], [1024, 7.34, 0.23], [2048, 40.03, 0.81], [4096, 227.5, 3.43]];
function CostWidget() {
  const [i, setI] = useState(0);
  const [heads, setHeads] = useState(1);
  const n = CTX[i][0];
  const macs = 2 * n * n * 64 * heads;
  const base = 2 * 1000 * 1000 * 64 * heads;
  return (
    <div>
      <Frame>
        The <b style={{ color: C.teal }}>context</b> is the number of tokens the model looks at together: your question, the chat so far, any document you
        pasted. The score table has n × n entries. With lists of length d = 64, the two matrix multiplies cost about 2 × n × n × 64 MACs.
      </Frame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {CTX.map(([c, label], j) => <Btn key={c} ghost={i !== j} onClick={() => setI(j)}>{fmtIN(c)} tokens ({label})</Btn>)}
      </div>
      <Slider label={<>attention heads × layers (separate attention calculations): <b style={{ color: C.accent }}>{heads}</b></>} value={heads} min={1} max={96} onChange={setHeads} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="SCORE-TABLE ENTRIES (n × n)" value={inWords(n * n)} color={C.teal} />
        <Stat label="MACS" value={inWords(macs)} color={C.yellow} />
        <Stat label="VS 1,000 TOKENS" value={`${fmtIN(macs / base)}×`} color={macs / base > 1 ? C.red : C.green} />
      </div>
      <div style={{ marginTop: 12, color: C.muted, fontSize: 12, marginBottom: 4 }}>Measured: one head, d = 64, on Colab's CPU and T4 (from the book's Side Trail run)</div>
      <table style={{ borderCollapse: "collapse", fontFamily: "monospace", fontSize: 12 }}>
        <thead><tr style={{ color: C.muted }}>{["context", "CPU ms", "T4 ms"].map((h) => <th key={h} style={{ padding: "3px 10px", textAlign: "right", borderBottom: `1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
        <tbody>{ATTN_RUN.map(([c, cpu, gpu]) => <tr key={c}><td style={{ padding: "3px 10px", textAlign: "right", color: C.text }}>{fmtIN(c)}</td><td style={{ padding: "3px 10px", textAlign: "right", color: C.orange }}>{cpu}</td><td style={{ padding: "3px 10px", textAlign: "right", color: C.green }}>{gpu}</td></tr>)}</tbody>
      </table>
      <Insight color={C.red} title="Double the context, and the attention work grows four times.">
        A real model repeats this in dozens of heads in each of dozens of layers. That is why long contexts are expensive, why chatbots limit how much
        you can paste, and why so much hardware research goes into attention.
      </Insight>
      <div style={{ marginTop: 14, background: C.purple + "14", border: `1px solid ${C.purple}55`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
        <b style={{ color: C.purple }}>🤖 Arputham says:</b> for a 4,000-token chat that is 1.6 crore independent dot products per head per layer, all at once.
        Convolution, attention, plain layers: three ideas, one kind of arithmetic. In Step 5 you will meet the <b>KV cache</b>: the saved keys and values of earlier tokens, which fill my memory during a long chat.
      </div>
      <LabCard part="D" title="Time attention as the context grows"
        what="Attention in four lines of PyTorch, timed for context lengths 512 to 4,096 on the CPU and on the T4. An optional Side Trail: nothing later needs it."
        expect="each doubling of the context making the score table 4× bigger; the T4 many times faster than the CPU, with its time growing slowly at first." />
    </div>
  );
}

// ── Section 5: slippery step — no magic ──
function NoMagicWidget() {
  const [step, setStep] = useState(0);
  const W = [0.2, 0.31, 0.45, 0.58, 0.68, 0.74, 0.77];
  return (
    <div>
      <Frame>
        Where do the queries and keys come from? They are made by learned weights, trained by gradient descent like every other knob (Lesson 1.4).
        Step through training on a pile of example sentences and watch how much "bank" attends to "river".
      </Frame>
      <Slider label={<>training rounds: <b style={{ color: C.accent }}>{step * 1000}</b></>} value={step} min={0} max={W.length - 1} onChange={setStep} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ color: C.muted, fontSize: 13, width: 170 }}>weight bank → river</div>
        <div style={{ flex: 1, height: 14, background: C.card, borderRadius: 4, border: `1px solid ${C.border}` }}>
          <div style={{ height: "100%", width: `${W[step] * 100}%`, background: C.yellow, borderRadius: 4, transition: "width 0.3s" }} />
        </div>
        <b style={{ color: C.yellow, width: 50 }}>{W[step].toFixed(2)}</b>
      </div>
      <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>(An illustration of the idea, not a real training run.)</div>
      <Insight color={C.orange} title="Slippery step: attention does not 'understand' by magic.">
        "bank looks at river" happens only because, over billions of examples, matching those two lowered the loss. Underneath, it is dot products,
        softmax and a weighted sum: arithmetic a GPU can do in parallel.
      </Insight>
    </div>
  );
}
//@@SECTIONS
[["One Word, Two Meanings", "🏦 One Word, Two Meanings — 'bank' needs its neighbours", "MeaningWidget"],
 ["Query, Key, Value", "👀 Query, Key, Value — what does 'bank' look at?", "QKVWidget"],
 ["Every Token at Once", "🧮 Every Token at Once — two matrix multiplies", "TableWidget"],
 ["The Cost of a Long Chat", "📈 The Cost of a Long Chat — n × n grows fast", "CostWidget"],
 ["No Magic", "⚠️ No Magic — the weights are learned", "NoMagicWidget"]]
//@@QUIZ
const QUESTIONS = [
  { q: "In attention, what do Q · Kᵀ, softmax and × V each do?", options: ["Store, sort, delete", "Score every token against every token; turn scores into weights that add to 1; mix the values by those weights", "Add, subtract, divide", "Compress, encrypt, send"], answer: 1, explain: "Dot products give the scores, softmax turns them into weights, and the weighted mix of values is the new list." },
  { q: "A query matches two keys with scores 2 and 0 (already divided by √d). What are the softmax weights? (e² ≈ 7.389)", options: ["1 and 0", "0.5 and 0.5", "0.881 and 0.119", "0.667 and 0.333"], answer: 2, explain: "e² = 7.389 and e⁰ = 1; the total is 8.389; 7.389 ÷ 8.389 = 0.881 and 1 ÷ 8.389 = 0.119." },
  { q: "The context grows from 2,000 to 8,000 tokens. Roughly how much more attention work is that?", options: ["4×", "8×", "16×", "64×"], answer: 2, explain: "4× the tokens gives 4 × 4 = 16× the score-table entries, so about 16× the work." },
  { q: "How does 'bank' learn to look at 'river'?", options: ["A programmer writes the rule", "The query and key weights are trained by gradient descent, because matching them lowered the loss", "The GPU decides at random", "Dictionaries are built into the model"], answer: 1, explain: "Q, K and V come from learned weights; training adjusts them like every other knob." },
];
const RESULT = {
  perfect: "Perfect! You can do attention by hand, and you know why long chats are expensive.",
  good: "Good. Replay 'Query, Key, Value' and reproduce the 0.768 yourself.",
  low: "Revisit 'Query, Key, Value': scores, softmax, then a weighted mix.",
  done: "Lesson 1.7 Complete!",
  body: "You can explain why a token needs its neighbours, compute attention weights by hand, see attention as two matrix multiplies, and explain why its cost grows with the square of the context.",
  next: "Next up: Lesson 1.C — Capstone: Train a Tiny Network.",
  teaser: "Put the neuron, the loss and gradient descent together, read the answers as probabilities, catch a network memorising, and watch it learn.",
};
//@@WORDS
const UNIT_WORDS = [
  ["Q, K, V", "query, key, value", "Three lists each token makes from its embedding: what it looks for, what it offers, what it hands over.", "new here"],
  ["GPT", "Generative Pre-trained Transformer", "A chatbot model built from attention layers (a Transformer).", "new here"],
  ["MAC", "Multiply-Accumulate", "Multiply, then add to a running total.", "from Lesson 1.3"],
];
