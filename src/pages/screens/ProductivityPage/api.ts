/**
 * All HTTP calls for the Productivity screen — now on the new backend's `overallSummary-service`
 * (`locationInsightController`; they were on the old `location-insight-service`), same URL shapes as the old
 * ElmsWatch screen (`views/admin/Productivity/index.jsx`), with the new `{ success, message, data }` envelope:
 *
 *  - `GET listOfPropertyProductivity/{period}` — `period` is the reporting date as `DD-MM-YYYY`; `data` is the
 *    list of locations (the old response's `totalRecords` is gone and was never used).
 *  - `POST modifyPropertyProductivity` — body `{ period, locations: [...] }`; `data` is just a message string.
 *    A `success: false` answer on an HTTP 200 is a failure, so it throws the backend's message.
 */
import axiosClient from "../../../api/axiosClient";
import { formatDateForApi, textOf, unwrapEnvelope as unwrap, type ApiEnvelope } from "../../../api/apiHelpers";
import type { ModifyProductivityPayload, ProductivityRow } from "./data";

const SERVICE = "/overallSummary-service/locationInsightController";

interface ProductivityRowApi {
  locationId?: string;
  locationName?: string;
  propertyValue?: string;
  status?: string;
  period?: string;
  productivity?: number | string | null;
}

/** A missing or non-numeric value stays `null` (shown empty), never 0. */
function productivityOf(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function mapProductivityRow(row: ProductivityRowApi): ProductivityRow {
  return {
    locationId: textOf(row.locationId, ""),
    locationName: row.locationName ?? "",
    productivity: productivityOf(row.productivity),
    propertyValue: row.propertyValue,
    status: row.status,
    period: row.period,
  };
}

export async function fetchProductivity(date: Date): Promise<ProductivityRow[]> {
  const { data: envelope } = await axiosClient.get<ApiEnvelope<ProductivityRowApi[]>>(
    `${SERVICE}/listOfPropertyProductivity/${formatDateForApi(date)}`
  );
  return (unwrap(envelope) ?? []).map(mapProductivityRow);
}

export async function modifyProductivity(payload: ModifyProductivityPayload): Promise<void> {
  const { data: envelope } = await axiosClient.post<ApiEnvelope<string>>(`${SERVICE}/modifyPropertyProductivity`, payload, { keepOnNavigation: true });
  unwrap(envelope);
}
