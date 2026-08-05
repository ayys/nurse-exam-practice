# TU Nurse Exam

Practice TU Staff Nurse / Teaching Hospital past MCQs in the browser. Score at the end, review each question, and save items for retry later (stored in `localStorage`).

## Features

- **Full paper** — one past set, optional 60-minute timer
- **Practice quiz** — shuffled subset from one paper or all
- **Swipe True/False** — Tinder-style cards generated from MCQs (right = True)
- **Retry later** — questions you mark during review
- Answer sources labeled: highlight, answer key, or AI best-effort

## Develop

```bash
npm install
npm run dev
```

## Build for GitHub Pages

Repo: [`ayys/nurse-exam-practice`](https://github.com/ayys/nurse-exam-practice) (`base` in `vite.config.ts` must match).

```bash
npm run build
```

Site: https://ayys.github.io/nurse-exam-practice/

Enable GitHub Pages → Source: **GitHub Actions** (workflow deploys from `main`).

## Question bank

Questions live in `public/data/questions.json`. Swipe cards are in `public/data/true-false.json` (regenerate with `npm run generate:tf`). Helpers are under `scripts/`.
