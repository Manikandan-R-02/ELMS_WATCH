import { create } from "zustand";

interface LoaderState {
  activeRequests: number;
  manualLoading: boolean;
  isLoading: boolean;
  start: () => void;
  stop: () => void;
  setManualLoading: (loading: boolean) => void;
}

export const useLoaderStore = create<LoaderState>((set) => ({
  activeRequests: 0,
  manualLoading: false,
  isLoading: false,
  start: () =>
    set((s) => {
      const activeRequests = s.activeRequests + 1;
      return { activeRequests, isLoading: activeRequests > 0 || s.manualLoading };
    }),
  stop: () =>
    set((s) => {
      const activeRequests = Math.max(0, s.activeRequests - 1);
      return { activeRequests, isLoading: activeRequests > 0 || s.manualLoading };
    }),
  setManualLoading: (manualLoading) =>
    set((s) => ({
      manualLoading,
      isLoading: s.activeRequests > 0 || manualLoading,
    })),
}));

export const showLoader = () => useLoaderStore.getState().start();
export const hideLoader = () => useLoaderStore.getState().stop();
