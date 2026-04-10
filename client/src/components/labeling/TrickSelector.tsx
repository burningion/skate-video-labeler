import { TRICK_CATEGORIES, type TrickCategory } from "@video-labeler/shared";
import {
  TRICK_NAMES,
  STANCE_PREFIXES,
  DIRECTION_PREFIXES,
} from "../../lib/trickNames";

interface Props {
  category: TrickCategory;
  trickName: string;
  onCategoryChange: (v: TrickCategory) => void;
  onTrickNameChange: (v: string) => void;
}

const CATEGORY_LABELS: Record<TrickCategory, string> = {
  flip_trick: "Flip Trick",
  grind: "Grind",
  slide: "Slide",
  manual: "Manual",
  air: "Air",
  grab: "Grab",
  transition: "Transition",
  combo: "Combo",
  unknown: "Unknown",
};

export default function TrickSelector({
  category,
  trickName,
  onCategoryChange,
  onTrickNameChange,
}: Props) {
  const suggestions = TRICK_NAMES[category] ?? [];

  return (
    <div className="space-y-2">
      <fieldset>
        <legend className="text-xs text-zinc-400 mb-1">Trick Category</legend>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as TrickCategory)}
          className="w-full bg-zinc-700 text-white rounded px-2 py-1.5 text-sm"
        >
          {TRICK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset>
        <legend className="text-xs text-zinc-400 mb-1">Trick Name</legend>
        <input
          type="text"
          value={trickName}
          onChange={(e) => onTrickNameChange(e.target.value)}
          placeholder="e.g. kickflip, bs_50-50"
          list="trick-suggestions"
          className="w-full bg-zinc-700 text-white rounded px-2 py-1.5 text-sm"
        />
        <datalist id="trick-suggestions">
          {suggestions.flatMap((base) =>
            STANCE_PREFIXES.flatMap((stance) =>
              DIRECTION_PREFIXES.map((dir) => {
                const name = `${stance}${dir}${base}`;
                return <option key={name} value={name} />;
              }),
            ),
          )}
        </datalist>
        <p className="text-xs text-zinc-500 mt-0.5">
          Prefixes: nollie_, switch_, fakie_ / bs_, fs_
        </p>
      </fieldset>
    </div>
  );
}
