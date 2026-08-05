#!/usr/bin/env python3
"""Extract MCQs + answers from rendered PDF page images."""

from __future__ import annotations

import json
import re
import subprocess
from collections import defaultdict
from dataclasses import dataclass, asdict
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parents[1] / "public" / "data" / "questions.json"
EXTRACT_DIR = Path("/tmp/tu-extract")


@dataclass
class Option:
    key: str
    text: str


@dataclass
class Question:
    id: str
    paper: str
    number: int
    prompt: str
    options: list[Option]
    answer: str | None
    answer_source: str  # highlight | key | ai | unknown


def ocr_tsv(image_path: Path) -> list[dict]:
    result = subprocess.run(
        ["tesseract", str(image_path), "stdout", "--psm", "6", "tsv"],
        capture_output=True,
        text=True,
        check=False,
    )
    lines = result.stdout.strip().splitlines()
    if len(lines) < 2:
        return []
    headers = lines[0].split("\t")
    rows = []
    for line in lines[1:]:
        parts = line.split("\t")
        if len(parts) != len(headers):
            continue
        row = dict(zip(headers, parts))
        try:
            conf = float(row["conf"])
        except ValueError:
            continue
        if conf < 0 or not row.get("text", "").strip():
            continue
        rows.append(
            {
                "text": row["text"].strip(),
                "left": int(row["left"]),
                "top": int(row["top"]),
                "width": int(row["width"]),
                "height": int(row["height"]),
                "conf": conf,
                "block": int(row["block_num"]),
                "par": int(row["par_num"]),
                "line": int(row["line_num"]),
            }
        )
    return rows


