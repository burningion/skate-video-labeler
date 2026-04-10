import { QUALITY_FLAGS, type QualityFlag } from "@video-labeler/shared";

const LABELS: Record<QualityFlag, string> = {
  obstructed: "Obstructed",
  shaky_camera: "Shaky Camera",
  low_resolution: "Low Resolution",
  off_angle: "Off Angle",
};

interface Props {
  value: QualityFlag[];
  onChange: (v: QualityFlag[]) => void;
}

export default function QualityFlags({ value, onChange }: Props) {
  function toggle(flag: QualityFlag) {
    if (value.includes(flag)) {
      onChange(value.filter((f) => f !== flag));
    } else {
      onChange([...value, flag]);
    }
  }

  return (
    <fieldset>
      <legend className="text-xs text-zinc-400 mb-1">Quality Flags</legend>
      <div className="flex flex-wrap gap-1.5">
        {QUALITY_FLAGS.map((flag) => (
          <button
            key={flag}
            type="button"
            onClick={() => toggle(flag)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              value.includes(flag)
                ? "bg-orange-700 text-white ring-1 ring-orange-400"
                : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
            }`}
          >
            {LABELS[flag]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
