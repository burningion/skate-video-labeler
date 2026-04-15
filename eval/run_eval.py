"""Skate trick landing eval: compare vision model predictions against human labels."""

import json
from datetime import datetime, timezone
from pathlib import Path

from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import EqualsExpected

from models import TrickAttempt
from task import MODEL, classify_trick_landed, eval_cache

REPO_ROOT = Path(__file__).resolve().parent.parent
LABELS_DIR = REPO_ROOT / "labels"
VIDEOS_DIR = REPO_ROOT / "videos"
REPORTS_DIR = Path(__file__).resolve().parent / "reports"


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


def generate_html_report(cases: list[Case[TrickAttempt, bool, None]]) -> Path:
    """Build a self-contained HTML report with embedded frame images."""
    REPORTS_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    out_path = REPORTS_DIR / f"eval-{timestamp}.html"

    correct = sum(
        1
        for c in cases
        if c.inputs.sample_id in eval_cache
        and eval_cache[c.inputs.sample_id]["predicted"] == c.expected_output
    )
    total = len(cases)

    rows_html = ""
    for c in cases:
        cache = eval_cache.get(c.inputs.sample_id)
        if not cache:
            continue

        predicted = cache["predicted"]
        expected = c.expected_output
        is_correct = predicted == expected
        raw_answer = cache["raw_answer"]

        frames_html = ""
        for i, frame in enumerate(cache["frames"], 1):
            frames_html += (
                f'<div class="frame">'
                f'<img src="data:image/png;base64,{frame}" alt="Frame {i}">'
                f'<span class="frame-num">{i}</span>'
                f"</div>\n"
            )

        status_class = "correct" if is_correct else "wrong"
        status_label = "CORRECT" if is_correct else "WRONG"
        pred_label = "Landed" if predicted else "Not landed"
        exp_label = "Landed" if expected else "Not landed"

        rows_html += f"""
        <div class="card {status_class}">
          <div class="card-header">
            <span class="sample-id">{c.inputs.sample_id}</span>
            <span class="trick-name">{c.inputs.trick_name}</span>
            <span class="badge {status_class}">{status_label}</span>
          </div>
          <div class="frames">{frames_html}</div>
          <div class="card-footer">
            <span>Expected: <strong>{exp_label}</strong></span>
            <span>Predicted: <strong>{pred_label}</strong></span>
            <span class="raw-answer">Raw: "{raw_answer}"</span>
          </div>
        </div>
        """

    html = f"""\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Skate Eval Report — {timestamp}</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: system-ui, -apple-system, sans-serif; background: #111; color: #eee; padding: 2rem; }}
  h1 {{ margin-bottom: 0.25rem; }}
  .meta {{ color: #999; margin-bottom: 1.5rem; font-size: 0.9rem; }}
  .summary {{ font-size: 1.2rem; margin-bottom: 2rem; padding: 1rem; background: #1a1a1a; border-radius: 8px; }}
  .summary strong {{ color: #fff; }}
  .card {{ background: #1a1a1a; border-radius: 8px; margin-bottom: 1.5rem; overflow: hidden; border-left: 4px solid; }}
  .card.correct {{ border-color: #22c55e; }}
  .card.wrong {{ border-color: #ef4444; }}
  .card-header {{ display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; background: #222; }}
  .sample-id {{ font-family: monospace; font-size: 0.85rem; color: #aaa; }}
  .trick-name {{ font-weight: 600; }}
  .badge {{ margin-left: auto; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }}
  .badge.correct {{ background: #22c55e22; color: #22c55e; }}
  .badge.wrong {{ background: #ef444422; color: #ef4444; }}
  .frames {{ display: flex; gap: 4px; padding: 0.75rem; overflow-x: auto; }}
  .frame {{ position: relative; flex-shrink: 0; }}
  .frame img {{ height: 360px; width: auto; border-radius: 4px; display: block; }}
  .frame-num {{ position: absolute; top: 4px; left: 4px; background: #000a; color: #fff; font-size: 0.7rem; padding: 1px 5px; border-radius: 3px; }}
  .card-footer {{ display: flex; gap: 2rem; padding: 0.75rem 1rem; font-size: 0.9rem; color: #ccc; flex-wrap: wrap; }}
  .raw-answer {{ color: #888; font-family: monospace; font-size: 0.8rem; }}
</style>
</head>
<body>
  <h1>Skate Trick Landing Eval</h1>
  <div class="meta">Model: {MODEL} &middot; {timestamp}</div>
  <div class="summary">
    <strong>{correct}</strong> / <strong>{total}</strong> correct
    ({correct / total * 100:.0f}% accuracy)
  </div>
  {rows_html}
</body>
</html>"""

    out_path.write_text(html)
    return out_path


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

    report_path = generate_html_report(cases)
    print(f"\nHTML report: {report_path}")


if __name__ == "__main__":
    main()
