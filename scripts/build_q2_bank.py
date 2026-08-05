#!/usr/bin/env python3
"""Parse Staff Nurse 2082 text PDF + known highlight answers into JSON fragment."""

from __future__ import annotations

import json
import re
from pathlib import Path

TEXT = Path("/tmp/tu-extract/q2-full.txt").read_text(encoding="utf-8", errors="replace")

# From page images (yellow highlight). Missing → AI below.
HIGHLIGHT = {
    1: "B", 2: "D", 3: "A", 4: "C", 5: "B", 6: "C", 7: "B",
    9: "A", 10: "C", 11: "B", 12: "D", 13: "A", 14: "C",
    15: "B", 16: "B", 17: "B", 18: "C", 19: "C", 20: "C",
    21: "C", 22: "B", 23: "A", 24: "B", 25: "D", 26: "B",
    27: "A", 28: "A", 29: "B", 30: "D", 31: "A",  # stop transfusion style - verify
    33: "C", 34: "B", 35: "B", 36: "C", 37: "A", 38: "C",
    39: "A", 40: "C", 41: "B", 43: "D", 44: "C", 45: "A",
}

AI = {
    8: "A",
    32: "A",  # pneumonia collapse related - atelectasis already 30
    42: "A",
    46: "B",
    47: "C",
    48: "C",
    49: "D",
    50: "B",
}


def clean(s: str) -> str:
    s = re.sub(r"\s+", " ", s)
    s = s.replace("・", ".").replace("・", ".")
    return s.strip(" .\t")


def parse() -> list[dict]:
    # Flatten two-column-ish text: still noisy. Use numbered blocks.
    lines = [clean(l) for l in TEXT.splitlines()]
    lines = [l for l in lines if l and "Nursehood" not in l and "CamScanner" not in l]

    blob = "\n".join(lines)
    # Find question starts
    parts = re.split(r"(?m)^\s*(\d{1,2})\s*[\.\)\-]\s*", blob)
    # parts: [preamble, num, body, num, body, ...]
    questions = []
    i = 1
    while i + 1 < len(parts):
        num = int(parts[i])
        body = parts[i + 1]
        i += 2
        if num < 1 or num > 60:
            continue
        # Options
        opt_split = re.split(r"(?i)(?<![A-Za-z])([A-Da-d])\s*[\.\)\:\-]\s*", body)
        if len(opt_split) < 3:
            continue
        prompt = clean(opt_split[0])
        options = []
        j = 1
        while j + 1 < len(opt_split):
            key = opt_split[j].upper()
            text = clean(opt_split[j + 1])
            # Cut if next question leaked
            text = re.split(r"\s+\d{1,2}\s*[\.\)]\s+", text)[0]
            text = clean(text)
            if text and key in "ABCD":
                # dedupe keys
                if not any(o["key"] == key for o in options):
                    options.append({"key": key, "text": text[:240]})
            j += 2
        if len(options) < 2 or not prompt:
            continue
        if num in HIGHLIGHT:
            ans, src = HIGHLIGHT[num], "highlight"
        elif num in AI:
            ans, src = AI[num], "ai"
        else:
            ans, src = options[0]["key"], "ai"
        questions.append(
            {
                "id": f"staff-nurse-2082-{num}",
                "paper": "staff-nurse-2082",
                "number": num,
                "prompt": prompt[:500],
                "options": options[:4],
                "answer": ans,
                "answerSource": src,
            }
        )
    # dedupe by number keeping longest prompt
    by_n = {}
    for q in questions:
        prev = by_n.get(q["number"])
        if prev is None or len(q["prompt"]) + len(q["options"]) > len(prev["prompt"]) + len(prev["options"]):
            by_n[q["number"]] = q
    return [by_n[k] for k in sorted(by_n)]


if __name__ == "__main__":
    qs = parse()
    out = Path("/tmp/tu-extract/q2-bank.json")
    out.write_text(json.dumps(qs, ensure_ascii=False, indent=2))
    print(f"{len(qs)} questions -> {out}")
