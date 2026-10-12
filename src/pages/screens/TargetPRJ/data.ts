/** One PRJ / SRC target. `controllPrjId` (sic), `prjStatus` and `period` come back from the server and
 * are sent back unchanged on save — only `targetValue` is ever edited here. */
export interface TargetPrjEntry {
  prjId: string;
  targetValue: number | null;
  controllPrjId?: string;
  prjStatus?: string;
  period?: string;
}

export interface TargetPrjLocation {
  locationId: string;
  locationName: string;
  targetPrjList: TargetPrjEntry[];
  /** Server-side fields of the location, sent back unchanged on save. */
  propertyValue?: string;
  status?: string;
}

/** One location of the save request — the loaded location with only the changed entries in its list. */
export interface ModifyTargetPrjLocation {
  locationId: string;
  locationName?: string;
  propertyValue?: string;
  status?: string;
  targetPrjList: (TargetPrjEntry & { targetValue: number })[];
}

export interface ModifyTargetPrjPayload {
  period: string;
  locations: ModifyTargetPrjLocation[];
}

/** Row shape the table renders — one per location, `sno` assigned after search/paginate. */
export interface TargetPrjRow {
  locationId: string;
  locationName: string;
  targetPrjList: TargetPrjEntry[];
  sno: number;
}

/** Composite key for the flat edited/original value maps (locationId + prjId -> value). */
export const valueKey = (locationId: string, prjId: string) => `${locationId}::${prjId}`;

export const formatTargetValue = (v: number | null | undefined) => {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toFixed(3);
};

/** Builds the flat edited/original value map from a fresh API response. */
export function buildValueMap(locations: TargetPrjLocation[]): Record<string, number | ""> {
  const map: Record<string, number | ""> = {};
  for (const loc of locations) {
    for (const prj of loc.targetPrjList ?? []) {
      map[valueKey(loc.locationId, prj.prjId)] =
        prj.targetValue ?? "";
    }
  }
  return map;
}
