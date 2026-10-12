import { useEffect } from "react";
import { useApiRequest } from "../../api/useApiRequest";
import type { LocationPickerSource, PickerLocationType } from "./CascadingLocationPickerModal";

/** Dropdown endpoints a location-filter modal needs: the picker's three, plus the item-category list. */
export interface LocationFilterSource extends LocationPickerSource {
  fetchItemCategories: () => Promise<string[]>;
}

/**
 * The cascading lookups behind a location-filter modal: location categories for the chosen type, locations
 * (all, or those of the chosen category), and the item-category list — each fetched only while the modal is
 * open and re-fetched when the field it depends on changes.
 */
export function useLocationFilterLookups(
  open: boolean,
  locationType: PickerLocationType,
  locationCategory: string | null,
  reportingMonth: Date,
  source: LocationFilterSource
) {
  const typeCategories = useApiRequest(source.fetchCategories);
  useEffect(() => {
    if (!open || locationType === "all") return;
    typeCategories.run(locationType, reportingMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, locationType, reportingMonth]);

  const allLocations = useApiRequest(source.fetchAllLocations);
  const locationsByCategory = useApiRequest(source.fetchLocationsByCategory);
  useEffect(() => {
    if (!open) return;
    if (locationType === "all") {
      allLocations.run(reportingMonth);
    } else if (locationCategory) {
      locationsByCategory.run(locationType, locationCategory, reportingMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, locationType, locationCategory, reportingMonth]);

  const itemCategories = useApiRequest(source.fetchItemCategories);
  useEffect(() => {
    if (!open) return;
    itemCategories.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const locationsData = locationType === "all" ? allLocations.data : locationsByCategory.data;
  const locationsLoading = locationType === "all" ? allLocations.loading : locationsByCategory.loading;
  // Surfaced so a failed lookup (network error, 500, a backend message) never looks identical to a dropdown that
  // is genuinely empty.
  const locationsError = locationType === "all" ? allLocations.error : locationsByCategory.error;

  return {
    typeCategories,
    itemCategories,
    locationsLoading,
    locationsError,
    locationsDisabled: locationType !== "all" && !locationCategory,
    locationOptions: (locationsData ?? []).map((l) => ({ label: l.name ? `${l.id} — ${l.name}` : l.id, value: l.id })),
    categoryPickOptions: (typeCategories.data ?? []).map((c) => ({ label: c.name ?? "", value: c.name ?? "" })),
  };
}
