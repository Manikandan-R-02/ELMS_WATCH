import { dependentPlaceholder } from "../../../lib/placeholders";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Modal } from "../../../components/modals/Modal";
import { SelectSearch } from "../../../components/fields/SelectSearch";
import { TextButton } from "../../../components/buttons/TextButton";
import { useApiRequest } from "../../../api/useApiRequest";
import { LOCATION_TYPE_API_INDEX, fetchLocationTypeOptions, fetchLocationsByCategory } from "./api";
import { LOCATION_TYPE_LABELS, LOCATION_TYPE_CATEGORY_LABELS, type LocationType } from "./data";

export interface LocationFilter {
  type: LocationType | "all";
  category: string;
  locationId: string;
}

interface LocationFilterModalProps {
  open: boolean;
  onClose: () => void;
  value: LocationFilter;
  onApply: (next: LocationFilter) => void;
  reportingMonth: Date;
}

const TYPE_OPTIONS = [
  { label: "All locations", value: "all" as const },
  { label: LOCATION_TYPE_LABELS.segments, value: "segments" as const },
  { label: LOCATION_TYPE_LABELS.contracts, value: "contracts" as const },
  { label: LOCATION_TYPE_LABELS.om, value: "om" as const },
];

export function LocationFilterModal({ open, onClose, value, onApply, reportingMonth }: Readonly<LocationFilterModalProps>) {
  const [type, setType] = useState<LocationType | "all">(value.type);
  const [category, setCategory] = useState(value.category);
  const [locationId, setLocationId] = useState(value.locationId);

  const categories = useApiRequest(fetchLocationTypeOptions);
  // Two separate calls (different arg shapes) rather than one ternary'd into a union
  // function — "all" locations only needs the date, a specific type also needs its category.
  const allLocations = useApiRequest(fetchLocationTypeOptions);
  const byCategoryLocations = useApiRequest(fetchLocationsByCategory);

  useEffect(() => {
    if (open) {
      setType(value.type);
      setCategory(value.category);
      setLocationId(value.locationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value]);

  // Category dropdown — one call per type, re-run whenever the modal opens on a non-"all" type
  // (or the type changes while it's open) so a stale list from a previous type never shows.
  useEffect(() => {
    if (!open || type === "all") return;
    categories.run(LOCATION_TYPE_API_INDEX[type], reportingMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type, reportingMonth]);

  // Specific-location dropdown — "all" locations (apiIndex 0) needs only the date; a specific
  // type needs its category chosen first (matches the old app disabling this field until then).
  useEffect(() => {
    if (!open) return;
    if (type === "all") {
      allLocations.run(0, reportingMonth);
    } else if (category) {
      byCategoryLocations.run(type, category, reportingMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type, category, reportingMonth]);

  const categoryOptions = (categories.data ?? []).map((c) => ({ label: c.name, value: c.name }));
  const locationsData = type === "all" ? allLocations.data : byCategoryLocations.data;
  const locationsLoading = type === "all" ? allLocations.loading : byCategoryLocations.loading;
  const locationOptions = (locationsData ?? [])
    .filter((loc): loc is typeof loc & { id: string } => !!loc.id)
    .map((loc) => ({ label: `${loc.id} — ${loc.name}`, value: loc.id }));
  const locationsDisabled = type !== "all" && !category;

  function applyAndClose() {
    onApply({ type, category, locationId });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      onEnter={applyAndClose}
      title="Filter locations"
      icon={
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <MapPin className="h-[1.375rem] w-[1.375rem]" />
        </span>
      }
      accentClassName="bg-brand-500"
      footer={
        <>
          <TextButton variant="outline" tone="neutral" onClick={onClose}>
            Cancel
          </TextButton>
          <TextButton onClick={applyAndClose}>Apply</TextButton>
        </>
      }
    >
      <div data-tour="location-summary-filter-modal" className="space-y-4">
        <SelectSearch
          label="Location type"
          options={TYPE_OPTIONS}
          value={type}
          clearable={false}
          portal
          onChange={(v) => {
            setType((v ?? "all"));
            setCategory("");
            setLocationId("");
          }}
        />
        <SelectSearch
          label={type === "all" ? "Category" : LOCATION_TYPE_CATEGORY_LABELS[type]}
          options={categoryOptions}
          value={category || null}
          placeholder={dependentPlaceholder(type === "all" ? "Pick a type first" : null, categories.loading, `Any ${LOCATION_TYPE_CATEGORY_LABELS[type as LocationType]?.toLowerCase() ?? "category"}`)}
          disabled={type === "all"}
          portal
          onChange={(v) => {
            setCategory(v ?? "");
            setLocationId("");
          }}
        />
        <SelectSearch
          label="Specific location"
          options={locationOptions}
          value={locationId || null}
          placeholder={dependentPlaceholder(locationsDisabled ? `Pick a ${LOCATION_TYPE_CATEGORY_LABELS[type]?.toLowerCase() ?? "category"} first` : null, locationsLoading, "Any location")}
          disabled={locationsDisabled}
          portal
          onChange={(v) => setLocationId(v ?? "")}
        />
      </div>
    </Modal>
  );
}
