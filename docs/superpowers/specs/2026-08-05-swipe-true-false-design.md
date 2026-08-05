# Swipe True/False Mode — Design

## Goal

Add a Tinder-style practice mode: swipe true/false statements derived from existing MCQs. Maximize card count, keep feedback fast, and retry mistakes in a second pass.

## Decisions

| Topic | Choice |
| --- | --- |
| Swipe mapping | Right = True, Left = False (Tinder “accept” = right) |
| Generation volume | 1 true + up to 3 falses per MCQ with an answer (~843 cards from 212 MCQs) |
| Feedback | Instant correct/wrong flash after each swipe |
| Retry | Wrong cards form a retry pile played after the main deck |
| Data strategy | Pre-generated static `public/data/true-false.json` (Approach 1) |
| Buttons | True/False buttons always available (accessibility + desktop) |

## Product flow

1. **Home** gains a new section **Swipe True/False** (placed between Practice quiz and Retry later).
2. User picks deck size (default **40**; also 20 / 80 / all available).
3. App opens `SwipeDeck` with a shuffled subset of the TF bank.
4. Each card shows one statement. User swipes or taps True/False.
5. Brief flash (correct / wrong), then advance.
6. Incorrect cards are queued. After the main deck finishes, play the **retry pile** (same swipe UX). Cards still wrong after retry stay marked wrong in final score (retry is practice, not free points): score is based on **first** answer only.
7. **Swipe results** screen: score / total / percent, optional short list of missed statements, Back home.

## Data model

`public/data/true-false.json`:

```json
{
  "version": 1,
  "count": 843,
  "cards": [
    {
      "id": "tf-staff-nurse-2080-1-true",
      "statement": "The immediate treatment for an injured client with swelling is cold application.",
      "isTrue": true,
      "sourceQuestionId": "staff-nurse-2080-1",
      "paper": "staff-nurse-2080"
    },
    {
      "id": "tf-staff-nurse-2080-1-false-B",
      "statement": "The immediate treatment for an injured client with swelling is analgesic.",
      "isTrue": false,
      "sourceQuestionId": "staff-nurse-2080-1",
      "paper": "staff-nurse-2080"
    }
  ]
}
```

Rules:

- Only MCQs with a non-null `answer` are used.
- One true card from the correct option.
- Up to three false cards from incorrect options (skip empty/placeholder `.......` distractors).
- Statement style: assert the claim clearly in one sentence (templates + light cleanup). Prefer “X is Y” / “The answer to … is …” only when the stem cannot be folded cleanly.
- IDs are stable: `tf-{questionId}-true` and `tf-{questionId}-false-{optionKey}`.

Generation lives in `scripts/generate_true_false.py` (or similar), reading `public/data/questions.json` and writing the TF bank. Re-run after MCQ bank updates.

## UI & architecture

### Screens

Extend App screen union:

`home | exam | results | swipe | swipe-results`

### Components

- `Home` — new panel to start swipe mode (count selector + Start).
- `SwipeDeck` — card stack, drag gesture, buttons, progress, quit.
- `SwipeResults` — score summary and home/CTA.

### Interaction

- Pointer/touch drag with rotation proportional to offset.
- Threshold (~120px or 25% width) commits swipe; release below threshold snaps back.
- Keyboard: ArrowRight / ArrowLeft optional nice-to-have in the same PR if cheap.
- Visual: right edge tint green (True), left tint coral (False), matching existing CSS tokens (`--ok`, `--coral`).
- Motion: fly-off + next card rise; keep to 2–3 intentional motions, no emoji/slop.

### Scoring & storage

- Score = correct on **first** attempt / cards in the session deck.
- Retry pile is for reinforcement only; does not change the first-pass score.
- Persist to existing history via `pushHistory` with `mode: 'swipe'` (extend `ExamMode` / history type accordingly). Do not mix into MCQ retry-later IDs.

### Types

Add `TrueFalseCard`, `TrueFalseBank`, and swipe session config (`count`, optional `paperId` later — **v1 = all papers only**).

## Out of scope (v1)

- Paper filter for swipe decks
- Saving individual TF cards to retry-later
- Editing statements in the UI
- Offline packaging beyond existing static JSON fetch
- Sound effects

## Success criteria

- Home shows Swipe True/False and starts a session.
- Bank contains roughly one true + up to three falses per answered MCQ (hundreds of cards).
- Swipe and buttons both work on mobile and desktop.
- Instant feedback; wrong cards replay once in a retry pile.
- Results show first-pass score; history records swipe runs.

## Implementation sketch (for planning)

1. Generator script + `true-false.json`
2. Types + loader
3. `SwipeDeck` + CSS
4. Wire App / Home / results / history
5. Manual smoke: drag, buttons, retry pile, score
