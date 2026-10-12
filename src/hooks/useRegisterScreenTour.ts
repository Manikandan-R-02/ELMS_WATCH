import { useEffect, useRef } from "react";
import { clearScreenTour, setScreenTour } from "../store/screenTourRegistry";

/**
 * Call once in a screen, passing the function that starts that screen's tour (the one its "Show tour" button
 * calls). While the screen is mounted the app-wide tour can start it — see `store/screenTourRegistry.ts`. The
 * latest `start` is always used, so it may close over the screen's current state.
 */
export function useRegisterScreenTour(start: () => void) {
  const latest = useRef(start);
  useEffect(() => {
    latest.current = start;
  });
  useEffect(() => {
    const run = () => latest.current();
    setScreenTour(run);
    return () => clearScreenTour(run);
  }, []);
}
