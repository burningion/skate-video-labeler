from pydantic import BaseModel


class TrickAttempt(BaseModel):
    """Input to the eval task function. Identifies a clip to classify."""

    sample_id: str
    video_path: str
    attempt_start_sec: float
    attempt_end_sec: float
    trick_name: str
