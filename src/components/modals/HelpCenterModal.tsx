import { RotateCcw } from "lucide-react";
import { InfoModal } from "./StatusModals";
import { TextButton } from "../buttons/TextButton";
import { useOnboarding } from "../../hooks/useOnboarding";

export interface HelpCenterModalProps {
  open: boolean;
  onClose: () => void;
}

const TIPS = [
  { q: "How do I switch between light and dark mode?", a: "Click the sun/moon icon in the header — it follows your system theme by default until you override it." },
  { q: "How do I change the accent color or layout?", a: "Click the gear icon in the header to open Appearance settings — accent color, corner radius, card style, and sidebar orientation." },
  { q: "How do I pick a reporting month?", a: "Use the month picker in the header — every data screen reads the same selected month, so you only set it once." },
  { q: "Where do I change number formatting?", a: "General Settings in the sidebar — separator style and decimal precision apply to every amount/quantity across the app." },
  { q: "How do I jump to a page quickly?", a: 'Click "Jump to..." in the header, or press Ctrl/Cmd+K from anywhere, and start typing a page name.' },
  { q: "How do I log out safely?", a: "Use the profile menu or the sidebar's Log out button — you'll be asked to confirm before it signs you out." },
];

/**
 * App-wide help — not page-specific tips like GeneralSettingsPage's own "How
 * to use this page" modal, but a general orientation guide for the whole
 * application. Opened from the header (see Header.tsx) so it's reachable
 * from anywhere. Also the app's one "Help menu" entry point, so the guided
 * product tour's restart action lives here rather than a new UI surface.
 */
export function HelpCenterModal({ open, onClose }: Readonly<HelpCenterModalProps>) {
  const { startTour } = useOnboarding();

  return (
    <InfoModal
      open={open}
      onClose={onClose}
      title="Help center"
      primaryActionLabel="Got it"
      footer={
        <>
          <TextButton
            variant="outline"
            tone="neutral"
            size="lg"
            className="flex-1 rounded-full"
            leadingIcon={<RotateCcw className="h-4 w-4" />}
            onClick={() => {
              onClose();
              startTour();
            }}
          >
            Restart tour
          </TextButton>
          <TextButton size="lg" className="flex-1 rounded-full" onClick={onClose}>
            Got it
          </TextButton>
        </>
      }
    >
      <dl className="space-y-3">
        {TIPS.map((tip) => (
          <div key={tip.q}>
            <dt className="text-sm font-semibold text-slate-800 dark:text-slate-100">{tip.q}</dt>
            <dd className="text-body-sm mt-0.5">{tip.a}</dd>
          </div>
        ))}
      </dl>
    </InfoModal>
  );
}
