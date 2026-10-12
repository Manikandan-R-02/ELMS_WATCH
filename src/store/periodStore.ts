import { create } from "zustand";
import { startOfMonth } from "date-fns";

/**
 * The app-wide reporting period, selected via the header's MonthPicker (see
 * Header.tsx). Every data-fetching screen reads `selectedMonth` from here
 * instead of keeping its own local copy, so switching the month in the
 * header updates every screen consistently — the old ElmsWatch app instead
 * duplicated this same store three times (one per module that needed it,
 * see ELmsWatch/src/views/admin/{categoryanalysis,LmsPrediction,mmsEstimations}/useDateStore.jsx),
 * which is exactly the kind of drift a single shared store avoids. Not
 * persisted — resets to the current month on reload, matching the old app.
 */
interface PeriodState {
  /** Always normalized to the 1st of the month. */
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
}

export const usePeriodStore = create<PeriodState>((set) => ({
  selectedMonth: startOfMonth(new Date()),
  setSelectedMonth: (date) => set({ selectedMonth: startOfMonth(date) }),
}));
