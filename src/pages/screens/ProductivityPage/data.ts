/**
 * Types (no mock data) for the Productivity screen — the rebuild of the old ElmsWatch app's
 * `views/admin/Productivity/index.jsx` ("Productivity" in the sidebar). One flat row per
 * location, one editable Productivity value each — simpler than Target PRJ's per-location list
 * of PRJ/SRC entries, so this screen edits inline in the table instead of opening a modal.
 */

export interface ProductivityRow {
  locationId: string;
  locationName: string;
  productivity: number | null;
  /** Server-side fields of the row, sent back unchanged on save. */
  propertyValue?: string;
  status?: string;
  period?: string;
}

/** One location of the save request — the loaded row with its new `productivity`. */
export interface ModifyProductivityLocation {
  locationId: string;
  locationName: string;
  productivity: number;
  propertyValue?: string;
  status?: string;
  period?: string;
}

export interface ModifyProductivityPayload {
  period: string;
  locations: ModifyProductivityLocation[];
}

/** Row shape the table renders — `sno` assigned after search/sort/paginate. */
export interface ProductivityTableRow extends ProductivityRow {
  sno: number;
}

/** Builds the flat edited/original value map from a fresh API response, keyed by location ID
 * (no composite key needed — unlike Target PRJ's PRJ/SRC list, there's exactly one value per
 * location here). */
export function buildValueMap(rows: ProductivityRow[]): Record<string, number | ""> {
  const map: Record<string, number | ""> = {};
  for (const row of rows) {
    map[row.locationId] = row.productivity ?? "";
  }
  return map;
}
