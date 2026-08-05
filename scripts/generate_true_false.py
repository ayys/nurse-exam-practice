#!/usr/bin/env python3
"""Generate swipe true/false cards from the MCQ bank."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUESTIONS = ROOT / "public" / "data" / "questions.json"
OUT = ROOT / "public" / "data" / "true-false.json"

PLACEHOLDER = re.compile(r"^\.{3,}$|^…+$")
BLANK = re.compile(r"\.{3,}|…+")


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def is_placeholder(text: str) -> bool:
    return bool(PLACEHOLDER.match(clean(text)))


def to_statement(prompt: str, option: str) -> str:
    p = clean(prompt)
    o = clean(option).rstrip(".")
    if not o:
        return p.rstrip("?") + "."

    if BLANK.search(p):
        filled = BLANK.sub(o, p, count=1)
        filled = clean(filled).rstrip("?").rstrip(".")
        return filled + "."

    p_no_q = p.rstrip("?").rstrip(".")

    m = re.match(
        r"^(What is|What are|Which of the following is|Which of the following are|"
        r"Which is|Which are|Who is|Who are)\s+(.+)$",
        p_no_q,
        re.I,
    )
    if m:
        return f"{o} is {m.group(2)}."

    m = re.match(
        r"^(What|Which|Who|Where|When|How|Why)\b(.+)$",
        p_no_q,
        re.I,
    )
    if m:
        return f"{p_no_q}: {o}."

    # Default assertion: claim the option completes the stem
    if p_no_q.lower().endswith((" is", " are", " means", " called", " known as")):
        return f"{p_no_q} {o}."

    return f"{p_no_q}: {o}."


def main() -> None:
    data = json.loads(QUESTIONS.read_text(encoding="utf-8"))
    cards: list[dict] = []

    for q in data["questions"]:
        answer = q.get("answer")
        if not answer:
            continue
        options = q.get("options") or []
        by_key = {o["key"]: o["text"] for o in options if o.get("key") and o.get("text") is not None}
        if answer not in by_key or is_placeholder(by_key[answer]):
            continue

        qid = q["id"]
        paper = q["paper"]
        prompt = q["prompt"]

        cards.append(
            {
                "id": f"tf-{qid}-true",
                "statement": to_statement(prompt, by_key[answer]),
                "isTrue": True,
                "sourceQuestionId": qid,
                "paper": paper,
            }
        )

        falses = 0
        for key, text in by_key.items():
            if key == answer or is_placeholder(text):
                continue
            cards.append(
                {
                    "id": f"tf-{qid}-false-{key}",
                    "statement": to_statement(prompt, text),
                    "isTrue": False,
                    "sourceQuestionId": qid,
                    "paper": paper,
                }
            )
            falses += 1
            if falses >= 3:
                break

    out = {"version": 1, "count": len(cards), "cards": cards}
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    true_n = sum(1 for c in cards if c["isTrue"])
    false_n = len(cards) - true_n
    print(f"Wrote {OUT.relative_to(ROOT)}: {len(cards)} cards ({true_n} true, {false_n} false)")


if __name__ == "__main__":
    main()
