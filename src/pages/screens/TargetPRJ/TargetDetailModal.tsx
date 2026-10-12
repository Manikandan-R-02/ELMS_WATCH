import { Target } from "lucide-react";
import { Modal } from "../../../components/modals/Modal";
import { NumberInput } from "../../../components/fields/NumberInput";
import { Table, type Column } from "../../../components/table/Table";
import { RefreshTextButton, SaveTextButton } from "../../../components/buttons/ActionTextButtons";
import { valueKey } from "./data";
import type { TargetPrjEntry, TargetPrjLocation } from "./data";

export interface TargetDetailModalProps {
  open: boolean;
  location: TargetPrjLocation | null;
  editedValues: Record<string, number | "">;
  originalValues: Record<string, number | "">;
  saving: boolean;
  onValueChange: (locationId: string, prjId: string, value: number | "") => void;
  onReset: (locationId: string) => void;
  onSave: (locationId: string) => void;
  onClose: () => void;
}

export function TargetDetailModal({
  open,
  location,
  editedValues,
  originalValues,
  saving,
  onValueChange,
  onReset,
  onSave,
  onClose,
}: Readonly<TargetDetailModalProps>) {
  if (!location) return null;

  const dirtyCount = location.targetPrjList.filter(
    (prj) =>
      editedValues[valueKey(location.locationId, prj.prjId)] !==
      originalValues[valueKey(location.locationId, prj.prjId)]
  ).length;

  // A real table (gradient header, zebra rows, borders — same as every other data grid in the
  // app) instead of a plain list of bordered boxes, so this modal reads at least as well as the
  // old app's own two-column "PRJ / SRC & Target Value" layout without hand-rolling a one-off grid.
  const columns: Column<TargetPrjEntry>[] = [
    {
      key: "prjId",
      header: "PRJ / SRC",
      render: (prj) => <span className="font-semibold text-amber-600 dark:text-amber-400">{prj.prjId}</span>,
    },
    {
      key: "targetValue",
      header: "Target Value",
      align: "right",
      render: (prj) => {
        const key = valueKey(location.locationId, prj.prjId);
        const value = editedValues[key] ?? "";
        const isDirty = editedValues[key] !== originalValues[key];
        return (
          <NumberInput
            value={value}
            onChange={(v) => onValueChange(location.locationId, prj.prjId, v)}
            // Selects the field's whole contents the moment it's focused — without this, an
            // existing value (even the placeholder-like "0" the backend sends for an unset
            // target) sits in front of the cursor, so the first digit typed lands *next to* it
            // ("05") instead of *replacing* it. Selecting on focus makes typing immediately
            // overwrite whatever was there, same as a spreadsheet cell.
            onFocus={(e) => e.currentTarget.select()}
            allowDecimal
            allowNegative
            placeholder="0.000"
            containerClassName="ml-auto w-32"
            className={isDirty ? "border-yellow-400 text-right dark:border-yellow-500" : "text-right"}
          />
        );
      },
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <Target className="h-4 w-4" />
        </span>
      }
      title={
        <div>
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">PRJ / SRC &amp; Target Value</p>
          <p className="text-body-sm mt-0.5">
            {location.locationId} · {location.locationName}
          </p>
        </div>
      }
      size="lg"
      footer={
        <>
          <RefreshTextButton
            data-tour="target-prj-modal-reset"
            label="Reset"
            onClick={() => onReset(location.locationId)}
            disabled={saving || dirtyCount === 0}
          />
          <SaveTextButton data-tour="target-prj-modal-save" label="Update" onClick={() => onSave(location.locationId)} disabled={saving || dirtyCount === 0} loading={saving} />
        </>
      }
    >
      {location.targetPrjList.length === 0 ? (
        <p className="text-body-sm">No PRJ / SRC target entries for this location in the selected period.</p>
      ) : (
        <div data-tour="target-prj-modal-table">
          <Table columns={columns} data={location.targetPrjList} rowKey={(prj) => prj.prjId} />
        </div>
      )}
    </Modal>
  );
}
