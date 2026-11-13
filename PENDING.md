# Pending: for Aishu to come back to later

Started 9 Nov 2026. Nothing here blocks the Foothold update. Tick an item off when it's done.

## Labs (Colab)
- [x] **T4 run of the 18 new notebooks:** all pass on a Colab Tesla T4, 10 Nov (Book review session; see REVIEW_LOG.md). The Core Lab 12 out-of-memory cell fails cleanly at 4 lakh and 2.5 lakh FP32, and fits at 1 lakh and 2.5 lakh AMP.

## Book
- [x] **Figure 2.1 label** now says "(Core Lab 3 network)" (13 Nov; only that figure was redrawn, no lab re-run).
- [ ] **Materials-request page** (`aishugithub.github.io/billion-small-steps`, printed with its QR code on pp. 8 and 235) returned 404 on 13 Nov. The page itself is built and committed in `C:ishu\coursesillion-small-steps` (since 9 Nov); it only needs publishing. Steps are in that folder's `SETUP.md`: (1) Drive folders for the teacher and student packs, (2) the Google Sheet + `Code.gs`, (3) deploy the script as a web app and paste its URL into `config.js`, (4) create the public GitHub repo `billion-small-steps`, push, and switch on Pages.
- [ ] **Course Overview source:** the overview PDF's source is not in the project; its CO column was corrected in the PDF itself on 13 Nov. If the overview is regenerated, use Quizzes CO1–CO5, Viva CO1–CO5, Mini-project CO2, CO4, CO5, and the prerequisite "Basic Python; COA helpful but not required".
- [ ] **Licence:** confirm CC BY-NC-SA 4.0 (text) + MIT (code), and check SRET's IP policy (from Task 9).
- [ ] **Spot-checks before printing:** B200 bandwidth (8 TB/s) and the H&P 6th-edition section numbers (from Task 9).
- [ ] **Dean's unit notes** (`book/notes/unit_notes.html` → `GPU_Course_Unit_Notes.pdf`) still use the old lab names (Lab 1, 2A, 2B …). Update them if they are shared again.
- [ ] **Scratch files** in `book/build/` (`task*.py`, `log_task*.md`, `chk*.png`, `pip_cuda.log`, `phase2_relabel.py`) can be deleted after sign-off.

## Course documents
- [ ] **Hours:** the syllabus says 5 units × 6 h = 30 h, but the 12 teaching sessions are 24 h (3/2/2/2/3 per unit). Aishu, 13 Nov: 12 sessions is what can really be taught in a 15-session term. Consider one line in the syllabus saying what the other three sessions are (quizzes, vivas, mini-project demonstrations).
- [ ] **Mini-project wording:** the syllabus says "in pairs"; the book's brief says "alone or in pairs, as your teacher decides". Pick one.
- [ ] **Dean's e-mail** (`Class - aishu/Email to Dean - Hardware for AI.md`): check it still matches the syllabus after the prerequisite change, then send.

## Before the book is shared widely
- [ ] **Try it on students:** one trial batch (or a few volunteers) through Core Labs 1–3, and one full class signing in to Colab together in the real lab.
- [ ] **One outside technical reader** for Steps 3–5 (GPU architecture).
- [ ] **Labs whose result is weaker than the text promises** (from the 13 Nov review): Amdahl (measured 12.66× vs predicted 9.94×), `.item()` every step (only 1.2× slower), distilgpt2 (145 tokens/s against a 2,000 bound). Either tune the lab or soften the sentence.
- [ ] **Doubled comments** where a block comment and the per-line comment say the same thing (for example the imports in Core Lab 4 Part A, and Core Lab 5 Part B's first lines).
- [ ] **Yearly refresh:** PyTorch version, the GPU generations table (3.1), rupee prices.

## Foothold site
- [ ] **Code.gs is ready** (10 Nov: adds Unit1_6 and Unit1_7 and the new Step 5 title). Re-paste it into the Sheet's Apps Script, run "Foothold GPU → 1. Set up sheets", and redeploy as a new version of the same deployment.
- [ ] **Look through the updated site yourself** (`npm run dev`), especially the new lessons 1.6 and 1.7 and the new tabs in 1.4, 1.C, 3.1 and 5.7.
- [ ] **Optional extras from the book, not yet on the site:** the "You'll see this written as…" notation boxes (Step 1), the Nila Asks boxes in 3.3 and 4.3, the Step 5 "just recognise" term marks, and new quiz questions for the 3.1 / 5.3 / 5.7 / 5.9 additions (their quizzes are unchanged).
- [x] **Pushed to GitHub** on 10 Nov (Colab buttons now work). ~~Push to GitHub~~ (`aishugithub/course_GPU`, public). The Colab buttons only work after the push. The book stays out of the repo (gitignored).

## Backups
- [x] **The book has its own private repo:** `aishugithub/a-billion-small-steps-book` (10 Nov). The book folder `course_GPU/book/` is its working copy; it stays gitignored in the public course repo. Commit and push it after each round of book work. Datasets, Colab run outputs and `build/` scratch are left out by its `.gitignore`.
