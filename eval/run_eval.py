"""Skate trick landing eval: compare vision model predictions against human labels."""

import json
from datetime import datetime, timezone
from pathlib import Path

from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import EqualsExpected

from models import TrickAttempt
from task import MODELS, eval_cache, is_model_available, make_classifier

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


def generate_html_report(
    cases: list[Case[TrickAttempt, bool, None]],
    model_names: list[str],
) -> Path:
    """Build a self-contained HTML report with embedded frame images and multi-model comparison."""
    REPORTS_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    out_path = REPORTS_DIR / f"eval-{timestamp}.html"

    total = len(cases)

    # Compute per-model accuracy
    model_stats: list[dict] = []
    for model_name in model_names:
        model_cache = eval_cache.get(model_name, {})
        correct = sum(
            1
            for c in cases
            if c.inputs.sample_id in model_cache
            and model_cache[c.inputs.sample_id]["predicted"] == c.expected_output
        )
        model_stats.append(
            {"name": model_name, "correct": correct, "total": total}
        )
    model_stats.sort(key=lambda s: s["correct"], reverse=True)

    # Summary table rows
    summary_rows = ""
    for i, s in enumerate(model_stats):
        acc = s["correct"] / s["total"] * 100 if s["total"] else 0
        row_class = ' class="best"' if i == 0 else ""
        summary_rows += (
            f"<tr{row_class}>"
            f"<td>{s['name']}</td>"
            f"<td>{s['correct']}</td>"
            f"<td>{s['total']}</td>"
            f"<td>{acc:.0f}%</td>"
            f"</tr>\n"
        )

    # Per-sample cards
    rows_html = ""
    for c in cases:
        # Get frames from any model's cache (they're identical)
        frames_b64 = None
        for model_name in model_names:
            cache_entry = eval_cache.get(model_name, {}).get(c.inputs.sample_id)
            if cache_entry:
                frames_b64 = cache_entry["frames"]
                break
        if frames_b64 is None:
            continue

        frames_html = ""
        for i, frame in enumerate(frames_b64, 1):
            frames_html += (
                f'<div class="frame">'
                f'<img src="data:image/png;base64,{frame}" alt="Frame {i}">'
                f'<span class="frame-num">{i}</span>'
                f"</div>\n"
            )

        # Build prediction rows for each model
        pred_rows = ""
        all_correct = True
        all_wrong = True
        for model_name in model_names:
            cache_entry = eval_cache.get(model_name, {}).get(c.inputs.sample_id)
            if not cache_entry:
                pred_rows += (
                    f"<tr><td>{model_name}</td><td>—</td><td>—</td>"
                    f'<td><span class="badge skipped">SKIPPED</span></td></tr>\n'
                )
                continue

            predicted = cache_entry["predicted"]
            expected = c.expected_output
            is_correct = predicted == expected
            raw_answer = cache_entry["raw_answer"]

            if is_correct:
                all_wrong = False
            else:
                all_correct = False

            status_class = "correct" if is_correct else "wrong"
            status_label = "CORRECT" if is_correct else "WRONG"
            pred_label = "Landed" if predicted else "Not landed"

            pred_rows += (
                f"<tr>"
                f"<td>{model_name}</td>"
                f"<td>{pred_label}</td>"
                f'<td class="raw-answer">"{raw_answer}"</td>'
                f'<td><span class="badge {status_class}">{status_label}</span></td>'
                f"</tr>\n"
            )

        if all_correct:
            card_class = "correct"
        elif all_wrong:
            card_class = "wrong"
        else:
            card_class = "mixed"

        exp_label = "Landed" if c.expected_output else "Not landed"

        rows_html += f"""
        <div class="card {card_class}">
          <div class="card-header">
            <span class="sample-id">{c.inputs.sample_id}</span>
            <span class="trick-name">{c.inputs.trick_name}</span>
            <span class="expected">Expected: <strong>{exp_label}</strong></span>
          </div>
          <div class="frames">{frames_html}</div>
          <div class="predictions">
            <table>
              <thead><tr><th>Model</th><th>Prediction</th><th>Raw answer</th><th>Result</th></tr></thead>
              <tbody>{pred_rows}</tbody>
            </table>
          </div>
        </div>
        """

    models_list = ", ".join(model_names)

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
  h2 {{ margin-bottom: 0.75rem; font-size: 1.1rem; color: #ccc; }}
  /* Summary table */
  .summary {{ margin-bottom: 2rem; padding: 1rem; background: #1a1a1a; border-radius: 8px; }}
  .summary table {{ width: 100%; border-collapse: collapse; }}
  .summary th {{ text-align: left; padding: 0.5rem 1rem; color: #999; border-bottom: 1px solid #333; font-size: 0.85rem; }}
  .summary td {{ padding: 0.5rem 1rem; font-size: 1rem; }}
  .summary tr.best td {{ color: #22c55e; font-weight: 700; }}
  /* Cards */
  .card {{ background: #1a1a1a; border-radius: 8px; margin-bottom: 1.5rem; overflow: hidden; border-left: 4px solid; }}
  .card.correct {{ border-color: #22c55e; }}
  .card.wrong {{ border-color: #ef4444; }}
  .card.mixed {{ border-color: #f59e0b; }}
  .card-header {{ display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; background: #222; }}
  .sample-id {{ font-family: monospace; font-size: 0.85rem; color: #aaa; }}
  .trick-name {{ font-weight: 600; }}
  .expected {{ margin-left: auto; color: #ccc; font-size: 0.9rem; }}
  .badge {{ padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }}
  .badge.correct {{ background: #22c55e22; color: #22c55e; }}
  .badge.wrong {{ background: #ef444422; color: #ef4444; }}
  .badge.skipped {{ background: #66666622; color: #666; }}
  .frames {{ display: flex; gap: 4px; padding: 0.75rem; overflow-x: auto; }}
  .frame {{ position: relative; flex-shrink: 0; }}
  .frame img {{ height: 360px; width: auto; border-radius: 4px; display: block; }}
  .frame-num {{ position: absolute; top: 4px; left: 4px; background: #000a; color: #fff; font-size: 0.7rem; padding: 1px 5px; border-radius: 3px; }}
  .predictions {{ padding: 0.75rem 1rem; }}
  .predictions table {{ width: 100%; border-collapse: collapse; }}
  .predictions th {{ text-align: left; padding: 0.4rem 0.75rem; color: #999; border-bottom: 1px solid #333; font-size: 0.8rem; }}
  .predictions td {{ padding: 0.4rem 0.75rem; font-size: 0.9rem; color: #ccc; }}
  .raw-answer {{ font-family: monospace; font-size: 0.8rem; color: #888; }}
</style>
</head>
<body>
  <h1>Skate Trick Landing Eval</h1>
  <div class="meta">Models: {models_list} &middot; {timestamp}</div>

  <div class="summary">
    <h2>Results Summary</h2>
    <table>
      <thead><tr><th>Model</th><th>Correct</th><th>Total</th><th>Accuracy</th></tr></thead>
      <tbody>{summary_rows}</tbody>
    </table>
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

    available_models = []
    for config in MODELS:
        if is_model_available(config):
            available_models.append(config)
            print(f"  Model: {config.name} -- ready")
        else:
            print(f"  Model: {config.name} -- SKIPPED (missing {config.api_key_env})")

    if not available_models:
        print("\nERROR: No models available. Check API keys.")
        return

    print()

    for config in available_models:
        print(f"--- Evaluating: {config.name} ---")
        classifier = make_classifier(config)

        dataset = Dataset(
            name=f"skate-trick-landing-{config.name}",
            cases=cases,
        )

        try:
            report = dataset.evaluate_sync(classifier, max_concurrency=1)
            report.print(include_input=True, include_output=True)
        except Exception as e:
            print(f"ERROR running {config.name}: {e}")
            continue
        print()

    evaluated_models = [c.name for c in available_models if c.name in eval_cache]
    report_path = generate_html_report(cases, evaluated_models)
    print(f"\nHTML report: {report_path}")


if __name__ == "__main__":
    main()
