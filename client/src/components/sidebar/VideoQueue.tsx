import { useAppStore } from "../../stores/appStore";
import VideoCard from "./VideoCard";

export default function VideoQueue() {
  const { videoList, currentVideo, selectVideo, loading } = useAppStore();

  if (loading) {
    return <div className="p-3 text-sm text-zinc-500">Loading videos...</div>;
  }

  if (videoList.length === 0) {
    return (
      <div className="p-3 text-sm text-zinc-500">
        No videos found. Place MP4 files in the video directory and restart the
        server.
      </div>
    );
  }

  return (
    <div className="p-2 space-y-0.5 overflow-y-auto">
      {videoList.map((v) => (
        <VideoCard
          key={v.filename}
          video={v}
          active={v.filename === currentVideo}
          onClick={() => selectVideo(v.filename)}
        />
      ))}
    </div>
  );
}
