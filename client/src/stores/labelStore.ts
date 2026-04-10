import { create } from "zustand";
import type { Sample, LabelFile } from "@video-labeler/shared";
import {
  fetchLabels,
  createSample,
  updateSample as updateSampleAPI,
  deleteSampleAPI,
} from "../api/client";
import { useAppStore } from "./appStore";

interface LabelState {
  samples: Sample[];
  activeSampleId: string | null;
  boundaryDraft: { start: number | null; end: number | null };
  saving: boolean;

  loadLabels: (videoFilename: string) => Promise<void>;
  clearLabels: () => void;
  setActiveSample: (id: string | null) => void;
  setBoundaryStart: (t: number) => void;
  setBoundaryEnd: (t: number) => void;
  clearBoundaryDraft: () => void;

  saveSample: (
    videoFilename: string,
    sample: Omit<Sample, "sample_id" | "created_at" | "updated_at">,
  ) => Promise<void>;
  editSample: (
    videoFilename: string,
    sampleId: string,
    patch: Partial<Sample>,
  ) => Promise<void>;
  removeSample: (videoFilename: string, sampleId: string) => Promise<void>;
}

function applySamples(data: LabelFile) {
  return { samples: data.samples };
}

export const useLabelStore = create<LabelState>((set) => ({
  samples: [],
  activeSampleId: null,
  boundaryDraft: { start: null, end: null },
  saving: false,

  loadLabels: async (videoFilename) => {
    set({ samples: [], activeSampleId: null, boundaryDraft: { start: null, end: null } });
    const data = await fetchLabels(videoFilename);
    set({ samples: data.samples ?? [], activeSampleId: null });
  },

  clearLabels: () =>
    set({
      samples: [],
      activeSampleId: null,
      boundaryDraft: { start: null, end: null },
    }),

  setActiveSample: (id) => set({ activeSampleId: id }),

  setBoundaryStart: (t) =>
    set((s) => ({ boundaryDraft: { ...s.boundaryDraft, start: t } })),

  setBoundaryEnd: (t) =>
    set((s) => ({ boundaryDraft: { ...s.boundaryDraft, end: t } })),

  clearBoundaryDraft: () =>
    set({ boundaryDraft: { start: null, end: null } }),

  saveSample: async (videoFilename, sample) => {
    set({ saving: true });
    const data = await createSample(videoFilename, sample);
    const newSample = data.samples[data.samples.length - 1];
    set({
      ...applySamples(data),
      activeSampleId: newSample.sample_id,
      boundaryDraft: { start: null, end: null },
      saving: false,
    });
    useAppStore.getState().refreshVideoList();
  },

  editSample: async (videoFilename, sampleId, patch) => {
    set({ saving: true });
    const data = await updateSampleAPI(videoFilename, sampleId, patch);
    set({ ...applySamples(data), saving: false });
  },

  removeSample: async (videoFilename, sampleId) => {
    const data = await deleteSampleAPI(videoFilename, sampleId);
    set((s) => ({
      ...applySamples(data),
      activeSampleId:
        s.activeSampleId === sampleId ? null : s.activeSampleId,
    }));
  },
}));
