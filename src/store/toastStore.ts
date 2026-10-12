import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id" | "duration"> & { duration?: number }) => number;
  dismiss: (id: number) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: ({ duration = 3000, ...toast }) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { id, duration, ...toast }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

function toast(type: ToastType, title: string, description?: string, duration?: number) {
  return useToastStore.getState().push({ type, title, description, duration });
}

export const showSuccessToast = (title: string, description?: string) => toast("success", title, description);
export const showErrorToast = (title: string, description?: string) => toast("error", title, description);
export const showWarningToast = (title: string, description?: string) => toast("warning", title, description);
export const showInfoToast = (title: string, description?: string) => toast("info", title, description);
