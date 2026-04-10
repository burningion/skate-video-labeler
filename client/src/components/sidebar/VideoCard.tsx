import type { VideoListItem } from "@video-labeler/shared";

interface Props {
  video: VideoListItem;
  active: boolean;
  onClick: () => void;
}

export default function VideoCard({ video, active, onClick }: Props) {
  const status =
    video.sample_count > 0
      ? ("labeled" as const)
      : ("unlabeled" as const);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
        active
          ? "bg-zinc-600 text-white"
          : "text-zinc-300 hover:bg-zinc-700"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="truncate font-mono text-xs">{video.filename}</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ml-2 ${
            status === "labeled"
              ? "bg-green-900 text-green-300"
              : "bg-zinc-700 text-zinc-500"
          }`}
        >
          {video.sample_count > 0 ? `${video.sample_count} samples` : "unlabeled"}
        </span>
      </div>
      {video.meta && (
        <div className="text-[10px] text-zinc-500 mt-0.5">
          {video.meta.resolution} &middot; {video.meta.duration_sec.toFixed(1)}s
        </div>
      )}
    </button>
  );
}
