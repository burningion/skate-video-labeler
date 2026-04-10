import type { VideoListItem, LabelFile, VideoMeta, Sample } from "@video-labeler/shared";

const BASE = "/api";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json();
}

export function fetchVideos(): Promise<VideoListItem[]> {
  return fetchJSON(`${BASE}/videos`);
}

export function fetchVideoMeta(filename: string): Promise<VideoMeta> {
  return fetchJSON(`${BASE}/videos/${encodeURIComponent(filename)}/meta`);
}

export function videoURL(filename: string): string {
  return `${BASE}/videos/${encodeURIComponent(filename)}`;
}

export function fetchLabels(videoFilename: string): Promise<LabelFile> {
  return fetchJSON(`${BASE}/labels/${encodeURIComponent(videoFilename)}`);
}

export function createSample(
  videoFilename: string,
  sample: Omit<Sample, "sample_id" | "created_at" | "updated_at">,
): Promise<LabelFile> {
  return fetchJSON(`${BASE}/labels/${encodeURIComponent(videoFilename)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sample),
  });
}

export function updateSample(
  videoFilename: string,
  sampleId: string,
  patch: Partial<Sample>,
): Promise<LabelFile> {
  return fetchJSON(
    `${BASE}/labels/${encodeURIComponent(videoFilename)}/${encodeURIComponent(sampleId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    },
  );
}

export function deleteSampleAPI(
  videoFilename: string,
  sampleId: string,
): Promise<LabelFile> {
  return fetchJSON(
    `${BASE}/labels/${encodeURIComponent(videoFilename)}/${encodeURIComponent(sampleId)}`,
    { method: "DELETE" },
  );
}
