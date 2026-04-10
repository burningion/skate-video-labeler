import { useCallback, useRef } from "react";
import { useVideoStore } from "../../stores/videoStore";
import { useLabelStore } from "../../stores/labelStore";

interface Props {
  seekTo: (sec: number) => void;
}

export default function Timeline({ seekTo }: Props) {
  const { currentTime, duration } = useVideoStore();
  const { samples, activeSampleId, boundaryDraft } = useLabelStore();
  const barRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!barRef.current || duration === 0) return;
      const rect = barRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seekTo(ratio * duration);
    },
    [seekTo, duration],
  );

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="px-2 py-1">
      <div
        ref={barRef}
        className="relative h-6 bg-zinc-800 rounded cursor-pointer select-none"
        onClick={handleClick}
      >
        {/* Sample boundary markers */}
        {samples.map((s) => {
          const left = (s.attempt_start_sec / duration) * 100;
          const width =
            ((s.attempt_end_sec - s.attempt_start_sec) / duration) * 100;
          const active = s.sample_id === activeSampleId;
          return (
            <div
              key={s.sample_id}
              className={`absolute top-0 h-full rounded opacity-40 ${
                active ? "bg-blue-500 opacity-60" : "bg-green-600"
              }`}
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}

        {/* Boundary draft markers */}
        {boundaryDraft.start !== null && duration > 0 && (
          <div
            className="absolute top-0 h-full w-0.5 bg-yellow-400 z-10"
            style={{ left: `${(boundaryDraft.start / duration) * 100}%` }}
          />
        )}
        {boundaryDraft.end !== null && duration > 0 && (
          <div
            className="absolute top-0 h-full w-0.5 bg-yellow-400 z-10"
            style={{ left: `${(boundaryDraft.end / duration) * 100}%` }}
          />
        )}

        {/* Playhead */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white z-20"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}
