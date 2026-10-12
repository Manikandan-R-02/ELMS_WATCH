import { TextButton, type TextButtonProps } from "./TextButton";
import { ACTIONS } from "./actionConfig";

type PresetProps = Omit<TextButtonProps, "children" | "leadingIcon"> & { label?: string };

function textPreset(action: keyof typeof ACTIONS) {
  const { icon: Icon, label: defaultLabel, tone: defaultTone } = ACTIONS[action];
  const Preset = ({ label = defaultLabel, tone = defaultTone, ...props }: PresetProps) => (
    <TextButton leadingIcon={<Icon className="h-4 w-4" />} tone={tone} {...props}>
      {label}
    </TextButton>
  );
  Preset.displayName = `${action[0].toUpperCase()}${action.slice(1)}TextButton`;
  return Preset;
}

/** Team color convention (see actionConfig.tsx) — pass `tone`/`variant`/`label` to override for a one-off screen. */
export const PlusTextButton = textPreset("plus");
export const ListTextButton = textPreset("list");
export const ViewTextButton = textPreset("view");
export const ModifyTextButton = textPreset("modify");
export const BulkUploadTextButton = textPreset("bulkUpload");
export const DownloadTextButton = textPreset("download");
export const SaveTextButton = textPreset("save");
export const RefreshTextButton = textPreset("refresh");
export const CancelTextButton = textPreset("cancel");
export const DeleteTextButton = textPreset("delete");
