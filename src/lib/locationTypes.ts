/** The location-type filter every analysis screen offers (an "all" option plus the three business types). */
export type LocationType = "all" | "segments" | "contracts" | "om";

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  all: "All Locations",
  segments: "Segment Based",
  contracts: "Contract Based",
  om: "OM Based",
};

/** `overallDropDown`/`dropDownByNameBased`'s `idx` path segment per location type (the old app's `apiIndex` mapping). */
export const LOCATION_TYPE_API_INDEX: Record<LocationType, number> = {
  all: 0,
  contracts: 1,
  segments: 2,
  om: 3,
};
