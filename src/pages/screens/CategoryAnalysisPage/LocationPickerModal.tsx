import { CascadingLocationPickerModal } from "../../../components/modals/CascadingLocationPickerModal";
import { fetchAllLocationOptions, fetchLocationOptionsByCategory, fetchLocationTypeCategories } from "./api";

export interface LocationPickerModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (locationId: string, startDay?: number) => void;
  reportingMonth: Date;
}

/** Single-location picker for Category Analysis — the shared cascading picker, wired to this screen's own
 * `categoryAnalysisController` dropdown endpoints (on `item-analysis-summary-service`; see api.ts's file comment). */
export function LocationPickerModal(props: Readonly<LocationPickerModalProps>) {
  return (
    <CascadingLocationPickerModal
      {...props}
      description="Pick a location to see its spending broken down by group and category."
      submitLabel="View category analysis"
      tourId="category-analysis-picker-modal"
      fetchCategories={fetchLocationTypeCategories}
      fetchAllLocations={fetchAllLocationOptions}
      fetchLocationsByCategory={fetchLocationOptionsByCategory}
    />
  );
}
