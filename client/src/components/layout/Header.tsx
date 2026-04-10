import { useAppStore } from "../../stores/appStore";
import { useLabelStore } from "../../stores/labelStore";

export default function Header() {
  const { labelerID, setLabelerID, uiMode, setUIMode } = useAppStore();
  const saving = useLabelStore((s) => s.saving);

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-700">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-white">Video Labeler</h1>
        <div className="flex rounded overflow-hidden text-xs">
          <button
            onClick={() => setUIMode("label")}
            className={`px-3 py-1 ${
              uiMode === "label"
                ? "bg-blue-600 text-white"
                : "bg-zinc-700 text-zinc-400 hover:text-white"
            }`}
          >
            Label
          </button>
          <button
            onClick={() => setUIMode("review")}
            className={`px-3 py-1 ${
              uiMode === "review"
                ? "bg-blue-600 text-white"
                : "bg-zinc-700 text-zinc-400 hover:text-white"
            }`}
          >
            Review
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {saving && (
          <span className="text-xs text-yellow-400">Saving...</span>
        )}
        <label className="flex items-center gap-1.5 text-xs text-zinc-400">
          Labeler:
          <input
            type="text"
            value={labelerID}
            onChange={(e) => setLabelerID(e.target.value)}
            placeholder="your_id"
            className="bg-zinc-700 text-white rounded px-2 py-1 w-24 text-xs"
          />
        </label>
      </div>
    </header>
  );
}
