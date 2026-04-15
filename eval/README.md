# Skate Trick Landing Eval

Vision model eval that tests whether an LLM can determine if a skateboarding trick was landed by looking at frames extracted from labeled video clips.

## How it works

1. Reads all `labels/*.labels.json` files to discover labeled trick attempts
2. For each attempt, extracts 5 evenly-spaced frames from the video using ffmpeg (scaled to 512px wide)
3. Sends the frames to a vision LLM via an OpenAI-compatible endpoint
4. Asks: "Did the skater land this trick?" — expects "landed" or "failed"
5. Compares the model's answer to the human label (`landed` = True, everything else = False)
6. Reports accuracy using pydantic-evals

Frames are extracted fresh on every run — there's no caching layer. With ~11 samples and 5 frames each, the ffmpeg extraction takes a few seconds total.

## Requirements

- Python 3.11+
- [uv](https://docs.astral.sh/uv/)
- ffmpeg on PATH
- A running OpenAI-compatible vision endpoint

## Setup & running

```bash
cd eval
uv run python run_eval.py
```

`uv` installs dependencies automatically on first run.

## Configuration

The endpoint and model are set in `task.py`:

```python
client = OpenAI(
    base_url="http://puget2:8080/v1",
    api_key="not-needed",
)
MODEL = "unsloth/Qwen3.5-397B-A17B-GGUF:UD-Q3_K_XL"
```

Edit these to point at a different model or endpoint.

## Files

| File | Purpose |
|------|---------|
| `run_eval.py` | Entry point — loads cases from labels, builds dataset, runs eval, prints report |
| `task.py` | Frame extraction (ffmpeg) and vision model classification |
| `models.py` | `TrickAttempt` Pydantic model used as eval case input |
| `pyproject.toml` | Dependencies: `pydantic-evals`, `openai`, `pydantic` |
