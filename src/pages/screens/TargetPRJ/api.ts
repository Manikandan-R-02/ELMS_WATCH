/**
 * Target PRJ's two HTTP calls — now on the new backend's `overallSummary-service`
 * (`locationInsightController`; they were on the old `location-insight-service`), same URL shapes as the
 * old ElmsWatch screen (`views/admin/TargetPrj/index.jsx`), with the new `{ success, message, data }`
 * envelope:
 *
 *  - `GET listOfPropertyTargetPrj/{period}` — `period` is the reporting date as `DD-MM-YYYY`; `data` is the
 *    list of locations, each with its `targetPrjList`. (The old response also had `totalRecords` and `sum`;
 *    the new one doesn't, and the screen never used them.)
 *  - `POST modifyPropertyTargetPrj` — body `{ period, locations: [...] }`; `data` is just a message string.
 *    A `success: false` answer on an HTTP 200 is a failure, so it throws the backend's message.
 */
import axiosClient from "../../../api/axiosClient";
import { formatDateForApi, textOf, unwrapEnvelope as unwrap, type ApiEnvelope } from "../../../api/apiHelpers";
import type { ModifyTargetPrjPayload, TargetPrjEntry, TargetPrjLocation } from "./data";

const SERVICE = "/overallSummary-service/locationInsightController";

interface TargetPrjEntryApi {
  prjId?: string;
  controllPrjId?: string;
  prjStatus?: string;
  period?: string;
  targetValue?: number | string | null;
}

interface TargetPrjLocationApi {
  locationId?: string;
  locationName?: string;
  propertyValue?: string;
  status?: string;
  targetPrjList?: TargetPrjEntryApi[] | null;
}

/** A missing or non-numeric target stays `null` (shown as "—" and edited as empty), never 0. */
function targetValueOf(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function mapTargetEntry(entry: TargetPrjEntryApi): TargetPrjEntry {
  return {
    prjId: textOf(entry.prjId, ""),
    targetValue: targetValueOf(entry.targetValue),
    controllPrjId: entry.controllPrjId,
    prjStatus: entry.prjStatus,
    period: entry.period,
  };
}

export function mapTargetLocation(loc: TargetPrjLocationApi): TargetPrjLocation {
  return {
    locationId: textOf(loc.locationId, ""),
    locationName: loc.locationName ?? "",
    propertyValue: loc.propertyValue,
    status: loc.status,
    targetPrjList: (loc.targetPrjList ?? []).map(mapTargetEntry),
  };
}

export async function fetchTargetPrj(date: Date): Promise<TargetPrjLocation[]> {
  const { data: envelope } = await axiosClient.get<ApiEnvelope<TargetPrjLocationApi[]>>(
    `${SERVICE}/listOfPropertyTargetPrj/${formatDateForApi(date)}`
  );
  return (unwrap(envelope) ?? []).map(mapTargetLocation);
}

export async function modifyTargetPrj(payload: ModifyTargetPrjPayload): Promise<void> {
  const { data: envelope } = await axiosClient.post<ApiEnvelope<string>>(`${SERVICE}/modifyPropertyTargetPrj`, payload, { keepOnNavigation: true });
  unwrap(envelope);
}
