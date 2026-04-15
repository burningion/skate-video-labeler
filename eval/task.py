import base64
import subprocess

from openai import OpenAI

from models import TrickAttempt

client = OpenAI(
    base_url="http://puget2:8080/v1",
    api_key="not-needed",
)

MODEL = "unsloth/Qwen3.5-397B-A17B-GGUF:UD-Q3_K_XL"

SYSTEM_PROMPT = """\
You are a skateboarding judge analyzing video frames from a trick attempt. \
You will see 5 frames in chronological order showing the progression of the attempt.

Your job is to determine whether the trick was LANDED (the skater completed the \
trick and rode away cleanly) or NOT LANDED (the skater fell, bailed, stepped off \
the board, or did not complete the trick).

Respond with exactly one word: "landed" or "failed"."""


def extract_frames(
    video_path: str,
    start_sec: float,
    end_sec: float,
    num_frames: int = 5,
    width: int = 512,
) -> list[str]:
    """Extract evenly-spaced frames from a video segment, return as base64 PNG strings."""
    duration = end_sec - start_sec
    if num_frames == 1:
        timestamps = [start_sec + duration / 2]
    else:
        timestamps = [
            start_sec + i * duration / (num_frames - 1) for i in range(num_frames)
        ]

    frames_b64: list[str] = []
    for ts in timestamps:
        result = subprocess.run(
            [
                "ffmpeg",
                "-ss",
                f"{ts:.4f}",
                "-i",
                video_path,
                "-frames:v",
                "1",
                "-vf",
                f"scale={width}:-1",
                "-f",
                "image2pipe",
                "-vcodec",
                "png",
                "-loglevel",
                "error",
                "-",
            ],
            capture_output=True,
            timeout=10,
        )
        if result.returncode != 0:
            raise RuntimeError(
                f"ffmpeg failed for {video_path} at {ts:.2f}s: {result.stderr.decode()}"
            )
        frames_b64.append(base64.b64encode(result.stdout).decode("ascii"))

    return frames_b64


def classify_trick_landed(inputs: TrickAttempt) -> bool:
    """Extract frames from the attempt window, send to vision model, return True if landed."""
    frames_b64 = extract_frames(
        video_path=inputs.video_path,
        start_sec=inputs.attempt_start_sec,
        end_sec=inputs.attempt_end_sec,
    )

    content: list[dict] = []
    for i, frame in enumerate(frames_b64, 1):
        content.append({"type": "text", "text": f"Frame {i} of 5:"})
        content.append(
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{frame}"},
            }
        )

    content.append(
        {
            "type": "text",
            "text": (
                f"The trick being attempted is: {inputs.trick_name}.\n"
                'Did the skater land this trick? Answer with exactly one word: "landed" or "failed".'
            ),
        }
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": content},
        ],
        max_tokens=16,
        temperature=0.0,
    )

    answer = response.choices[0].message.content.strip().lower()

    # Strip Qwen3 thinking tokens if present
    if "</think>" in answer:
        answer = answer.split("</think>")[-1].strip()

    return "landed" in answer and "not landed" not in answer and "failed" not in answer
