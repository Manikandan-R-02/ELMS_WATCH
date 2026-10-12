import { dependentPlaceholder } from "../../../lib/placeholders";
import { useEffect } from "react";
import { Segmented } from "../../../components/common/Segmented";
import { SelectSearch } from "../../../components/fields/SelectSearch";
import { useApiRequest } from "../../../api/useApiRequest";
import { fetchAllLocationOptions, fetchLocationOptionsByCategory, fetchLocationTypeCategories } from "./api";
import { LOCATION_TYPE_LABELS, type LocationType } from "./data";

export interface StockOnHandFilter {
  locationType: LocationType;
  locationCategory: string | null;
  locationId: string | null;
}

export const DEFAULT_STOCK_ON_HAND_FILTER: StockOnHandFilter = {
  locationType: "all",
  locationCategory: null,
  locationId: null,
};

interface StockOnHandLocationPickerProps {
  value: StockOnHandFilter;
  onChange: (next: StockOnHandFilter) => void;
  reportingMonth: Date;
}

const LOCATION_TYPE_OPTIONS: { label: string; value: LocationType }[] = [
  { label: LOCATION_TYPE_LABELS.all, value: "all" },
  { label: LOCATION_TYPE_LABELS.segments, value: "segments" },
  { label: LOCATION_TYPE_LABELS.contracts, value: "contracts" },
  { label: LOCATION_TYPE_LABELS.om, value: "om" },
];

/**
 * Location type + category + ID, inline in the "Location Detail" card header instead of behind a
 * filter-modal trigger — collapsed there once, then un-collapsed back to inline on request since
 * this screen only ever has the one picker (no item-category/source-type filters competing for
 * the same row like Consumption Analysis has), so a modal was more indirection than the control
 * count actually needed. Each change applies immediately (no Apply/Cancel step) — same as the old
 * app's own inline dropdowns and as DailyPrjPage's location `SelectSearch`.
 */
export function StockOnHandLocationPicker({ value, onChange, reportingMonth }: Readonly<StockOnHandLocationPickerProps>) {
  const { locationType, locationCategory, locationId } = value;

  const typeCategories = useApiRequest(fetchLocationTypeCategories);
  useEffect(() => {
    if (locationType === "all") return;
    typeCategories.run(locationType, reportingMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationType, reportingMonth]);

  const allLocations = useApiRequest(fetchAllLocationOptions);
  const locationsByCategory = useApiRequest(fetchLocationOptionsByCategory);
  useEffect(() => {
    if (locationType === "all") {
      allLocations.run(reportingMonth);
    } else if (locationCategory) {
      locationsByCategory.run(locationType, locationCategory, reportingMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationType, locationCategory, reportingMonth]);

  const locationsData = locationType === "all" ? allLocations.data : locationsByCategory.data;
  const locationsLoading = locationType === "all" ? allLocations.loading : locationsByCategory.loading;
  const locationOptions = (locationsData ?? []).map((l) => ({ label: l.name ? `${l.id} — ${l.name}` : l.id, value: l.id }));
  const locationsDisabled = locationType !== "all" && !locationCategory;

  const categoryPickOptions = (typeCategories.data ?? []).map((c) => ({ label: c.name ?? "", value: c.name ?? "" }));

  // A failed lookup (network error, 500, a backend message) must not look like a dropdown that is genuinely empty.
  const locationsError = locationType === "all" ? allLocations.error : locationsByCategory.error;
  const lookupError = locationsError ?? typeCategories.error;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented
        options={LOCATION_TYPE_OPTIONS}
        value={locationType}
        // Narrowing the type/category only changes which locations are *offered* in the dropdown
        // below — it doesn't clear whatever location is already selected and showing its Stock On
        // Hand detail. Clearing `locationId` here used to force the reader to re-pick a location
        // from scratch (re-triggering the empty state) every time they changed this filter, even
        // though they'd already picked one and were just trying to narrow the list for a *future*
        // pick. The detail view stays on the current location until they explicitly choose a
        // different one from the (now-filtered) Location field.
        onChange={(v) => onChange({ locationType: v, locationCategory: null, locationId })}
      />
      {locationType !== "all" && (
        <SelectSearch
          options={categoryPickOptions}
          value={locationCategory}
          placeholder={typeCategories.loading ? "Loading…" : `Select ${LOCATION_TYPE_LABELS[locationType].replace(" Based", "").toLowerCase()}`}
          portal
          onChange={(v) => onChange({ locationType, locationCategory: v, locationId })}
          containerClassName="w-44"
        />
      )}
      <SelectSearch
        options={locationOptions}
        value={locationId}
        placeholder={dependentPlaceholder(locationsDisabled ? "Pick a category first" : null, locationsLoading, "Select location")}
        disabled={locationsDisabled}
        portal
        onChange={(v) => onChange({ locationType, locationCategory, locationId: v })}
        containerClassName="w-56"
      />
      {lookupError && <p className="basis-full text-caption text-red-600 dark:text-red-400">Couldn't load locations: {lookupError.message}</p>}
    </div>
  );
}
