"""Skate trick landing eval: compare vision model predictions against human labels."""

import json
from pathlib import Path

from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import EqualsExpected

from models import TrickAttempt
from task import classify_trick_landed

REPO_ROOT = Path(__file__).resolve().parent.parent
LABELS_DIR = REPO_ROOT / "labels"
VIDEOS_DIR = REPO_ROOT / "videos"


def load_cases() -> list[Case[TrickAttempt, bool, None]]:
    """Read all label files, build one Case per sample."""
    cases: list[Case[TrickAttempt, bool, None]] = []

    for label_file in sorted(LABELS_DIR.glob("*.labels.json")):
        data = json.loads(label_file.read_text())
        source_video = data["source_video"]
        video_path = VIDEOS_DIR / source_video

        if not video_path.exists():
            print(f"WARNING: video not found for {source_video}, skipping")
            continue

        for sample in data["samples"]:
            expected_landed = sample["outcome"] == "landed"

            inputs = TrickAttempt(
                sample_id=sample["sample_id"],
                video_path=str(video_path),
                attempt_start_sec=sample["attempt_start_sec"],
                attempt_end_sec=sample["attempt_end_sec"],
                trick_name=sample["trick_name"],
            )

            cases.append(
                Case(
                    name=f"{sample['sample_id']} ({sample['trick_name']}, {sample['outcome']})",
                    inputs=inputs,
                    expected_output=expected_landed,
                    evaluators=[EqualsExpected()],
                )
            )

    return cases


def main():
    cases = load_cases()
    label_count = len(list(LABELS_DIR.glob("*.labels.json")))
    print(f"Loaded {len(cases)} cases from {label_count} label files")
    print(f"  Landed (positive): {sum(1 for c in cases if c.expected_output)}")
    print(f"  Not landed (negative): {sum(1 for c in cases if not c.expected_output)}")
    print()

    dataset = Dataset(
        name="skate-trick-landing",
        cases=cases,
    )

    report = dataset.evaluate_sync(classify_trick_landed)
    report.print(include_input=True, include_output=True)


if __name__ == "__main__":
    main()
