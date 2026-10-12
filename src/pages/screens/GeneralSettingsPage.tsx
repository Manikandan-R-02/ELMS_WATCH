import { useState } from "react";
import { CircleDollarSign, Globe2, Package, Settings2, Sparkles } from "lucide-react";
import { Card } from "../../components/cards/Card";
import { PageHeader } from "../../components/common/PageHeader";
import { SelectSearch } from "../../components/fields/SelectSearch";
import { SaveSlideButton, RefreshSlideButton } from "../../components/buttons/SlideButton";
import { SaveRoundedButton, RefreshRoundedButton } from "../../components/buttons/ActionRoundedButtons";
import { showSuccessToast } from "../../store/toastStore";
import { useOnboarding } from "../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../hooks/useRegisterScreenTour";
import { generalSettingsTourSteps } from "../../components/onboarding/screenSteps/generalSettings";
import {
  useNumberFormatStore,
  NUMBER_FORMAT_LOCALES,
  DECIMAL_PLACE_OPTIONS,
  DEFAULT_NUMBER_FORMAT_SETTINGS,
  type NumberFormatSettings,
} from "../../store/numberFormatStore";
import { HelpModal } from "../../components/modals/HelpModal";

const SAMPLE_AMOUNT = 1234567.891;
const SAMPLE_QTY = 1234.5678;

const DECIMAL_SELECT_OPTIONS = DECIMAL_PLACE_OPTIONS.map((d) => ({ label: String(d), value: d }));

const USAGE_STEPS = [
  { q: "What does this page control?", a: "The comma-separator style and decimal precision used for every amount/quantity across the app — set once, applied everywhere." },
  { q: "How do I preview a change before saving?", a: "Pick a separator style or decimal count on the left — the solid pills below update instantly, before anything is saved." },
  { q: "How do I apply it everywhere?", a: 'Click Save (top right). Every screen that formats a number reads from this same setting immediately.' },
  { q: "How do I undo my changes?", a: "Click Reset to restore the Indian default, or just navigate away without saving — nothing changes until you click Save." },
];

/**
 * The app-wide number-format preference — every amount/quantity on every
 * other screen renders through `formatAmount`/`formatQty` (see
 * store/numberFormatStore.ts), so a change here is meant to apply everywhere,
 * not just to this page.
 *
 * Currently localStorage-only (no backend endpoint exists for this setting —
 * see ELmsWatch/src/utils/numFormatter.js, which is the same: pure
 * localStorage, no API). When a real endpoint is available, swap the
 * `setSettings`/`reset` calls below for an axiosClient/createResourceStore
 * call — the store's public shape (`NumberFormatSettings`) won't need to
 * change, only where `handleSave`/`handleReset` persist it.
 *
 * Deliberately compact top-to-bottom (small hero, tight spacing, small solid
 * preview pills instead of full stat cards) so the whole screen fits without
 * scrolling on a typical laptop viewport — this is a one-off settings form,
 * not content meant to be read at length.
 */
export function GeneralSettingsPage() {
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(() => startScreenTour(generalSettingsTourSteps));
  const stored = useNumberFormatStore();
  const [draft, setDraft] = useState<NumberFormatSettings>({
    locale: stored.locale,
    amountDecimals: stored.amountDecimals,
    qtyDecimals: stored.qtyDecimals,
  });
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const dirty =
    draft.locale !== stored.locale ||
    draft.amountDecimals !== stored.amountDecimals ||
    draft.qtyDecimals !== stored.qtyDecimals;

  function patch(next: Partial<NumberFormatSettings>) {
    setDraft((prev) => ({ ...prev, ...next }));
  }

  async function handleSave() {
    setSaving(true);
    // No network round-trip yet (see header comment) — the brief delay keeps
    // the button's loading state honest about future async behavior instead
    // of flashing instantly, and avoids the UI looking like nothing happened.
    await new Promise((r) => setTimeout(r, 300));
    useNumberFormatStore.getState().setSettings(draft);
    setSaving(false);
    showSuccessToast("Settings saved", "Number formatting has been updated across the app.");
  }

  async function handleReset() {
    setResetting(true);
    await new Promise((r) => setTimeout(r, 300));
    useNumberFormatStore.getState().reset();
    setDraft(DEFAULT_NUMBER_FORMAT_SETTINGS);
    setResetting(false);
    showSuccessToast("Settings reset", "Number formatting has been restored to the default.");
  }

  const previewAmount = SAMPLE_AMOUNT.toLocaleString(draft.locale, {
    minimumFractionDigits: draft.amountDecimals,
    maximumFractionDigits: draft.amountDecimals,
  });
  const previewQty = SAMPLE_QTY.toLocaleString(draft.locale, {
    minimumFractionDigits: draft.qtyDecimals,
    maximumFractionDigits: draft.qtyDecimals,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Settings2}
        title="General Settings"
        dataTour="general-settings-header"
        badge={{ icon: Globe2, label: "Applies across all screens" }}
        onHelp={() => setHelpOpen(true)}
        actions={
          <>
            {/* Slide buttons need room to expand on hover — on small screens (no
                hover, less width) show the fully-rounded icon-only presets instead. */}
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <RefreshRoundedButton label="Reset" onClick={handleReset} disabled={saving || resetting} variant="outline" />
              <SaveRoundedButton label="Save" onClick={handleSave} disabled={!dirty || saving || resetting} />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <RefreshSlideButton label="Reset" onClick={handleReset} disabled={saving || resetting} />
              <SaveSlideButton onClick={handleSave} disabled={!dirty || saving || resetting} />
            </div>
          </>
        }
      />

      <Card data-tour="general-settings">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SelectSearch
            label="Comma separator style"
            options={NUMBER_FORMAT_LOCALES}
            value={draft.locale}
            onChange={(v) => patch({ locale: v ?? DEFAULT_NUMBER_FORMAT_SETTINGS.locale })}
            clearable={false}
          />
          <SelectSearch
            label="Amount decimal places"
            options={DECIMAL_SELECT_OPTIONS}
            value={draft.amountDecimals}
            onChange={(v) => patch({ amountDecimals: v ?? DEFAULT_NUMBER_FORMAT_SETTINGS.amountDecimals })}
            clearable={false}
          />
          <SelectSearch
            label="Quantity decimal places"
            options={DECIMAL_SELECT_OPTIONS}
            value={draft.qtyDecimals}
            onChange={(v) => patch({ qtyDecimals: v ?? DEFAULT_NUMBER_FORMAT_SETTINGS.qtyDecimals })}
            clearable={false}
          />
        </div>

        <div className="mt-4" data-tour="general-settings-preview">
          <p className="text-eyebrow flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Live preview
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-soft">
              <CircleDollarSign className="h-3.5 w-3.5" />
              Amount: {previewAmount}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-soft">
              <Package className="h-3.5 w-3.5" />
              Quantity: {previewQty}
            </span>
            {!dirty && <span className="text-caption ml-1 self-center">Up to date — no unsaved changes.</span>}
          </div>
        </div>
      </Card>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} onShowTour={() => startScreenTour(generalSettingsTourSteps)} steps={USAGE_STEPS} />
    </div>
  );
}
