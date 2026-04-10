import { create } from "zustand";
import type { VideoMeta } from "@video-labeler/shared";

interface VideoState {
  meta: VideoMeta | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;

  setMeta: (meta: VideoMeta | null) => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  setIsPlaying: (p: boolean) => void;
  setPlaybackRate: (r: number) => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  meta: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  playbackRate: 1,

  setMeta: (meta) => set({ meta }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setIsPlaying: (p) => set({ isPlaying: p }),
  setPlaybackRate: (r) => set({ playbackRate: r }),
}));
