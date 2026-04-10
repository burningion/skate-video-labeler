import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { VideoMeta } from "@video-labeler/shared";
import { VIDEO_DIR } from "../index.js";

const execFileAsync = promisify(execFile);

const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm", ".mkv", ".avi"]);

export function listVideoFiles(): string[] {
  const dir = path.resolve(VIDEO_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((f) => VIDEO_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort();
}

export function getVideoPath(filename: string): string {
  return path.resolve(VIDEO_DIR, filename);
}

export async function getVideoMeta(
  filename: string,
): Promise<VideoMeta | null> {
  const filePath = getVideoPath(filename);
  if (!fs.existsSync(filePath)) return null;

  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      filePath,
    ]);

    const probe = JSON.parse(stdout);
    const videoStream = probe.streams?.find(
      (s: { codec_type: string }) => s.codec_type === "video",
    );

    const duration = parseFloat(probe.format?.duration ?? "0");
    let fps = 30;
    if (videoStream?.r_frame_rate) {
      const [num, den] = videoStream.r_frame_rate.split("/").map(Number);
      if (den > 0) fps = Math.round((num / den) * 100) / 100;
    }
    const resolution = videoStream
      ? `${videoStream.width}x${videoStream.height}`
      : "unknown";

    return { duration_sec: duration, fps, resolution };
  } catch {
    // ffprobe not available or failed — return basic info
    return null;
  }
}
