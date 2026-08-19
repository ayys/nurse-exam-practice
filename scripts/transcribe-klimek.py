#!/usr/bin/env python3
"""Transcribe Mark Klimek lectures to WebVTT with mlx-whisper.

Runs multiple lectures in parallel. Default is 2 workers — enough to speed
things up on 8GB Apple Silicon without paging the GPU. Override with --jobs.
"""

from __future__ import annotations

import argparse
import os
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

os.environ["PATH"] = "/opt/homebrew/bin:" + os.environ.get("PATH", "")

ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "public" / "klimek"
MODEL = os.environ.get("KLIMEK_WHISPER_MODEL", "mlx-community/whisper-small.en-mlx")

FILES = [
    ("h-labs.mp3", "NCLEX labs lecture: creatinine, INR, potassium, pH, BUN, hemoglobin, platelets."),
    ("i-psych-drugs.mp3", "NCLEX psych drugs: NMS, EPS, clozapine, Zoloft, geodon, haloperidol."),
    ("j-maternity-ob.mp3", "NCLEX maternity: pregnancy, labor stages, fetal heart, delivery."),
    ("e-diabetes.mp3", "NCLEX diabetes: insulin peaks, DKA, HHNK, DI, SIADH, hypoglycemia."),
    ("k-ob-2.mp3", "NCLEX OB complications: tocolytics, oxytocin, newborn, postpartum."),
    ("f-psych-pharm-hernias.mp3", "NCLEX psych pharm: phenothiazines, lithium, MAOIs, Prozac, dumping syndrome, hiatal hernia."),
    ("a-acid-base.mp3", "NCLEX acid-base: ABGs, pH, bicarb, metabolic, respiratory, potassium."),
    ("d-mobility-psych.mp3", "NCLEX crutches canes walkers, delusions, hallucinations, psych."),
    ("b-alcohol.mp3", "NCLEX alcohol: Wernicke, Korsakoff, AWS, delirium tremens, uppers downers."),
    ("g-endocrine.mp3", "NCLEX endocrine: thyroid, Addison, Cushing, adrenal."),
    ("c-cardiac-pharm.mp3", "NCLEX cardiac: calcium channel blockers, arrhythmias, chest tubes."),
    ("l-prioritization.mp3", "NCLEX prioritization and delegation, staff management."),
]


def ts(seconds: float) -> str:
    total_ms = max(0, int(round(seconds * 1000)))
    h, rem = divmod(total_ms, 3_600_000)
    m, rem = divmod(rem, 60_000)
    s, ms = divmod(rem, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def clean(text: str) -> str:
    return " ".join(text.replace("-->", "->").split()).strip()


def write_vtt(path: Path, segments: list[dict]) -> None:
    lines = ["WEBVTT", ""]
    last_end = -1.0
    n = 0
    for seg in segments:
        text = clean(str(seg.get("text", "")))
        if not text:
            continue
        start = float(seg.get("start", 0))
        end = float(seg.get("end", start + 2))
        if end <= start:
            end = start + 1.5
        if start < last_end:
            start = last_end
        if end <= start:
            continue
        n += 1
        lines.append(str(n))
        lines.append(f"{ts(start)} --> {ts(end)}")
        lines.append(text)
        lines.append("")
        last_end = end
    path.write_text("\n".join(lines), encoding="utf-8")


def transcribe_one(name: str, prompt: str, model: str) -> tuple[str, int, int]:
    os.environ["PATH"] = "/opt/homebrew/bin:" + os.environ.get("PATH", "")
    import mlx_whisper

    src = AUDIO_DIR / name
    dest = src.with_suffix(".vtt")
    print(f"start {name}", flush=True)
    result = mlx_whisper.transcribe(
        str(src),
        path_or_hf_repo=model,
        word_timestamps=False,
        language="en",
        initial_prompt=prompt,
        verbose=False,
    )
    segments = list(result.get("segments") or [])
    write_vtt(dest, segments)
    size = dest.stat().st_size
    print(f"done  {dest.name} ({len(segments)} cues, {size} bytes)", flush=True)
    return name, len(segments), size


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Transcribe Klimek lectures to VTT")
    parser.add_argument(
        "--jobs",
        type=int,
        default=2,
        help="Parallel lectures (default 2; 8GB machines should stay at 2)",
    )
    parser.add_argument("--force", action="store_true", help="Redo existing VTT files")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    jobs = max(1, args.jobs)

    pending: list[tuple[str, str]] = []
    for name, prompt in FILES:
        src = AUDIO_DIR / name
        dest = src.with_suffix(".vtt")
        if not src.exists():
            print(f"missing {src}", file=sys.stderr)
            return 1
        if dest.exists() and dest.stat().st_size > 40 and not args.force:
            print(f"skip {dest.name}")
            continue
        pending.append((name, prompt))

    if not pending:
        print("nothing to do")
        return 0

    jobs = min(jobs, len(pending))
    print(f"transcribing {len(pending)} lectures with {jobs} workers", flush=True)

    if jobs == 1:
        for name, prompt in pending:
            transcribe_one(name, prompt, MODEL)
        return 0

    failures = 0
    with ProcessPoolExecutor(max_workers=jobs) as pool:
        futures = [pool.submit(transcribe_one, name, prompt, MODEL) for name, prompt in pending]
        for fut in as_completed(futures):
            try:
                fut.result()
            except Exception as exc:
                failures += 1
                print(f"failed: {exc}", file=sys.stderr, flush=True)

    if failures:
        print(f"finished with {failures} failure(s)", file=sys.stderr)
        return 1
    print("finished all")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
