import { videoURL } from "../../api/client";
import { useAppStore } from "../../stores/appStore";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoEvents: {
    onTimeUpdate: () => void;
    onLoadedMetadata: () => void;
    onPlay: () => void;
    onPause: () => void;
  };
}

export default function VideoPlayer({ videoRef, videoEvents }: Props) {
  const currentVideo = useAppStore((s) => s.currentVideo);

  if (!currentVideo) {
    return (
      <div className="flex items-center justify-center bg-black text-zinc-500 aspect-video rounded-lg">
        Select a video to begin labeling
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={videoURL(currentVideo)}
      className="w-full aspect-video bg-black rounded-lg"
      onTimeUpdate={videoEvents.onTimeUpdate}
      onLoadedMetadata={videoEvents.onLoadedMetadata}
      onPlay={videoEvents.onPlay}
      onPause={videoEvents.onPause}
      preload="auto"
    />
  );
}
