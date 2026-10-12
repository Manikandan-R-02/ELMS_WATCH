import type { ReactNode } from "react";
import { Compass } from "lucide-react";
import { TextButton } from "../buttons/TextButton";
import { InfoModal } from "./StatusModals";

export interface HelpStep {
  q: string;
  a: ReactNode;
}

export interface HelpModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after the modal closes itself, when the reader picks "Show tour". */
  onShowTour: () => void;
  steps: readonly HelpStep[];
}

/** The "How to use this screen" help dialog every screen shows: a Q&A list plus "Show tour" / "Got it". */
export function HelpModal({ open, onClose, onShowTour, steps }: Readonly<HelpModalProps>) {
  return (
    <InfoModal
      open={open}
      onClose={onClose}
      title="How to use this screen"
      primaryActionLabel="Got it"
      footer={
        <>
          <TextButton
            variant="outline"
            tone="neutral"
            size="lg"
            className="flex-1 rounded-full"
            leadingIcon={<Compass className="h-4 w-4" />}
            onClick={() => {
              onClose();
              onShowTour();
            }}
          >
            Show tour
          </TextButton>
          <TextButton size="lg" className="flex-1 rounded-full" onClick={onClose}>
            Got it
          </TextButton>
        </>
      }
    >
      <dl className="space-y-3">
        {steps.map((step) => (
          <div key={step.q}>
            <dt className="text-sm font-semibold text-slate-800 dark:text-slate-100">{step.q}</dt>
            <dd className="text-body-sm mt-0.5">{step.a}</dd>
          </div>
        ))}
      </dl>
    </InfoModal>
  );
}
