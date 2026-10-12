import { create } from "zustand";
import type { AxiosRequestConfig } from "axios";
import axiosClient from "./axiosClient";
import { toApiError, type ApiError } from "./types";

/**
 * Factory that produces a fully-typed zustand store for a REST resource,
 * so every module wires API state (list/current/loading/error) the same way
 * instead of hand-rolling fetch logic per screen.
 */
export function createResourceStore<T, TCreate = Partial<T>, TUpdate = Partial<T>>(
  baseUrl: string
) {
  interface State {
    items: T[];
    current: T | null;
    loading: boolean;
    error: ApiError | null;
    fetchAll: (config?: AxiosRequestConfig) => Promise<T[]>;
    fetchOne: (id: string | number, config?: AxiosRequestConfig) => Promise<T | null>;
    create: (payload: TCreate) => Promise<T | null>;
    update: (id: string | number, payload: TUpdate) => Promise<T | null>;
    remove: (id: string | number) => Promise<boolean>;
    reset: () => void;
  }

  return create<State>((set, get) => ({
    items: [],
    current: null,
    loading: false,
    error: null,

    fetchAll: async (config) => {
      set({ loading: true, error: null });
      try {
        const { data } = await axiosClient.get<T[]>(baseUrl, config);
        set({ items: data, loading: false });
        return data;
      } catch (err) {
        set({ error: toApiError(err), loading: false });
        return [];
      }
    },

    fetchOne: async (id, config) => {
      set({ loading: true, error: null });
      try {
        const { data } = await axiosClient.get<T>(`${baseUrl}/${id}`, config);
        set({ current: data, loading: false });
        return data;
      } catch (err) {
        set({ error: toApiError(err), loading: false });
        return null;
      }
    },

    create: async (payload) => {
      set({ loading: true, error: null });
      try {
        const { data } = await axiosClient.post<T>(baseUrl, payload, { keepOnNavigation: true });
        set({ items: [...get().items, data], loading: false });
        return data;
      } catch (err) {
        set({ error: toApiError(err), loading: false });
        return null;
      }
    },

    update: async (id, payload) => {
      set({ loading: true, error: null });
      try {
        const { data } = await axiosClient.put<T>(`${baseUrl}/${id}`, payload, { keepOnNavigation: true });
        set({
          items: get().items.map((item) =>
            (item as { id?: unknown }).id === id ? data : item
          ),
          current: data,
          loading: false,
        });
        return data;
      } catch (err) {
        set({ error: toApiError(err), loading: false });
        return null;
      }
    },

    remove: async (id) => {
      set({ loading: true, error: null });
      try {
        await axiosClient.delete(`${baseUrl}/${id}`, { keepOnNavigation: true });
        set({
          items: get().items.filter((item) => (item as { id?: unknown }).id !== id),
          loading: false,
        });
        return true;
      } catch (err) {
        set({ error: toApiError(err), loading: false });
        return false;
      }
    },

    reset: () => set({ items: [], current: null, loading: false, error: null }),
  }));
}
