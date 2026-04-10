import { useEffect, useCallback, useMemo } from "react";
import { useAppStore } from "./stores/appStore";
import { useVideoStore } from "./stores/videoStore";
import { useLabelStore } from "./stores/labelStore";
import { fetchVideoMeta } from "./api/client";
import { useVideoPlayer } from "./hooks/useVideoPlayer";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

import Header from "./components/layout/Header";
import VideoQueue from "./components/sidebar/VideoQueue";
import VideoPlayer from "./components/video/VideoPlayer";
import VideoControls from "./components/video/VideoControls";
import Timeline from "./components/video/Timeline";
import SampleList from "./components/labeling/SampleList";
import LabelForm from "./components/labeling/LabelForm";
import ReviewTable from "./components/review/ReviewTable";

export default function App() {
  const { currentVideo, videoList, uiMode, loadVideoList, selectVideo } =
    useAppStore();
  const setMeta = useVideoStore((s) => s.setMeta);
  const { loadLabels, clearLabels, setBoundaryStart, setBoundaryEnd } =
    useLabelStore();
  const currentTime = useVideoStore((s) => s.currentTime);

  const {
    videoRef,
    togglePlay,
    stepFrame,
    jumpSec,
    seekTo,
    setPlaybackRate,
    videoEvents,
  } = useVideoPlayer();

  // Load video list on mount
  useEffect(() => {
    loadVideoList();
  }, [loadVideoList]);

  // Load metadata + labels when video changes
  useEffect(() => {
    if (!currentVideo) {
      setMeta(null);
      clearLabels();
      return;
    }
    fetchVideoMeta(currentVideo)
      .then(setMeta)
      .catch(() => setMeta(null));
    loadLabels(currentVideo);
  }, [currentVideo, setMeta, clearLabels, loadLabels]);

  // Navigation helpers
  const currentIdx = videoList.findIndex((v) => v.filename === currentVideo);

  const nextVideo = useCallback(() => {
    if (currentIdx < videoList.length - 1) {
      selectVideo(videoList[currentIdx + 1].filename);
    }
  }, [currentIdx, videoList, selectVideo]);

  const prevVideo = useCallback(() => {
    if (currentIdx > 0) {
      selectVideo(videoList[currentIdx - 1].filename);
    }
  }, [currentIdx, videoList, selectVideo]);

  const markIn = useCallback(() => {
    setBoundaryStart(currentTime);
  }, [setBoundaryStart, currentTime]);

  const markOut = useCallback(() => {
    setBoundaryEnd(currentTime);
  }, [setBoundaryEnd, currentTime]);

  const save = useCallback(() => {
    // Ctrl+S — the form handles actual saving, this is a no-op placeholder
    // that prevents browser default save-page behavior
  }, []);

  const handlers = useMemo(
    () => ({
      togglePlay,
      stepFrame,
      jumpSec,
      setPlaybackRate,
      markIn,
      markOut,
      nextVideo,
      prevVideo,
      save,
    }),
    [
      togglePlay,
      stepFrame,
      jumpSec,
      setPlaybackRate,
      markIn,
      markOut,
      nextVideo,
      prevVideo,
      save,
    ],
  );

  useKeyboardShortcuts(handlers);

  return (
    <div className="h-screen flex flex-col bg-zinc-900 text-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-zinc-700 overflow-y-auto bg-zinc-850">
          <VideoQueue />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {uiMode === "review" ? (
            <ReviewTable />
          ) : (
            <div className="flex flex-col lg:flex-row h-full">
              {/* Video area */}
              <div className="flex-1 flex flex-col p-3 min-w-0">
                <VideoPlayer videoRef={videoRef} videoEvents={videoEvents} />
                <VideoControls
                  togglePlay={togglePlay}
                  stepFrame={stepFrame}
                  setPlaybackRate={setPlaybackRate}
                />
                <Timeline seekTo={seekTo} />

                {/* Boundary marking buttons */}
                {currentVideo && (
                  <div className="flex gap-2 px-2 mt-1">
                    <button
                      onClick={markIn}
                      className="px-3 py-1 rounded bg-yellow-700 hover:bg-yellow-600 text-white text-xs"
                    >
                      Mark In [I]
                    </button>
                    <button
                      onClick={markOut}
                      className="px-3 py-1 rounded bg-yellow-700 hover:bg-yellow-600 text-white text-xs"
                    >
                      Mark Out [O]
                    </button>
                  </div>
                )}
              </div>

              {/* Label panel */}
              <div className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-700 overflow-y-auto">
                <SampleList />
                <LabelForm />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
