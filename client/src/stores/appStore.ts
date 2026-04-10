import { create } from "zustand";
import type { VideoListItem } from "@video-labeler/shared";
import { fetchVideos } from "../api/client";

interface AppState {
  videoList: VideoListItem[];
  currentVideo: string | null;
  labelerID: string;
  uiMode: "label" | "review";
  loading: boolean;

  loadVideoList: () => Promise<void>;
  selectVideo: (filename: string | null) => void;
  setLabelerID: (id: string) => void;
  setUIMode: (mode: "label" | "review") => void;
  refreshVideoList: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  videoList: [],
  currentVideo: null,
  labelerID: localStorage.getItem("labeler_id") ?? "",
  uiMode: "label",
  loading: false,

  loadVideoList: async () => {
    set({ loading: true });
    const list = await fetchVideos();
    set({ videoList: list, loading: false });
  },

  selectVideo: (filename) => set({ currentVideo: filename }),

  setLabelerID: (id) => {
    localStorage.setItem("labeler_id", id);
    set({ labelerID: id });
  },

  setUIMode: (mode) => set({ uiMode: mode }),

  refreshVideoList: async () => {
    const list = await fetchVideos();
    set({ videoList: list });
  },
}));
