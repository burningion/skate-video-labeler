// ── Enums / union types ──

export const OUTCOMES = ["landed", "fall", "sketchy", "incomplete"] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const TRICK_CATEGORIES = [
  "flip_trick",
  "grind",
  "slide",
  "manual",
  "air",
  "grab",
  "transition",
  "combo",
  "unknown",
] as const;
export type TrickCategory = (typeof TRICK_CATEGORIES)[number];

export const QUALITY_FLAGS = [
  "obstructed",
  "shaky_camera",
  "low_resolution",
  "off_angle",
] as const;
export type QualityFlag = (typeof QUALITY_FLAGS)[number];

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

// ── Core data structures ──

export interface Sample {
  sample_id: string;
  attempt_start_sec: number;
  attempt_end_sec: number;
  outcome: Outcome;
  trick_category: TrickCategory;
  trick_name: string;
  quality_flags: QualityFlag[];
  labeler_confidence: ConfidenceLevel;
  labeler_id: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface VideoMeta {
  duration_sec: number;
  fps: number;
  resolution: string;
}

export interface LabelFile {
  source_video: string;
  video_meta: VideoMeta;
  samples: Sample[];
}

// ── API response types ──

export interface VideoListItem {
  filename: string;
  meta: VideoMeta | null;
  sample_count: number;
}
