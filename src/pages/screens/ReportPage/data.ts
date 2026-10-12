/**
 * Types + the report catalog for the Report Generator screen — the rebuild of the old ElmsWatch
 * app's `views/admin/Report/Report.jsx`. The catalog is not mock data: each `key` is the exact
 * backend method name under `consolidated-python-report-service/pythonReportController/`, copied
 * verbatim from the old screen's `REPORTS` list (including the backend's own spelling, e.g.
 * `creaditJournalConsolidated` — changing it would 404).
 */

export interface ReportDefinition {
  key: string;
  label: string;
}

export const REPORT_CATALOG: ReportDefinition[] = [
  { key: "accountingDetails", label: "Accounting Details - Consolidated" },
  { key: "cashEntry", label: "Cash Entry - Consolidated" },
  { key: "cashMovementConsolidated", label: "Cash Movement - Consolidated" },
  { key: "cashMovementSummaryConsolidated", label: "Cash Movement Summary - Consolidated" },
  { key: "consumptionByCategoryConsolidated", label: "Consumption By Category - Consolidated" },
  { key: "creaditJournalConsolidated", label: "Credit Journal - Consolidated" },
  { key: "cwhInDetailsConsolidated", label: "CWH In Details - Consolidated" },
  { key: "cwhInSummaryConsolidated", label: "CWH In Summary - Consolidated" },
  { key: "cwhOutDetailsConsolidated", label: "CWH Out Details - Consolidated" },
  { key: "cwhOutSummaryConsolidated", label: "CWH Out Summary - Consolidated" },
  { key: "dailySrcDetailsConsolidated", label: "Daily SRC Details - Consolidated" },
  { key: "dailySrcSummaryConsolidated", label: "Daily SRC Summary (All SRC) - Consolidated" },
  { key: "inventoryAnalysisConsolidated", label: "Inventory Analysis Report (A 13) - Consolidated" },
  { key: "itemFullTransactionConsolidated", label: "Item Full Transaction - Consolidated" },
  { key: "locationInDetailsConsolidated", label: "Location In Details - Consolidated" },
  { key: "locationInSummaryConsolidated", label: "Location In Summary - Consolidated" },
  { key: "locationOutDetailsConsolidated", label: "Location Out Details - Consolidated" },
  { key: "locationOutSummaryConsolidated", label: "Location Out Summary - Consolidated" },
  { key: "managementControlConsolidated", label: "Management Control Report - Consolidated" },
  { key: "mandayCostConsolidated", label: "ManDay Cost Report (SRC vs PRJ) - Consolidated" },
  { key: "physicalStockCheckingConsolidated", label: "Physical Stock Checking Form - Consolidated" },
  { key: "physicalStockDiscrepancies", label: "Physical Stock Discrepancies - Consolidated" },
  { key: "prjByCategoryCostConsolidated", label: "PRJ By Category Cost - Consolidated" },
  { key: "prjByCategoryQtyConsolidated", label: "PRJ By Category Qty - Consolidated" },
  { key: "prjByItemCostConsolidated", label: "PRJ By Item Cost - Consolidated" },
  { key: "prjByItemQtyCostConsolidated", label: "PRJ By Item Qty & Cost - Consolidated" },
  { key: "prjDeliveryDetailsConsolidated", label: "PRJ Delivery Details - Consolidated" },
  { key: "prjDeliverySummaryConsolidated", label: "PRJ Delivery Summary By Date Family Id - Consolidated" },
  { key: "prjItemByQuantityConsolidated", label: "PRJ Item By Quantity - Consolidated" },
  { key: "prjReceiveDetailsConsolidated", label: "PRJ Receive Details - Consolidated" },
  { key: "prjReceiveSummaryConsolidated", label: "PRJ Receive Summary Details - Consolidated" },
  { key: "prjSummaryDetailsConsolidated", label: "PRJ Summary Details - Consolidated" },
  { key: "prjSummaryByDateConsolidated", label: "PRJ Summary Details By Date - Consolidated" },
  { key: "stockMovementConsolidated", label: "Stock Movement - Consolidated" },
  { key: "stockReportConsolidated", label: "Stock Report - Consolidated" },
];

/** The three outcomes the old app distinguished: a file was produced, the backend answered but had
 * nothing for that period (no `download_url`), or the request itself failed. */
export type ReportResult =
  | { kind: "success"; downloadUrl: string; filename: string }
  | { kind: "nodata"; message: string }
  | { kind: "error"; message: string };

export interface ReportHistoryEntry {
  id: number;
  reportKey: string;
  reportLabel: string;
  period: Date;
  generatedAt: Date;
  result: ReportResult;
}

/** Old app kept the last 10 generations for the session. */
export const HISTORY_LIMIT = 10;
