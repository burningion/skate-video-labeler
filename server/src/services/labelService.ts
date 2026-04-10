import fs from "node:fs";
import path from "node:path";
import type { LabelFile, Sample } from "@video-labeler/shared";
import { LABEL_DIR } from "../index.js";

function labelPath(videoFilename: string): string {
  const base = path.parse(videoFilename).name;
  return path.resolve(LABEL_DIR, `${base}.labels.json`);
}

function ensureLabelDir(): void {
  const dir = path.resolve(LABEL_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readLabels(videoFilename: string): LabelFile | null {
  const p = labelPath(videoFilename);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function writeLabels(data: LabelFile): void {
  ensureLabelDir();
  const p = labelPath(data.source_video);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export function getSampleCount(videoFilename: string): number {
  const data = readLabels(videoFilename);
  return data?.samples?.length ?? 0;
}

export function addSample(videoFilename: string, sample: Sample): LabelFile {
  let data = readLabels(videoFilename);
  if (!data) {
    data = {
      source_video: videoFilename,
      video_meta: { duration_sec: 0, fps: 30, resolution: "unknown" },
      samples: [],
    };
  }
  data.samples.push(sample);
  writeLabels(data);
  return data;
}

export function updateSample(
  videoFilename: string,
  sampleId: string,
  patch: Partial<Sample>,
): LabelFile | null {
  const data = readLabels(videoFilename);
  if (!data) return null;

  const idx = data.samples.findIndex((s) => s.sample_id === sampleId);
  if (idx === -1) return null;

  data.samples[idx] = {
    ...data.samples[idx],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  writeLabels(data);
  return data;
}

export function deleteSample(
  videoFilename: string,
  sampleId: string,
): LabelFile | null {
  const data = readLabels(videoFilename);
  if (!data) return null;

  data.samples = data.samples.filter((s) => s.sample_id !== sampleId);
  writeLabels(data);
  return data;
}
