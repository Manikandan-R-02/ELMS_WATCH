import { IconButton, type IconButtonProps } from "./IconButton";
import { ACTIONS } from "./actionConfig";

type PresetProps = Omit<IconButtonProps, "icon" | "label"> & { label?: string };

function roundedPreset(action: keyof typeof ACTIONS) {
  const { icon, label: defaultLabel, tone: defaultTone } = ACTIONS[action];
  const Preset = ({ label = defaultLabel, tone = defaultTone, ...props }: PresetProps) => (
    <IconButton icon={icon} label={label} tone={tone} {...props} />
  );
  Preset.displayName = `${action[0].toUpperCase()}${action.slice(1)}RoundedButton`;
  return Preset;
}

/** Fully-rounded, icon-only presets — team color convention (see actionConfig.tsx). Always keep `label` meaningful, it's the aria-label. */
export const PlusRoundedButton = roundedPreset("plus");
export const ListRoundedButton = roundedPreset("list");
export const ViewRoundedButton = roundedPreset("view");
export const ModifyRoundedButton = roundedPreset("modify");
export const BulkUploadRoundedButton = roundedPreset("bulkUpload");
export const DownloadRoundedButton = roundedPreset("download");
export const SaveRoundedButton = roundedPreset("save");
export const RefreshRoundedButton = roundedPreset("refresh");
export const CancelRoundedButton = roundedPreset("cancel");
export const DeleteRoundedButton = roundedPreset("delete");
