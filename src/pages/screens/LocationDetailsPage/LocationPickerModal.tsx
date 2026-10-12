import { dependentPlaceholder } from "../../../lib/placeholders";
import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { Modal } from "../../../components/modals/Modal";
import { SelectSearch } from "../../../components/fields/SelectSearch";
import { TextButton } from "../../../components/buttons/TextButton";
import { useApiRequest } from "../../../api/useApiRequest";
import { LOCATION_TYPE_API_INDEX, fetchLocationTypeOptions, fetchLocationsByCategory } from "../LocationSummaryPage/api";
import { LOCATION_TYPE_LABELS, LOCATION_TYPE_CATEGORY_LABELS, type LocationType } from "../LocationSummaryPage/data";

interface LocationPickerModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (locationId: string) => void;
  reportingMonth: Date;
}

const TYPE_OPTIONS = [
  { label: "All locations", value: "all" as const },
  { label: LOCATION_TYPE_LABELS.segments, value: "segments" as const },
  { label: LOCATION_TYPE_LABELS.contracts, value: "contracts" as const },
  { label: LOCATION_TYPE_LABELS.om, value: "om" as const },
];

/** Single-location picker — same cascading type → category → location flow as
 * `LocationSummaryPage/LocationFilterModal`, but this screen needs exactly one specific
 * location (there's no "all locations" table view here), so "View details" stays disabled until
 * one is chosen instead of allowing a bare type/category filter through.
 *
 * Always dismissible — backdrop click, Escape, and a Cancel button all close it, even before
 * any location has ever been picked. It used to force itself open with no way out until a
 * location was chosen, which trapped a reader who opened this screen by mistake (nothing else
 * on the page was reachable — see `LocationDetailsPage`'s empty state, shown once this closes
 * with still nothing picked, which explains how to reopen it via the header pill or the
 * "Location" stat card). */
/** Fetches category options for the chosen type, then locations for that type + category (or
 * every location, when type is "all") — the cascading type → category → location flow this
 * modal and `LocationFilterModal` both use. */
function useCascadingLocations(open: boolean, type: LocationType | "all", category: string, reportingMonth: Date) {
  const categories = useApiRequest(fetchLocationTypeOptions);
  const allLocations = useApiRequest(fetchLocationTypeOptions);
  const byCategoryLocations = useApiRequest(fetchLocationsByCategory);

  useEffect(() => {
    if (!open || type === "all") return;
    categories.run(LOCATION_TYPE_API_INDEX[type], reportingMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type, reportingMonth]);

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

  return { categoriesLoading: categories.loading, categoryOptions, locationOptions, locationsLoading, locationsDisabled };
}

export function LocationPickerModal({ open, onClose, onPick, reportingMonth }: Readonly<LocationPickerModalProps>) {
  const [type, setType] = useState<LocationType | "all">("all");
  const [category, setCategory] = useState("");
  const [locationId, setLocationId] = useState("");

  useEffect(() => {
    if (open) {
      setType("all");
      setCategory("");
      setLocationId("");
    }
  }, [open]);

  const { categoriesLoading, categoryOptions, locationOptions, locationsLoading, locationsDisabled } = useCascadingLocations(
    open,
    type,
    category,
    reportingMonth
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      onEnter={locationId ? () => onPick(locationId) : undefined}
      title="Select a location"
      icon={
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <Building2 className="h-[1.375rem] w-[1.375rem]" />
        </span>
      }
      accentClassName="bg-brand-500"
      footer={
        <>
          <TextButton variant="outline" tone="neutral" onClick={onClose}>
            Cancel
          </TextButton>
          <TextButton disabled={!locationId} onClick={() => onPick(locationId)}>
            View details
          </TextButton>
        </>
      }
    >
      <div data-tour="location-details-picker-modal" className="space-y-4">
        <p className="text-body-sm">Pick a location to see its daily cost, consumption, and inventory breakdown.</p>
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
          placeholder={dependentPlaceholder(type === "all" ? "Pick a type first" : null, categoriesLoading, `Any ${LOCATION_TYPE_CATEGORY_LABELS[type as LocationType]?.toLowerCase() ?? "category"}`)}
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
          placeholder={dependentPlaceholder(locationsDisabled ? `Pick a ${LOCATION_TYPE_CATEGORY_LABELS[type as LocationType]?.toLowerCase() ?? "category"} first` : null, locationsLoading, "Search by ID or name")}
          disabled={locationsDisabled}
          portal
          onChange={(v) => setLocationId(v ?? "")}
        />
      </div>
    </Modal>
  );
}
