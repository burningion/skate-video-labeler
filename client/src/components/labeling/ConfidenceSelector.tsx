import { CONFIDENCE_LEVELS, type ConfidenceLevel } from "@video-labeler/shared";

const LABELS: Record<ConfidenceLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const COLORS: Record<ConfidenceLevel, string> = {
  high: "bg-green-700",
  medium: "bg-yellow-700",
  low: "bg-red-700",
};

interface Props {
  value: ConfidenceLevel;
  onChange: (v: ConfidenceLevel) => void;
}

export default function ConfidenceSelector({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="text-xs text-zinc-400 mb-1">Confidence</legend>
      <div className="flex gap-1.5">
        {CONFIDENCE_LEVELS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`px-2.5 py-1 rounded text-sm text-white transition-colors ${
              value === c
                ? COLORS[c] + " ring-2 ring-white/40"
                : "bg-zinc-700 hover:bg-zinc-600"
            }`}
          >
            {LABELS[c]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
