import base64
import os
import subprocess
from collections.abc import Callable
from dataclasses import dataclass
from enum import Enum

from openai import OpenAI

from models import TrickAttempt


class Provider(str, Enum):
    OPENAI_COMPAT = "openai_compat"
    ANTHROPIC = "anthropic"


@dataclass
class ModelConfig:
    name: str
    provider: Provider
    model_id: str
    base_url: str | None = None
    api_key: str | None = None
    api_key_env: str | None = None
    max_tokens: int = 16
    temperature: float = 0.0
    strip_thinking_tokens: bool = False


MODELS: list[ModelConfig] = [
    ModelConfig(
        name="Qwen 3.5 (local)",
        provider=Provider.OPENAI_COMPAT,
        model_id="unsloth/Qwen3.5-397B-A17B-GGUF:UD-Q3_K_XL",
        base_url="http://puget2:8080/v1",
        api_key="not-needed",
        strip_thinking_tokens=True,
    ),
    ModelConfig(
        name="Claude Sonnet 4.6",
        provider=Provider.ANTHROPIC,
        model_id="claude-sonnet-4-6",
        api_key_env="ANTHROPIC_API_KEY",
        max_tokens=16,
    ),
    ModelConfig(
        name="GPT-5.4",
        provider=Provider.OPENAI_COMPAT,
        model_id="gpt-5.4",
        api_key_env="OPENAI_API_KEY",
    ),
]

SYSTEM_PROMPT = """\
You are a skateboarding judge analyzing video frames from a trick attempt. \
You will see 5 frames in chronological order showing the progression of the attempt.

Your job is to determine whether the trick was LANDED (the skater completed the \
trick and rode away cleanly) or NOT LANDED (the skater fell, bailed, stepped off \
the board, or did not complete the trick).

Respond with exactly one word: "landed" or "failed"."""

# Frame cache: sample_id -> list of base64 PNG strings (extracted once, reused across models)
frame_cache: dict[str, list[str]] = {}

# Eval results: model_name -> sample_id -> {frames, raw_answer, predicted}
eval_cache: dict[str, dict[str, dict]] = {}


def resolve_api_key(config: ModelConfig) -> str | None:
    if config.api_key is not None:
        return config.api_key
    if config.api_key_env:
        return os.environ.get(config.api_key_env)
    return None


def is_model_available(config: ModelConfig) -> bool:
    if config.api_key is not None:
        return True
    key = resolve_api_key(config)
    return key is not None


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


def ensure_frames_cached(inputs: TrickAttempt) -> list[str]:
    """Return cached frames for this sample, extracting them if needed."""
    if inputs.sample_id not in frame_cache:
        frame_cache[inputs.sample_id] = extract_frames(
            video_path=inputs.video_path,
            start_sec=inputs.attempt_start_sec,
            end_sec=inputs.attempt_end_sec,
        )
    return frame_cache[inputs.sample_id]


def _classify_openai_compat(
    client: OpenAI, frames_b64: list[str], trick_name: str, config: ModelConfig
) -> str:
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
                f"The trick being attempted is: {trick_name}.\n"
                'Did the skater land this trick? Answer with exactly one word: "landed" or "failed".'
            ),
        }
    )

    # OpenAI's newer models (GPT-5+) require max_completion_tokens; local servers use max_tokens
    token_kwargs = (
        {"max_completion_tokens": config.max_tokens}
        if config.base_url is None
        else {"max_tokens": config.max_tokens}
    )

    response = client.chat.completions.create(
        model=config.model_id,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": content},
        ],
        temperature=config.temperature,
        **token_kwargs,
    )
    return response.choices[0].message.content.strip().lower()


def _classify_anthropic(
    client, frames_b64: list[str], trick_name: str, config: ModelConfig
) -> str:
    content: list[dict] = []
    for i, frame in enumerate(frames_b64, 1):
        content.append({"type": "text", "text": f"Frame {i} of 5:"})
        content.append(
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": frame,
                },
            }
        )
    content.append(
        {
            "type": "text",
            "text": (
                f"The trick being attempted is: {trick_name}.\n"
                'Did the skater land this trick? Answer with exactly one word: "landed" or "failed".'
            ),
        }
    )

    response = client.messages.create(
        model=config.model_id,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
        max_tokens=config.max_tokens,
        temperature=config.temperature,
    )
    return response.content[0].text.strip().lower()


def make_classifier(config: ModelConfig) -> Callable[[TrickAttempt], bool]:
    """Return a classify function bound to the given model config."""
    key = resolve_api_key(config)

    if config.provider == Provider.ANTHROPIC:
        import anthropic

        client = anthropic.Anthropic(api_key=key)
    else:
        client = OpenAI(base_url=config.base_url, api_key=key or "not-needed")

    eval_cache[config.name] = {}

    def classify(inputs: TrickAttempt) -> bool:
        frames_b64 = ensure_frames_cached(inputs)

        if config.provider == Provider.ANTHROPIC:
            answer = _classify_anthropic(client, frames_b64, inputs.trick_name, config)
        else:
            answer = _classify_openai_compat(
                client, frames_b64, inputs.trick_name, config
            )

        if config.strip_thinking_tokens and "</think>" in answer:
            answer = answer.split("</think>")[-1].strip()

        predicted = (
            "landed" in answer
            and "not landed" not in answer
            and "failed" not in answer
        )

        eval_cache[config.name][inputs.sample_id] = {
            "frames": frames_b64,
            "raw_answer": answer,
            "predicted": predicted,
        }

        return predicted

    return classify
