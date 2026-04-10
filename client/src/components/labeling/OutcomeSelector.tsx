import { OUTCOMES, type Outcome } from "@video-labeler/shared";

const LABELS: Record<Outcome, string> = {
  landed: "Landed",
  fall: "Fall",
  sketchy: "Sketchy",
  incomplete: "Incomplete",
};

const COLORS: Record<Outcome, string> = {
  landed: "bg-green-700 hover:bg-green-600",
  fall: "bg-red-700 hover:bg-red-600",
  sketchy: "bg-yellow-700 hover:bg-yellow-600",
  incomplete: "bg-zinc-600 hover:bg-zinc-500",
};

interface Props {
  value: Outcome;
  onChange: (v: Outcome) => void;
}

export default function OutcomeSelector({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="text-xs text-zinc-400 mb-1">Outcome</legend>
      <div className="flex gap-1.5">
        {OUTCOMES.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`px-2.5 py-1 rounded text-sm text-white transition-colors ${
              value === o
                ? COLORS[o] + " ring-2 ring-white/40"
                : "bg-zinc-700 hover:bg-zinc-600"
            }`}
          >
            {LABELS[o]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
