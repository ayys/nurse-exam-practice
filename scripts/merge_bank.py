#!/usr/bin/env python3
"""Merge curated paper JSON files into public/data/questions.json."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = [
    ROOT / "scripts" / "staff-nurse-2082.json",
    ROOT / "scripts" / "tu-teaching-hospital-2078.json",
    ROOT / "scripts" / "staff-nurse-2080.json",
]
OUT = ROOT / "public" / "data" / "questions.json"

PAPERS = [
    {"id": "staff-nurse-2082", "title": "Staff Nurse 2082-04-10 (Key B)"},
    {"id": "tu-teaching-hospital-2078", "title": "TU Teaching Hospital 2078 (Memory-based)"},
    {"id": "staff-nurse-2080", "title": "Staff Nurse Vacancy 2080 (Memory-based)"},
]


def normalize(q: dict) -> dict | None:
    opts = []
    for o in q.get("options", []):
        key = str(o.get("key", "")).upper().strip()
        text = str(o.get("text", "")).strip()
        if key in "ABCD" and text:
            opts.append({"key": key, "text": text})
    ans = str(q.get("answer") or "").upper().strip()
    src = q.get("answerSource") or "unknown"
    if ans not in {o["key"] for o in opts}:
        return None
    if len(opts) < 2 or len(str(q.get("prompt", "")).strip()) < 8:
        return None
    return {
        "id": q["id"],
        "paper": q["paper"],
        "number": int(q["number"]),
        "prompt": str(q["prompt"]).strip(),
        "options": opts,
        "answer": ans,
        "answerSource": src,
    }


def main() -> None:
    by_id: dict[str, dict] = {}
    for path in SRC:
        data = json.loads(path.read_text(encoding="utf-8"))
        for q in data:
            nq = normalize(q)
            if nq:
                by_id[nq["id"]] = nq
    questions = sorted(by_id.values(), key=lambda q: (q["paper"], q["number"]))
    counts = Counter(q["paper"] for q in questions)
    papers = [{**p, "count": counts.get(p["id"], 0)} for p in PAPERS]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"version": 1, "papers": papers, "questions": questions}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {len(questions)} questions -> {OUT}")


if __name__ == "__main__":
    main()
