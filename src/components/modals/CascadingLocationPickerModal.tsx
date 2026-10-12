import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { dependentPlaceholder } from "../../lib/placeholders";
import { Modal } from "./Modal";
import { SelectSearch } from "../fields/SelectSearch";
import { TextButton } from "../buttons/TextButton";
import { useApiRequest } from "../../api/useApiRequest";

export type PickerLocationType = "all" | "segments" | "contracts" | "om";

const TYPE_LABELS: Record<PickerLocationType, string> = {
  all: "All Locations",
  segments: "Segment Based",
  contracts: "Contract Based",
  om: "OM Based",
};

const TYPE_OPTIONS: { label: string; value: PickerLocationType }[] = (Object.keys(TYPE_LABELS) as PickerLocationType[]).map((value) => ({
  label: TYPE_LABELS[value],
  value,
}));

export interface PickerLocationOption {
  id: string;
  name: string;
  startDay?: number;
}

/** What a screen supplies: its own dropdown endpoints (each screen talks to its own service). */
export interface LocationPickerSource {
  fetchCategories: (type: PickerLocationType, date: Date) => Promise<{ name?: string }[]>;
  fetchAllLocations: (date: Date) => Promise<PickerLocationOption[]>;
  fetchLocationsByCategory: (type: PickerLocationType, category: string, date: Date) => Promise<PickerLocationOption[]>;
}

export interface CascadingLocationPickerModalProps extends LocationPickerSource {
  open: boolean;
  onClose: () => void;
  /** `startDay` is passed through whenever the backend has a billing cycle configured for the
   * picked location, so the caller can compute its billing window without a second lookup. */
  onPick: (locationId: string, startDay?: number) => void;
  reportingMonth: Date;
  /** Text above the dropdowns. */
  description: string;
  /** Label of the confirm button. */
  submitLabel: string;
  /** Value of the `data-tour` attribute on the modal body, so each screen's tour can find it. */
  tourId: string;
}

/** Single-location picker: the cascading type → category → location flow, always dismissible. */
export function CascadingLocationPickerModal({
  open,
  onClose,
  onPick,
  reportingMonth,
  description,
  submitLabel,
  tourId,
  fetchCategories,
  fetchAllLocations,
  fetchLocationsByCategory,
}: Readonly<CascadingLocationPickerModalProps>) {
  const [type, setType] = useState<PickerLocationType>("all");
  const [category, setCategory] = useState("");
  const [locationId, setLocationId] = useState("");

  const categories = useApiRequest(fetchCategories);
  const allLocations = useApiRequest(fetchAllLocations);
  const byCategoryLocations = useApiRequest(fetchLocationsByCategory);

  useEffect(() => {
    if (open) {
      setType("all");
      setCategory("");
      setLocationId("");
    }
  }, [open]);

  useEffect(() => {
    if (!open || type === "all") return;
    categories.run(type, reportingMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type, reportingMonth]);

  useEffect(() => {
    if (!open) return;
    if (type === "all") {
      allLocations.run(reportingMonth);
    } else if (category) {
      byCategoryLocations.run(type, category, reportingMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type, category, reportingMonth]);

  const categoryOptions = (categories.data ?? []).map((c) => ({ label: c.name ?? "", value: c.name ?? "" }));
  const locationsData = type === "all" ? allLocations.data : byCategoryLocations.data;
  const locationsLoading = type === "all" ? allLocations.loading : byCategoryLocations.loading;
  const locationOptions = (locationsData ?? []).map((l) => ({ label: `${l.id} — ${l.name}`, value: l.id }));
  const locationsDisabled = type !== "all" && !category;
  const selectedLocation = (locationsData ?? []).find((l) => l.id === locationId);

  function pick() {
    if (!locationId) return;
    onPick(locationId, selectedLocation?.startDay);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      onEnter={locationId ? pick : undefined}
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
          <TextButton disabled={!locationId} onClick={pick}>
            {submitLabel}
          </TextButton>
        </>
      }
    >
      <div data-tour={tourId} className="space-y-4">
        <p className="text-body-sm">{description}</p>
        <SelectSearch
          label="Location type"
          options={TYPE_OPTIONS}
          value={type}
          clearable={false}
          portal
          onChange={(v) => {
            setType(v ?? "all");
            setCategory("");
            setLocationId("");
          }}
        />
        <SelectSearch
          label={type === "all" ? "Category" : TYPE_LABELS[type].replace(" Based", "")}
          options={categoryOptions}
          value={category || null}
          placeholder={dependentPlaceholder(type === "all" ? "Pick a type first" : null, categories.loading, "Select category")}
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
          placeholder={dependentPlaceholder(locationsDisabled ? "Pick a category first" : null, locationsLoading, "Search by ID or name")}
          disabled={locationsDisabled}
          portal
          onChange={(v) => setLocationId(v ?? "")}
        />
      </div>
    </Modal>
  );
}
