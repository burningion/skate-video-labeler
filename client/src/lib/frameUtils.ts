export function timeToFrame(timeSec: number, fps: number): number {
  return Math.round(timeSec * fps);
}

export function frameToTime(frame: number, fps: number): number {
  return frame / fps;
}

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toFixed(2).padStart(5, "0")}`;
}
