import { dependentPlaceholder } from "../../../lib/placeholders";
import { useEffect, useState } from "react";
import { Filter as FilterIcon } from "lucide-react";
import { Modal } from "../../../components/modals/Modal";
import { SelectSearch } from "../../../components/fields/SelectSearch";
import { Segmented } from "../../../components/common/Segmented";
import { TextButton } from "../../../components/buttons/TextButton";
import { FormErrorBanner } from "../../../components/common/FormErrorBanner";
import { useApiRequest } from "../../../api/useApiRequest";
import { useLocationFilterLookups, type LocationFilterSource } from "../../../components/modals/useLocationFilterLookups";
import {
  fetchAllLocationOptions,
  fetchCategoryOptions,
  fetchLocationOptionsByCategory,
  fetchLocationTypeCategories,
  fetchSrcTypeOptions,
} from "./api";

const LOOKUP_SOURCE: LocationFilterSource = {
  fetchCategories: fetchLocationTypeCategories,
  fetchAllLocations: fetchAllLocationOptions,
  fetchLocationsByCategory: fetchLocationOptionsByCategory,
  fetchItemCategories: fetchCategoryOptions,
};
import { LOCATION_TYPE_LABELS, type LocationType } from "./data";

export const ALL_CATEGORY = "All Category";

export interface ConsumptionFilter {
  locationType: LocationType;
  locationCategory: string | null;
  locationId: string | null;
  category: string;
  srcType: string | null;
}

export const DEFAULT_CONSUMPTION_FILTER: ConsumptionFilter = {
  locationType: "all",
  locationCategory: null,
  locationId: null,
  category: ALL_CATEGORY,
  srcType: null,
};

interface ConsumptionFilterModalProps {
  open: boolean;
  onClose: () => void;
  value: ConsumptionFilter;
  onApply: (next: ConsumptionFilter) => void;
  reportingMonth: Date;
}

const LOCATION_TYPE_OPTIONS: { label: string; value: LocationType }[] = [
  { label: LOCATION_TYPE_LABELS.all, value: "all" },
  { label: LOCATION_TYPE_LABELS.segments, value: "segments" },
  { label: LOCATION_TYPE_LABELS.contracts, value: "contracts" },
  { label: LOCATION_TYPE_LABELS.om, value: "om" },
];

/**
 * Every "Location Detail" filter (location type/category/ID, item category, source type) that
 * used to sit inline as a five-wide row of dropdowns above the chart/detail table — cramped on
 * anything narrower than a wide desktop, and each control lost its own breathing room. Collapsed
 * into one filter modal instead, the same "single trigger pill + Apply/Cancel modal" pattern as
 * `LocationSummaryPage`'s own `LocationFilterModal` (see that file), extended with this screen's
 * two extra filters (item category, source type) that screen doesn't have. Each dropdown still
 * fetches its own options lazily as the modal is opened / a prior field changes, same as that
 * reference implementation.
 */
export function ConsumptionFilterModal({ open, onClose, value, onApply, reportingMonth }: Readonly<ConsumptionFilterModalProps>) {
  const [locationType, setLocationType] = useState<LocationType>(value.locationType);
  const [locationCategory, setLocationCategory] = useState(value.locationCategory);
  const [locationId, setLocationId] = useState(value.locationId);
  const [category, setCategory] = useState(value.category);
  const [srcType, setSrcType] = useState(value.srcType);

  useEffect(() => {
    if (!open) return;
    setLocationType(value.locationType);
    setLocationCategory(value.locationCategory);
    setLocationId(value.locationId);
    setCategory(value.category);
    setSrcType(value.srcType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value]);

  const { typeCategories, itemCategories, locationsLoading, locationsError, locationsDisabled, locationOptions, categoryPickOptions } = useLocationFilterLookups(
    open,
    locationType,
    locationCategory,
    reportingMonth,
    LOOKUP_SOURCE
  );

  const srcTypeOptionsReq = useApiRequest(fetchSrcTypeOptions);
  useEffect(() => {
    if (!open || !locationId) return;
    srcTypeOptionsReq.run(reportingMonth, locationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, locationId, reportingMonth]);

  const consumptionCategoryOptions = [
    { label: ALL_CATEGORY, value: ALL_CATEGORY },
    ...(itemCategories.data ?? []).map((c) => ({ label: c, value: c })),
  ];
  const srcOptions = [{ label: "All Source Types", value: "" }, ...(srcTypeOptionsReq.data ?? []).map((s) => ({ label: s, value: s }))];

  const lookupError = locationsError ?? typeCategories.error ?? itemCategories.error ?? srcTypeOptionsReq.error;

  function applyAndClose() {
    onApply({ locationType, locationCategory, locationId, category, srcType });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      onEnter={applyAndClose}
      title="Filter consumption detail"
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
          <TextButton onClick={applyAndClose} data-tour="consumption-analysis-filter-apply">
            Apply
          </TextButton>
        </>
      }
    >
      <div data-tour="consumption-analysis-filter-modal" className="space-y-4">
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
              setSrcType(null);
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
              setSrcType(null);
            }}
          />
        )}
        <SelectSearch
          label="Location"
          options={locationOptions}
          value={locationId}
          placeholder={dependentPlaceholder(locationsDisabled ? "Pick a category first" : null, locationsLoading, "Any location")}
          disabled={locationsDisabled}
          portal
          onChange={(v) => {
            setLocationId(v);
            setSrcType(null);
          }}
        />
        <SelectSearch
          label="Item Category"
          options={consumptionCategoryOptions}
          value={category}
          clearable={false}
          searchable={consumptionCategoryOptions.length > 8}
          portal
          onChange={(v) => setCategory(v ?? ALL_CATEGORY)}
        />
        <SelectSearch
          label="Source Type"
          options={srcOptions}
          value={srcType ?? ""}
          clearable={false}
          searchable={srcOptions.length > 8}
          disabled={!locationId}
          placeholder={dependentPlaceholder(locationId ? null : "Pick a location first", srcTypeOptionsReq.loading, "All Source Types")}
          portal
          onChange={(v) => setSrcType(v || null)}
        />
      </div>
    </Modal>
  );
}
