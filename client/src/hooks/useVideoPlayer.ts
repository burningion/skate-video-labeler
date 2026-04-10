import { useCallback, useEffect, useRef } from "react";
import { useVideoStore } from "../stores/videoStore";

export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    setCurrentTime,
    setDuration,
    setIsPlaying,
    playbackRate,
    setPlaybackRate,
    meta,
  } = useVideoStore();

  const fps = meta?.fps ?? 30;

  // Sync playback rate to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const play = useCallback(() => {
    videoRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }, []);

  const seekTo = useCallback(
    (sec: number) => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = Math.max(0, Math.min(sec, v.duration || Infinity));
      setCurrentTime(v.currentTime);
    },
    [setCurrentTime],
  );

  const stepFrame = useCallback(
    (direction: 1 | -1) => {
      const v = videoRef.current;
      if (!v) return;
      v.pause();
      v.currentTime = Math.max(
        0,
        Math.min(v.currentTime + direction * (1 / fps), v.duration),
      );
      setCurrentTime(v.currentTime);
    },
    [fps, setCurrentTime],
  );

  const jumpSec = useCallback(
    (sec: number) => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = Math.max(
        0,
        Math.min(v.currentTime + sec, v.duration),
      );
      setCurrentTime(v.currentTime);
    },
    [setCurrentTime],
  );

  // Wire up video element events
  const onTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  }, [setCurrentTime]);

  const onLoadedMetadata = useCallback(() => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  }, [setDuration]);

  const onPlay = useCallback(() => setIsPlaying(true), [setIsPlaying]);
  const onPause = useCallback(() => setIsPlaying(false), [setIsPlaying]);

  return {
    videoRef,
    play,
    pause,
    togglePlay,
    seekTo,
    stepFrame,
    jumpSec,
    setPlaybackRate,
    videoEvents: { onTimeUpdate, onLoadedMetadata, onPlay, onPause },
  };
}