def highlight_mask(img: Image.Image) -> np.ndarray:
    """Boolean mask of yellow/green highlighter pixels."""
    arr = np.asarray(img.convert("RGB")).astype(np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    # Yellow highlighter
    yellow = (r > 180) & (g > 180) & (b < 160) & ((r + g) / 2 - b > 40)
    # Green highlighter
    green = (g > 160) & (g > r + 15) & (g > b + 15) & (r < 220) & (b < 200)
    # Light gray/blue digital highlight sometimes used
    soft = (r > 200) & (g > 200) & (b > 180) & (r < 245) & (g < 245) & ((r + g + b) / 3 < 235)
    # Prefer strong yellow/green; soft only if saturated relative to neighbors later
    return yellow | green


def words_in_highlights(rows: list[dict], mask: np.ndarray, pad: int = 4) -> set[int]:
    """Return indices of OCR words that overlap highlighter pixels."""
    h, w = mask.shape
    hit = set()
    for i, row in enumerate(rows):
        x0 = max(0, row["left"] - pad)
        y0 = max(0, row["top"] - pad)
        x1 = min(w, row["left"] + row["width"] + pad)
        y1 = min(h, row["top"] + row["height"] + pad)
        if x1 <= x0 or y1 <= y0:
            continue
        region = mask[y0:y1, x0:x1]
        if region.size and region.mean() > 0.08:
            hit.add(i)
    return hit


def stitch_lines(rows: list[dict]) -> list[dict]:
    """Group OCR words into reading-order lines."""
    if not rows:
        return []
    # Sort by top then left
    ordered = sorted(rows, key=lambda r: (r["top"] // 18, r["left"]))
    lines: list[list[dict]] = []
    for word in ordered:
        if not lines:
            lines.append([word])
            continue
        last = lines[-1]
        avg_top = sum(w["top"] for w in last) / len(last)
        if abs(word["top"] - avg_top) <= 16:
            last.append(word)
        else:
            lines.append([word])
    out = []
    for line in lines:
        line = sorted(line, key=lambda w: w["left"])
        text = " ".join(w["text"] for w in line)
        out.append(
            {
                "text": text,
                "left": line[0]["left"],
                "top": min(w["top"] for w in line),
                "right": line[-1]["left"] + line[-1]["width"],
                "bottom": max(w["top"] + w["height"] for w in line),
                "words": line,
            }
        )
    return out


OPTION_RE = re.compile(
    r"^(?:([A-Da-d])[\.\)\:\-]\s*)(.+)$"
)
QNUM_RE = re.compile(r"^(\d{1,3})[\.\)\-]\s*(.*)$")


def parse_page_text(lines: list[dict], highlighted_word_ids: set[int], paper: str, page: int) -> list[Question]:
    """Heuristic parse of two-column MCQ pages from OCR lines."""
    # Split into columns by median left of lines
    if not lines:
        return []
    mids = sorted(l["left"] for l in lines)
    median_left = mids[len(mids) // 2]
    # Better: use page width mid if available
    max_right = max(l["right"] for l in lines)
    split_x = max_right * 0.48

    cols = {"L": [], "R": []}
    for line in lines:
        cols["L" if line["left"] < split_x else "R"].append(line)

    questions: list[Question] = []
    for col_key in ("L", "R"):
        col_lines = sorted(cols[col_key], key=lambda l: l["top"])
        current: Question | None = None
        for line in col_lines:
            text = re.sub(r"\s+", " ", line["text"]).strip()
            if not text or len(text) < 2:
                continue
            # Skip headers/watermarks
            low = text.lower()
            if any(
                s in low
                for s in (
                    "nursehood",
                    "camscanner",
                    "service commission",
                    "multiple choice",
                    "memory based",
                    "scanned with",
                )
            ):
                continue

            qm = QNUM_RE.match(text)
            if qm and int(qm.group(1)) <= 200:
                if current and current.options:
                    questions.append(current)
                num = int(qm.group(1))
                prompt = qm.group(2).strip()
                current = Question(
                    id=f"{paper}-{num}",
                    paper=paper,
                    number=num,
                    prompt=prompt,
                    options=[],
                    answer=None,
                    answer_source="unknown",
                )
                # Check if option starts on same line (rare)
                continue

            if current is None:
                continue

            om = OPTION_RE.match(text)
            if om:
                key = om.group(1).upper()
                opt_text = om.group(2).strip()
                current.options.append(Option(key=key, text=opt_text))
                # Highlighted?
                word_idxs = {id(w) for w in line["words"]}
                # Use object identity via index in original rows — instead check pixel overlap via word flags
                # We mark words by storing highlight flag
                if any(w.get("hl") for w in line["words"]):
                    current.answer = key
                    current.answer_source = "highlight"
            else:
                # Continuation of prompt or option
                if current.options:
                    current.options[-1].text = (current.options[-1].text + " " + text).strip()
                    if any(w.get("hl") for w in line["words"]) and current.answer is None:
                        current.answer = current.options[-1].key
                        current.answer_source = "highlight"
                else:
                    current.prompt = (current.prompt + " " + text).strip()

        if current and current.options:
            questions.append(current)

    return questions


def annotate_highlights(rows: list[dict], hit: set[int]) -> list[dict]:
    for i, row in enumerate(rows):
        row["hl"] = i in hit
    return rows


def extract_from_images(pattern: str, paper: str) -> list[Question]:
    paths = sorted(EXTRACT_DIR.glob(pattern))
    all_q: dict[int, Question] = {}
    for path in paths:
        print(f"OCR {path.name}...")
        img = Image.open(path)
        mask = highlight_mask(img)
        rows = ocr_tsv(path)
        hit = words_in_highlights(rows, mask)
        rows = annotate_highlights(rows, hit)
        lines = stitch_lines(rows)
        page_qs = parse_page_text(lines, hit, paper, 0)
        for q in page_qs:
            # Keep richer version / merge answers
            prev = all_q.get(q.number)
            if prev is None:
                all_q[q.number] = q
            else:
                if len(q.options) > len(prev.options):
                    q.answer = q.answer or prev.answer
                    q.answer_source = q.answer_source if q.answer else prev.answer_source
                    all_q[q.number] = q
                elif q.answer and not prev.answer:
                    prev.answer = q.answer
                    prev.answer_source = q.answer_source
    return [all_q[k] for k in sorted(all_q)]


# Hand-validated / AI answers for known gaps & key papers
AI_ANSWERS: dict[str, dict[int, str]] = {
    "staff-nurse-2082": {
        8: "A",  # Conscience = superego
    },
    "tu-teaching-hospital-2078": {
        8: "A",  # hypotonic uterine dystocia / atony is common PPH cause
        10: "D",  # Benzodiazepines for alcohol withdrawal
        13: "B",  # Immobilization in multiple injury
        15: "C",  # charcoal oral and NG
    },
}


# Curated high-quality bank for papers where OCR is messy — filled from visual review + keys
def load_curated() -> list[dict]:
    curated_path = Path(__file__).parent / "curated_questions.json"
    if curated_path.exists():
        return json.loads(curated_path.read_text())
    return []


def main() -> None:
    papers = [
        ("q2-*.png", "staff-nurse-2082", "Staff Nurse 2082-04-10 (Key B)"),
        ("th-*.png", "tu-teaching-hospital-2078", "TU Teaching Hospital 2078 (Memory-based)"),
        ("past-*.png", "staff-nurse-2080", "Staff Nurse Vacancy 2080 (Memory-based)"),
    ]

    bank = []
    meta_papers = []

    # Prefer curated bank if present (higher quality)
    curated = load_curated()
    if curated:
        print(f"Using curated bank ({len(curated)} questions)")
        bank = curated
    else:
        for pattern, paper_id, title in papers:
            qs = extract_from_images(pattern, paper_id)
            ai_map = AI_ANSWERS.get(paper_id, {})
            for q in qs:
                if q.answer is None and q.number in ai_map:
                    q.answer = ai_map[q.number]
                    q.answer_source = "ai"
                bank.append(
                    {
                        "id": q.id,
                        "paper": paper_id,
                        "number": q.number,
                        "prompt": q.prompt,
                        "options": [asdict(o) for o in q.options],
                        "answer": q.answer,
                        "answerSource": q.answer_source,
                    }
                )
            meta_papers.append({"id": paper_id, "title": title, "count": len(qs)})
            print(f"{paper_id}: {len(qs)} questions")

    # Deduplicate by id
    by_id = {}
    for q in bank:
        by_id[q["id"]] = q
    questions = list(by_id.values())
    questions.sort(key=lambda q: (q["paper"], q["number"]))

    papers_meta = {}
    for q in questions:
        papers_meta.setdefault(q["paper"], 0)
        papers_meta[q["paper"]] += 1

    payload = {
        "version": 1,
        "papers": [
            {"id": pid, "title": title, "count": papers_meta.get(pid, 0)}
            for _, pid, title in papers
        ],
        "questions": questions,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    print(f"Wrote {len(questions)} questions -> {OUT}")


if __name__ == "__main__":
    main()
