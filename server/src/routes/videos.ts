import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import {
  listVideoFiles,
  getVideoPath,
  getVideoMeta,
} from "../services/videoService.js";
import { getSampleCount } from "../services/labelService.js";

export const videosRouter = Router();

// List all videos with metadata + label counts
videosRouter.get("/", async (_req, res) => {
  const files = listVideoFiles();
  const items = await Promise.all(
    files.map(async (filename) => ({
      filename,
      meta: await getVideoMeta(filename),
      sample_count: getSampleCount(filename),
    })),
  );
  res.json(items);
});

// Get video metadata
videosRouter.get("/:filename/meta", async (req, res) => {
  const meta = await getVideoMeta(req.params.filename);
  if (!meta) {
    res.status(404).json({ error: "Video not found or ffprobe unavailable" });
    return;
  }
  res.json(meta);
});

// Serve video file with Range request support
videosRouter.get("/:filename", (req, res) => {
  const filePath = getVideoPath(req.params.filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska",
    ".avi": "video/x-msvideo",
  };
  const contentType = mimeTypes[ext] ?? "video/mp4";
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": contentType,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(filePath).pipe(res);
  }
});
