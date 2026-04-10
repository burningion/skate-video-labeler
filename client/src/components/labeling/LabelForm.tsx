import { useState, useEffect } from "react";
import type {
  Outcome,
  TrickCategory,
  QualityFlag,
  ConfidenceLevel,
} from "@video-labeler/shared";
import { useAppStore } from "../../stores/appStore";
import { useLabelStore } from "../../stores/labelStore";
import { useVideoStore } from "../../stores/videoStore";
import { formatTime } from "../../lib/frameUtils";
import OutcomeSelector from "./OutcomeSelector";
import TrickSelector from "./TrickSelector";
import QualityFlags from "./QualityFlags";
import ConfidenceSelector from "./ConfidenceSelector";

interface FormData {
  outcome: Outcome;
  trick_category: TrickCategory;
  trick_name: string;
  quality_flags: QualityFlag[];
  labeler_confidence: ConfidenceLevel;
  notes: string;
}

const DEFAULTS: FormData = {
  outcome: "landed",
  trick_category: "flip_trick",
  trick_name: "",
  quality_flags: [],
  labeler_confidence: "high",
  notes: "",
};

export default function LabelForm() {
  const currentVideo = useAppStore((s) => s.currentVideo);
  const labelerID = useAppStore((s) => s.labelerID);
  const duration = useVideoStore((s) => s.duration);
  const {
    samples,
    activeSampleId,
    boundaryDraft,
    saving,
    saveSample,
    editSample,
    clearBoundaryDraft,
  } = useLabelStore();

  const activeSample = samples.find((s) => s.sample_id === activeSampleId);

  const [form, setForm] = useState<FormData>(DEFAULTS);

  // Sync form with active sample
  useEffect(() => {
    if (activeSample) {
      setForm({
        outcome: activeSample.outcome,
        trick_category: activeSample.trick_category,
        trick_name: activeSample.trick_name,
        quality_flags: [...activeSample.quality_flags],
        labeler_confidence: activeSample.labeler_confidence,
        notes: activeSample.notes,
      });
    } else {
      setForm(DEFAULTS);
    }
  }, [activeSampleId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentVideo) return null;

  const startSec = activeSample
    ? activeSample.attempt_start_sec
    : boundaryDraft.start;
  const endSec = activeSample
    ? activeSample.attempt_end_sec
    : boundaryDraft.end;

  const hasBoundaries = startSec !== null && endSec !== null;
  const isEditing = !!activeSample;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentVideo || !labelerID) return;

    if (isEditing && activeSampleId) {
      await editSample(currentVideo, activeSampleId, form);
    } else if (hasBoundaries) {
      await saveSample(currentVideo, {
        attempt_start_sec: startSec!,
        attempt_end_sec: endSec!,
        ...form,
        labeler_id: labelerID,
      });
    }
  }

  // Auto-fill boundaries for short clips
  const isShortClip = duration > 0 && duration <= 30;
  const canAutoFill =
    !isEditing &&
    !hasBoundaries &&
    isShortClip &&
    samples.length === 0;

  function handleAutoFill() {
    useLabelStore.getState().setBoundaryStart(0);
    useLabelStore.getState().setBoundaryEnd(duration);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3">
      {/* Boundary info */}
      <div className="text-xs text-zinc-400 flex items-center gap-2">
        <span>
          In: {startSec !== null ? formatTime(startSec) : "—"} | Out:{" "}
          {endSec !== null ? formatTime(endSec) : "—"}
        </span>
        {canAutoFill && (
          <button
            type="button"
            onClick={handleAutoFill}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Use full clip
          </button>
        )}
        {!isEditing && hasBoundaries && (
          <button
            type="button"
            onClick={clearBoundaryDraft}
            className="text-zinc-500 hover:text-zinc-400"
          >
            Clear
          </button>
        )}
      </div>

      {!labelerID && (
        <div className="text-xs text-red-400">
          Set your labeler ID in the header before saving.
        </div>
      )}

      <OutcomeSelector
        value={form.outcome}
        onChange={(v) => setForm((f) => ({ ...f, outcome: v }))}
      />

      <TrickSelector
        category={form.trick_category}
        trickName={form.trick_name}
        onCategoryChange={(v) => setForm((f) => ({ ...f, trick_category: v }))}
        onTrickNameChange={(v) => setForm((f) => ({ ...f, trick_name: v }))}
      />

      <QualityFlags
        value={form.quality_flags}
        onChange={(v) => setForm((f) => ({ ...f, quality_flags: v }))}
      />

      <ConfidenceSelector
        value={form.labeler_confidence}
        onChange={(v) => setForm((f) => ({ ...f, labeler_confidence: v }))}
      />

      <fieldset>
        <legend className="text-xs text-zinc-400 mb-1">Notes</legend>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
          className="w-full bg-zinc-700 text-white rounded px-2 py-1.5 text-sm resize-none"
          placeholder="Optional notes..."
        />
      </fieldset>

      <button
        type="submit"
        disabled={saving || !hasBoundaries || !labelerID}
        className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-colors"
      >
        {saving
          ? "Saving..."
          : isEditing
            ? "Update Sample"
            : "Save Sample"}
      </button>
    </form>
  );
}
