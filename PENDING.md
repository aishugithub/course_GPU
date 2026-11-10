# Pending: for Aishu to come back to later

Started 9 Nov 2026. Nothing here blocks the Foothold update. Tick an item off when it's done.

## Labs (Colab)
- [x] **T4 run of the 18 new notebooks:** all pass on a Colab Tesla T4, 10 Nov (Book review session; see REVIEW_LOG.md). The Core Lab 12 out-of-memory cell fails cleanly at 4 lakh and 2.5 lakh FP32, and fits at 1 lakh and 2.5 lakh AMP.

## Book
- [ ] **Figure in 2.C** still labels one bar "(Lab 1 network)". It is drawn by `book/tools/make_step2.py`. Changing it means re-running make_step2, which would replace the T4 outputs with laptop ones, so do it only together with a T4 re-run.
- [ ] **Licence:** confirm CC BY-NC-SA 4.0 (text) + MIT (code), and check SRET's IP policy (from Task 9).
- [ ] **Spot-checks before printing:** B200 bandwidth (8 TB/s) and the H&P 6th-edition section numbers (from Task 9).
- [ ] **Dean's unit notes** (`book/notes/unit_notes.html` → `GPU_Course_Unit_Notes.pdf`) still use the old lab names (Lab 1, 2A, 2B …). Update them if they are shared again.
- [ ] **Scratch files** in `book/build/` (`task*.py`, `log_task*.md`, `chk*.png`, `pip_cuda.log`, `phase2_relabel.py`) can be deleted after sign-off.

## Foothold site
- [ ] **Code.gs is ready** (10 Nov: adds Unit1_6 and Unit1_7 and the new Step 5 title). Re-paste it into the Sheet's Apps Script, run "Foothold GPU → 1. Set up sheets", and redeploy as a new version of the same deployment.
- [ ] **Look through the updated site yourself** (`npm run dev`), especially the new lessons 1.6 and 1.7 and the new tabs in 1.4, 1.C, 3.1 and 5.7.
- [ ] **Optional extras from the book, not yet on the site:** the "You'll see this written as…" notation boxes (Step 1), the Nila Asks boxes in 3.3 and 4.3, the Step 5 "just recognise" term marks, and new quiz questions for the 3.1 / 5.3 / 5.7 / 5.9 additions (their quizzes are unchanged).
- [x] **Pushed to GitHub** on 10 Nov (Colab buttons now work). ~~Push to GitHub~~ (`aishugithub/course_GPU`, public). The Colab buttons only work after the push. The book stays out of the repo (gitignored).

## Backups
- [x] **The book has its own private repo:** `aishugithub/a-billion-small-steps-book` (10 Nov). The book folder `course_GPU/book/` is its working copy; it stays gitignored in the public course repo. Commit and push it after each round of book work. Datasets, Colab run outputs and `build/` scratch are left out by its `.gitignore`.
