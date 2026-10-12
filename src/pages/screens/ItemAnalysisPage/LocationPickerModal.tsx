import { CascadingLocationPickerModal } from "../../../components/modals/CascadingLocationPickerModal";
import { fetchAllLocationOptions, fetchLocationOptionsByCategory, fetchLocationTypeCategories } from "./api";

export interface LocationPickerModalProps {
  open: boolean;
  onClose: () => void;
  /** `startDay` is passed through whenever the backend has a billing cycle configured for the
   * picked location, so the caller can compute its billing window without a second lookup. */
  onPick: (locationId: string, startDay?: number) => void;
  reportingMonth: Date;
}

/** Single-location picker for Item Analysis — the shared cascading picker, wired to this screen's own
 * `itemIngredientAnalysisController` dropdown endpoints (on `item-analysis-summary-service`) since they carry each
 * location's `startDay` (the other screen's location dropdown doesn't). */
export function LocationPickerModal(props: Readonly<LocationPickerModalProps>) {
  return (
    <CascadingLocationPickerModal
      {...props}
      description="Pick a location to see its item-wise consumption cost breakdown."
      submitLabel="View item analysis"
      tourId="item-analysis-picker-modal"
      fetchCategories={fetchLocationTypeCategories}
      fetchAllLocations={fetchAllLocationOptions}
      fetchLocationsByCategory={fetchLocationOptionsByCategory}
    />
  );
}
