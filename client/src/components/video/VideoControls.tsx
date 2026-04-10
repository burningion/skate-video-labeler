import { useVideoStore } from "../../stores/videoStore";
import { formatTime, timeToFrame } from "../../lib/frameUtils";

interface Props {
  togglePlay: () => void;
  stepFrame: (dir: 1 | -1) => void;
  setPlaybackRate: (rate: number) => void;
}

const RATES = [0.25, 0.5, 1, 2];

export default function VideoControls({
  togglePlay,
  stepFrame,
  setPlaybackRate,
}: Props) {
  const { currentTime, duration, isPlaying, playbackRate, meta } =
    useVideoStore();
  const fps = meta?.fps ?? 30;

  return (
    <div className="flex items-center gap-3 px-2 py-1.5 text-sm">
      <button
        onClick={togglePlay}
        className="px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white min-w-[60px]"
      >
        {isPlaying ? "Pause" : "Play"}
      </button>

      <button
        onClick={() => stepFrame(-1)}
        className="px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white"
        title="Previous frame (←)"
      >
        ◀ Frame
      </button>
      <button
        onClick={() => stepFrame(1)}
        className="px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white"
        title="Next frame (→)"
      >
        Frame ▶
      </button>

      <div className="flex gap-1 ml-2">
        {RATES.map((r) => (
          <button
            key={r}
            onClick={() => setPlaybackRate(r)}
            className={`px-1.5 py-0.5 rounded text-xs ${
              playbackRate === r
                ? "bg-blue-600 text-white"
                : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
            }`}
          >
            {r}x
          </button>
        ))}
      </div>

      <div className="ml-auto text-zinc-400 tabular-nums font-mono text-xs">
        {formatTime(currentTime)} / {formatTime(duration)} &middot; F
        {timeToFrame(currentTime, fps)}
      </div>
    </div>
  );
}
