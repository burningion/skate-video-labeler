import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { videosRouter } from "./routes/videos.js";
import { labelsRouter } from "./routes/labels.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../..");

const PORT = parseInt(process.env.PORT ?? "3141", 10);
export const VIDEO_DIR = process.env.VIDEO_DIR ?? path.join(PROJECT_ROOT, "videos");
export const LABEL_DIR = process.env.LABEL_DIR ?? path.join(PROJECT_ROOT, "labels");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/videos", videosRouter);
app.use("/api/labels", labelsRouter);

app.listen(PORT, () => {
  console.log(`Video labeler server running on http://localhost:${PORT}`);
  console.log(`  Video directory: ${VIDEO_DIR}`);
  console.log(`  Label directory: ${LABEL_DIR}`);
});
