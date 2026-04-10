import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  OUTCOMES,
  TRICK_CATEGORIES,
  QUALITY_FLAGS,
  CONFIDENCE_LEVELS,
} from "@video-labeler/shared";
import {
  readLabels,
  addSample,
  updateSample,
  deleteSample,
} from "../services/labelService.js";

export const labelsRouter = Router();

const sampleSchema = z.object({
  attempt_start_sec: z.number().min(0),
  attempt_end_sec: z.number().min(0),
  outcome: z.enum(OUTCOMES),
  trick_category: z.enum(TRICK_CATEGORIES),
  trick_name: z.string().min(1),
  quality_flags: z.array(z.enum(QUALITY_FLAGS)),
  labeler_confidence: z.enum(CONFIDENCE_LEVELS),
  labeler_id: z.string().min(1),
  notes: z.string().default(""),
});

// Get all labels for a video
labelsRouter.get("/:videoFilename", (req, res) => {
  const data = readLabels(req.params.videoFilename);
  if (!data) {
    res.json({ source_video: req.params.videoFilename, samples: [] });
    return;
  }
  res.json(data);
});

// Create a new sample
labelsRouter.post("/:videoFilename", (req, res) => {
  const parsed = sampleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const now = new Date().toISOString();
  const videoName = req.params.videoFilename;
  const base = videoName.replace(/\.[^.]+$/, "");
  const sample = {
    sample_id: `${base}_${nanoid(8)}`,
    ...parsed.data,
    created_at: now,
    updated_at: now,
  };

  const data = addSample(videoName, sample);
  res.status(201).json(data);
});

// Update a sample
labelsRouter.put("/:videoFilename/:sampleId", (req, res) => {
  const partial = sampleSchema.partial().safeParse(req.body);
  if (!partial.success) {
    res.status(400).json({ error: partial.error.flatten() });
    return;
  }

  const data = updateSample(
    req.params.videoFilename,
    req.params.sampleId,
    partial.data as any,
  );
  if (!data) {
    res.status(404).json({ error: "Sample not found" });
    return;
  }
  res.json(data);
});

// Delete a sample
labelsRouter.delete("/:videoFilename/:sampleId", (req, res) => {
  const data = deleteSample(req.params.videoFilename, req.params.sampleId);
  if (!data) {
    res.status(404).json({ error: "Sample not found" });
    return;
  }
  res.json(data);
});
