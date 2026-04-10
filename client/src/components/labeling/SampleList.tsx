import { useLabelStore } from "../../stores/labelStore";
import { useAppStore } from "../../stores/appStore";
import { formatTime } from "../../lib/frameUtils";

export default function SampleList() {
  const currentVideo = useAppStore((s) => s.currentVideo);
  const { samples, activeSampleId, setActiveSample, removeSample } =
    useLabelStore();

  if (!currentVideo || samples.length === 0) return null;

  return (
    <div className="px-3 pt-2">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs font-medium text-zinc-400">
          Samples ({samples.length})
        </h3>
        <button
          onClick={() => setActiveSample(null)}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          + New
        </button>
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {samples.map((s) => (
          <div
            key={s.sample_id}
            onClick={() => setActiveSample(s.sample_id)}
            className={`flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer ${
              s.sample_id === activeSampleId
                ? "bg-zinc-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            <div className="truncate">
              <span className="font-medium">{s.trick_name || "unnamed"}</span>
              <span className="text-zinc-500 ml-1.5">
                {formatTime(s.attempt_start_sec)}–
                {formatTime(s.attempt_end_sec)}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  s.outcome === "landed"
                    ? "bg-green-800 text-green-200"
                    : s.outcome === "fall"
                      ? "bg-red-800 text-red-200"
                      : s.outcome === "sketchy"
                        ? "bg-yellow-800 text-yellow-200"
                        : "bg-zinc-700 text-zinc-400"
                }`}
              >
                {s.outcome}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeSample(currentVideo, s.sample_id);
                }}
                className="text-zinc-500 hover:text-red-400"
                title="Delete sample"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
