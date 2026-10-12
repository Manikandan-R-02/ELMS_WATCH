import { dependentPlaceholder } from "../../../lib/placeholders";
import { useEffect, useState } from "react";
import { Filter as FilterIcon } from "lucide-react";
import { Modal } from "../../../components/modals/Modal";
import { SelectSearch } from "../../../components/fields/SelectSearch";
import { Segmented } from "../../../components/common/Segmented";
import { TextButton } from "../../../components/buttons/TextButton";
import { FormErrorBanner } from "../../../components/common/FormErrorBanner";
import { useLocationFilterLookups, type LocationFilterSource } from "../../../components/modals/useLocationFilterLookups";
import { fetchAllLocationOptions, fetchCategoryOptions, fetchLocationOptionsByCategory, fetchLocationTypeCategories } from "./api";

const LOOKUP_SOURCE: LocationFilterSource = {
  fetchCategories: fetchLocationTypeCategories,
  fetchAllLocations: fetchAllLocationOptions,
  fetchLocationsByCategory: fetchLocationOptionsByCategory,
  fetchItemCategories: fetchCategoryOptions,
};
import { LOCATION_TYPE_LABELS, type ItemBreakupFilter, type LocationType } from "./data";

export interface ItemBreakupFilterModalProps {
  open: boolean;
  onClose: () => void;
  value: ItemBreakupFilter;
  onApply: (next: ItemBreakupFilter) => void;
  reportingMonth: Date;
}

const LOCATION_TYPE_OPTIONS: { label: string; value: LocationType }[] = [
  { label: LOCATION_TYPE_LABELS.all, value: "all" },
  { label: LOCATION_TYPE_LABELS.segments, value: "segments" },
  { label: LOCATION_TYPE_LABELS.contracts, value: "contracts" },
  { label: LOCATION_TYPE_LABELS.om, value: "om" },
];

/**
 * The old screen's location-selection modal (which it forced open before any query could run)
 * plus its separate "Category Lists" dropdown, combined into one filter modal — same
 * single-trigger-pill pattern as Consumption Analysis's own `ConsumptionFilterModal` (location
 * type/category/ID cascading dropdowns), minus that screen's "All Category"/source-type filters,
 * which don't exist here: this screen has no "all categories" option, so Apply stays disabled
 * until both a location and a category are chosen — the old app just silently refused to query
 * instead of telling the reader why nothing was happening.
 */
export function ItemBreakupFilterModal({ open, onClose, value, onApply, reportingMonth }: Readonly<ItemBreakupFilterModalProps>) {
  const [locationType, setLocationType] = useState<LocationType>(value.locationType);
  const [locationCategory, setLocationCategory] = useState(value.locationCategory);
  const [locationId, setLocationId] = useState(value.locationId);
  const [categoryId, setCategoryId] = useState(value.categoryId);

  useEffect(() => {
    if (!open) return;
    setLocationType(value.locationType);
    setLocationCategory(value.locationCategory);
    setLocationId(value.locationId);
    setCategoryId(value.categoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value]);

  const { typeCategories, itemCategories, locationsLoading, locationsError, locationsDisabled, locationOptions, categoryPickOptions } = useLocationFilterLookups(
    open,
    locationType,
    locationCategory,
    reportingMonth,
    LOOKUP_SOURCE
  );

  const itemCategoryOptions = (itemCategories.data ?? []).map((c) => ({ label: c, value: c }));

  const canApply = !!locationId && !!categoryId;
  const lookupError = locationsError ?? typeCategories.error ?? itemCategories.error;

  function applyAndClose() {
    if (!canApply) return;
    onApply({ locationType, locationCategory, locationId, categoryId });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      onEnter={applyAndClose}
      title="Filter item breakup"
      icon={
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <FilterIcon className="h-[1.375rem] w-[1.375rem]" />
        </span>
      }
      accentClassName="bg-brand-500"
      footer={
        <>
          <TextButton variant="outline" tone="neutral" onClick={onClose}>
            Cancel
          </TextButton>
          <TextButton onClick={applyAndClose} disabled={!canApply}>
            Apply
          </TextButton>
        </>
      }
    >
      <div data-tour="item-breakup-filter-modal" className="space-y-4">
        {lookupError && <FormErrorBanner message={`Couldn't load options: ${lookupError.message}`} />}
        <div>
          <p className="text-label mb-1.5">Location Type</p>
          <Segmented
            options={LOCATION_TYPE_OPTIONS}
            value={locationType}
            onChange={(v) => {
              setLocationType(v);
              setLocationCategory(null);
              setLocationId(null);
            }}
          />
        </div>
        {locationType !== "all" && (
          <SelectSearch
            label={LOCATION_TYPE_LABELS[locationType].replace(" Based", "")}
            options={categoryPickOptions}
            value={locationCategory}
            placeholder={typeCategories.loading ? "Loading…" : "Select category"}
            portal
            onChange={(v) => {
              setLocationCategory(v);
              setLocationId(null);
            }}
          />
        )}
        <SelectSearch
          label="Location"
          required
          options={locationOptions}
          value={locationId}
          placeholder={dependentPlaceholder(locationsDisabled ? "Pick a category first" : null, locationsLoading, "Select a location")}
          disabled={locationsDisabled}
          portal
          onChange={setLocationId}
        />
        <SelectSearch
          label="Category"
          required
          options={itemCategoryOptions}
          value={categoryId}
          placeholder={itemCategories.loading ? "Loading…" : "Select a category"}
          portal
          onChange={setCategoryId}
        />
        {!canApply && <p className="text-caption">Pick both a location and a category to view its item breakup.</p>}
      </div>
    </Modal>
  );
}
