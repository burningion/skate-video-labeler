import { useEffect } from "react";

interface ShortcutHandlers {
  togglePlay: () => void;
  stepFrame: (dir: 1 | -1) => void;
  jumpSec: (sec: number) => void;
  setPlaybackRate: (rate: number) => void;
  markIn: () => void;
  markOut: () => void;
  nextVideo: () => void;
  prevVideo: () => void;
  save: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const ctrl = e.ctrlKey || e.metaKey;

      switch (e.key) {
        case " ":
          e.preventDefault();
          handlers.togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey) handlers.jumpSec(-1);
          else handlers.stepFrame(-1);
          break;
        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey) handlers.jumpSec(1);
          else handlers.stepFrame(1);
          break;
        case "i":
        case "I":
          if (!ctrl) handlers.markIn();
          break;
        case "o":
        case "O":
          if (!ctrl) handlers.markOut();
          break;
        case "1":
          handlers.setPlaybackRate(0.25);
          break;
        case "2":
          handlers.setPlaybackRate(0.5);
          break;
        case "3":
          handlers.setPlaybackRate(1);
          break;
        case "4":
          handlers.setPlaybackRate(2);
          break;
        case "n":
        case "N":
          if (!ctrl) handlers.nextVideo();
          break;
        case "p":
        case "P":
          if (!ctrl) handlers.prevVideo();
          break;
        case "s":
          if (ctrl) {
            e.preventDefault();
            handlers.save();
          }
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
