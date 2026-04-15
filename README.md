# Video Labeler

Annotation tool for skateboarding videos targeting trick outcome classification and trick type recognition. Built for a small team of domain experts.

## Setup

Requires Node.js 18+ and optionally `ffprobe` (from FFmpeg) for video metadata extraction.

```bash
npm install
```

## Running

Start the server and client in separate terminals:

```bash
# Terminal 1 — API server (default port 3141)
VIDEO_DIR=~/path/to/videos npm run dev --workspace=server

# Terminal 2 — frontend (opens at http://localhost:5173)
npm run dev --workspace=client
```

| Variable | Default | Description |
|----------|---------|-------------|
| `VIDEO_DIR` | `./videos` | Directory containing video files |
| `LABEL_DIR` | `./labels` | Directory where label JSON files are written |
| `PORT` | `3141` | Server port |

## Usage

1. Set your labeler ID in the top-right corner of the header.
2. Select a video from the sidebar.
3. Mark attempt boundaries:
   - **Pre-cut clips** (under 30s with no existing labels): click "Use full clip" to auto-fill boundaries.
   - **Raw footage**: scrub to the start of the attempt and press **I**, then scrub to the end and press **O**.
4. Fill out the label form: outcome, trick category, trick name, quality flags, confidence.
5. Click **Save Sample**. Repeat for additional attempts in the same video.
6. Switch to **Review** mode in the header to see all labels across videos in a filterable table.

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| Space | Play / pause |
| Left / Right | Step one frame back / forward |
| Shift + Left / Right | Jump one second |
| I | Mark attempt start |
| O | Mark attempt end |
| 1 / 2 / 3 / 4 | Playback speed: 0.25x / 0.5x / 1x / 2x |
| N / P | Next / previous video |
| Ctrl+S | Force save |

Shortcuts are disabled when a text input is focused.

## Label format

One JSON file per video is written to `LABEL_DIR`:

```json
{
  "source_video": "vid012.mp4",
  "video_meta": { "duration_sec": 142.5, "fps": 29.97, "resolution": "1920x1080" },
  "samples": [
    {
      "sample_id": "vid012_aBcDeFgH",
      "attempt_start_sec": 23.4,
      "attempt_end_sec": 25.9,
      "outcome": "landed",
      "trick_category": "flip_trick",
      "trick_name": "kickflip",
      "quality_flags": ["shaky_camera"],
      "labeler_confidence": "high",
      "labeler_id": "jess",
      "notes": "",
      "created_at": "2026-04-10T14:30:00Z",
      "updated_at": "2026-04-10T14:30:00Z"
    }
  ]
}
```

## Eval

There's a vision model eval in `eval/` that tests whether an LLM can tell if a trick was landed by looking at frames extracted from labeled clips. It uses pydantic-evals, the OpenAI SDK, and ffmpeg.

```bash
cd eval
uv run python run_eval.py
```

Requires Python 3.11+, [uv](https://docs.astral.sh/uv/), ffmpeg, and a running OpenAI-compatible vision endpoint (configured in `eval/task.py`). See `eval/README.md` for details.

## Video requirements

- **Format:** MP4 (H.264) is recommended for browser compatibility. MOV, WebM, MKV, and AVI are also accepted but may not play in all browsers.
- **Faststart:** For large files, encode with `ffmpeg -movflags +faststart` so seeking works without downloading the entire file.
- **Metadata:** Install `ffprobe` (part of FFmpeg) to enable automatic FPS, duration, and resolution detection. Without it the player defaults to 30 FPS.
