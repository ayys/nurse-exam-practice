#!/usr/bin/env python3
"""Copy Mark Klimek audio/PDFs from Downloads into public/klimek."""

from pathlib import Path
import shutil
import sys

SRC = Path.home() / "Downloads" / "mark-klimek"
DST = Path(__file__).resolve().parents[1] / "public" / "klimek"

MAPPING = {
    "Acid Base Principles.mp3": "a-acid-base.mp3",
    "B Mark Klimek - Alcohol.mp3": "b-alcohol.mp3",
    "C Mark Klimek - Cardiac and Pharm.mp3": "c-cardiac-pharm.mp3",
    "D Mark Klimek - Canes Crutches Walkers and Psych.mp3": "d-mobility-psych.mp3",
    "E Mark Klimek - Diabetes.mp3": "e-diabetes.mp3",
    "F Mark Klimek - Psych Pharm Hernias.mp3": "f-psych-pharm-hernias.mp3",
    "G Mark Klimek - Endocrine.mp3": "g-endocrine.mp3",
    "H Mark Klimek - Labs.mp3": "h-labs.mp3",
    "I Mark Klimek - Psych Drugs.mp3": "i-psych-drugs.mp3",
    "J Mark Klimek - Maternity and OB.mp3": "j-maternity-ob.mp3",
    "K Mark Klimek - OB 2.mp3": "k-ob-2.mp3",
    "L Mark Klimek - Prioritization and Delegation.mp3": "l-prioritization.mp3",
    "Mark Klemik Blue Book.pdf": "blue-book.pdf",
    "Mark Klemik Yellow Book.pdf": "yellow-book.pdf",
    "Mark Klemik Lectures.pdf": "lectures.pdf",
    "Mark Klemik Notes.pdf": "notes.pdf",
}


def main() -> int:
    if not SRC.is_dir():
        print(f"Missing folder: {SRC}", file=sys.stderr)
        return 1
    DST.mkdir(parents=True, exist_ok=True)
    for old, new in MAPPING.items():
        source = SRC / old
        if not source.exists():
            print(f"Missing file: {source}", file=sys.stderr)
            return 1
        shutil.copy2(source, DST / new)
        print(new)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
