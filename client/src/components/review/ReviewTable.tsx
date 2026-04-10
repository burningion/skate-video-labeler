import { useEffect, useState } from "react";
import type { Sample } from "@video-labeler/shared";
import { fetchVideos, fetchLabels } from "../../api/client";
import { formatTime } from "../../lib/frameUtils";

interface RowData extends Sample {
  source_video: string;
}

export default function ReviewTable() {
  const [rows, setRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      const videos = await fetchVideos();
      const all: RowData[] = [];
      for (const v of videos) {
        if (v.sample_count === 0) continue;
        const data = await fetchLabels(v.filename);
        for (const s of data.samples ?? []) {
          all.push({ ...s, source_video: v.filename });
        }
      }
      setRows(all);
      setLoading(false);
    })();
  }, []);

  const filtered = filter
    ? rows.filter(
        (r) =>
          r.source_video.toLowerCase().includes(filter) ||
          r.trick_name.toLowerCase().includes(filter) ||
          r.outcome.includes(filter) ||
          r.trick_category.includes(filter),
      )
    : rows;

  if (loading) {
    return <div className="p-4 text-zinc-500">Loading all labels...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-zinc-300">
          All Samples ({filtered.length})
        </h2>
        <input
          type="text"
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value.toLowerCase())}
          className="bg-zinc-700 text-white rounded px-2 py-1 text-xs w-48"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-zinc-400 border-b border-zinc-700">
            <tr>
              <th className="py-2 px-2">Video</th>
              <th className="py-2 px-2">Start</th>
              <th className="py-2 px-2">End</th>
              <th className="py-2 px-2">Outcome</th>
              <th className="py-2 px-2">Category</th>
              <th className="py-2 px-2">Trick</th>
              <th className="py-2 px-2">Confidence</th>
              <th className="py-2 px-2">Labeler</th>
              <th className="py-2 px-2">Flags</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            {filtered.map((r) => (
              <tr
                key={r.sample_id}
                className="border-b border-zinc-800 hover:bg-zinc-800"
              >
                <td className="py-1.5 px-2 font-mono">{r.source_video}</td>
                <td className="py-1.5 px-2 tabular-nums">
                  {formatTime(r.attempt_start_sec)}
                </td>
                <td className="py-1.5 px-2 tabular-nums">
                  {formatTime(r.attempt_end_sec)}
                </td>
                <td className="py-1.5 px-2">{r.outcome}</td>
                <td className="py-1.5 px-2">{r.trick_category}</td>
                <td className="py-1.5 px-2">{r.trick_name}</td>
                <td className="py-1.5 px-2">{r.labeler_confidence}</td>
                <td className="py-1.5 px-2">{r.labeler_id}</td>
                <td className="py-1.5 px-2">
                  {r.quality_flags.join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
