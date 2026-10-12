import { useState } from "react";
import { TextButton } from "../components/buttons/TextButton";
import { SuccessModal, FailureModal, WarningModal, SessionModal, InfoModal, ConfirmModal } from "../components/modals/StatusModals";
import { ChangePasswordModal } from "../components/modals/ChangePasswordModal";
import { HelpCenterModal } from "../components/modals/HelpCenterModal";
import { showSuccessToast, showErrorToast, showWarningToast, showInfoToast } from "../store/toastStore";
import { PreviewPage, PreviewSection, ComponentApi } from "./PreviewSection";

type ModalKey = "success" | "failure" | "warning" | "session" | "info" | "confirm" | null;

export function ModalsPreviewPage() {
  const [open, setOpen] = useState<ModalKey>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [helpCenterOpen, setHelpCenterOpen] = useState(false);

  return (
    <PreviewPage title="Modals" description="Preset status modals with a shared base — pass any custom content as children.">
      <PreviewSection title="Trigger a modal">
        <div className="flex flex-wrap gap-3">
          <TextButton tone="success" onClick={() => setOpen("success")}>Success</TextButton>
          <TextButton tone="danger" onClick={() => setOpen("failure")}>Failure</TextButton>
          <TextButton tone="warning" onClick={() => setOpen("warning")}>Warning</TextButton>
          <TextButton variant="outline" tone="neutral" onClick={() => setOpen("session")}>Session</TextButton>
          <TextButton onClick={() => setOpen("info")}>Info</TextButton>
          <TextButton variant="outline" onClick={() => setOpen("confirm")}>Confirm</TextButton>
        </div>
        <ComponentApi
          importCode={'import {\n  SuccessModal, FailureModal, WarningModal,\n  InfoModal, SessionModal, ConfirmModal,\n} from "../components/modals/StatusModals";'}
          props={[
            { name: "open / onClose", type: "boolean / () => void", description: "Controlled visibility — every preset shares this contract." },
            { name: "title", type: "string", description: "Has a sensible default per preset — override for context. Renders as a bold heading below the floating icon badge." },
            { name: "children", type: "ReactNode", description: "The message body — pass any custom content." },
            { name: "banner", type: "ReactNode", description: "A short, high-visibility callout rendered as a tone-tinted pill below the message (see the Success demo)." },
            { name: "details", type: "{ label, value }[]", description: "Extra facts rendered as a two-column grid (date/time-style key info)." },
            { name: "list", type: "{ heading, items: { label, sublabel? }[] }", description: "A named list of avatar rows below details (e.g. attendees)." },
            { name: "footer", type: "ReactNode", description: "Overrides the default full-width pill action button(s) entirely." },
            { name: "primaryActionLabel / onPrimaryAction", type: "string / () => void", description: "Success/Failure/Warning/Info." },
            { name: "onExpire, countdownSeconds, logoutLabel", type: "—", description: "SessionModal only — no \"stay signed in\" option; counts down (default 7s) with a shrinking progress bar, then calls onExpire. The footer is a single logoutLabel button (default \"Log out now\")." },
            { name: "onConfirm, confirmLabel, cancelLabel, tone", type: "—", description: "ConfirmModal only — tone: \"brand\" (default, blue) | \"purple\" | \"danger\"." },
          ]}
        />
      </PreviewSection>

      <PreviewSection
        title="Change password"
        description="A real feature modal (not a generic preset) — opened from the header's profile menu, wired to the login-credential-service. Submitting here will actually attempt the request and, on success, sign you out."
      >
        <TextButton variant="outline" onClick={() => setChangePasswordOpen(true)}>
          Change password
        </TextButton>
        <ComponentApi
          importCode={'import { ChangePasswordModal } from "../components/modals/ChangePasswordModal";'}
          props={[
            { name: "open / onClose", type: "boolean / () => void", description: "Controlled visibility, same contract as the status modal presets." },
          ]}
        />
      </PreviewSection>

      <PreviewSection
        title="Help center"
        description="App-wide orientation tips (not page-specific) — opened from the header's help icon, everywhere in the app."
      >
        <TextButton variant="outline" onClick={() => setHelpCenterOpen(true)}>
          Open help center
        </TextButton>
        <ComponentApi
          importCode={'import { HelpCenterModal } from "../components/modals/HelpCenterModal";'}
          props={[
            { name: "open / onClose", type: "boolean / () => void", description: "Controlled visibility, same contract as the status modal presets." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Toast notifications" description="Same color language as the modals above — success (green), error (red), warning (yellow), info (blue). Solid, dark-toned pills with white text.">
        <div className="flex flex-wrap gap-3">
          <TextButton tone="success" onClick={() => showSuccessToast("Saved successfully", "Your changes have been saved.")}>Success toast</TextButton>
          <TextButton tone="danger" onClick={() => showErrorToast("Something went wrong", "Please try that again.")}>Error toast</TextButton>
          <TextButton tone="warning" onClick={() => showWarningToast("Heads up", "This action is difficult to undo.")}>Warning toast</TextButton>
          <TextButton onClick={() => showInfoToast("Did you know?", "You can customize any toast's content.")}>Info toast</TextButton>
        </div>
        <ComponentApi
          importCode={'import {\n  showSuccessToast, showErrorToast,\n  showWarningToast, showInfoToast,\n} from "../store/toastStore";\n\nshowSuccessToast("Saved", "Your changes have been saved.");'}
          props={[
            { name: "title", type: "string", description: "First argument — required." },
            { name: "description", type: "string", description: "Second argument — optional supporting text." },
            { name: "duration", type: "number (ms)", default: "3000", description: "Not exposed on the helper functions — pass via useToastStore.getState().push() directly for a custom duration." },
          ]}
        />
      </PreviewSection>

      <SuccessModal
        open={open === "success"}
        onClose={() => setOpen(null)}
        title="Your meeting has been scheduled"
        banner="Check your inbox — we've sent an email with the details."
        details={[
          { label: "Date", value: "Mon, 11 November" },
          { label: "Time Zone", value: "PST | GMT-8" },
          { label: "Time", value: "11:00am - 11:30am" },
          { label: "Location", value: "Online Remote" },
        ]}
        list={{
          heading: "Attendees",
          items: [
            { label: "Arnold Wisozk" },
            { label: "Irvin Satterfield" },
            { label: "Ira Ledner" },
            { label: "Jenny Mueller" },
          ],
        }}
        primaryActionLabel="Edit Details"
      >
        Your order <strong>#10234</strong> has been placed successfully.
      </SuccessModal>
      <FailureModal open={open === "failure"} onClose={() => setOpen(null)} onPrimaryAction={() => setOpen(null)}>
        We couldn't process your payment. Please check your card details and try again.
      </FailureModal>
      <WarningModal open={open === "warning"} onClose={() => setOpen(null)} onPrimaryAction={() => setOpen(null)}>
        Deleting this record will also remove <strong>12 related items</strong>. This cannot be undone.
      </WarningModal>
      <SessionModal
        open={open === "session"}
        onClose={() => setOpen(null)}
        onExpire={() => {
          setOpen(null);
          showInfoToast("Redirecting to login", "This demo doesn't actually navigate away.");
        }}
      />
      <InfoModal open={open === "info"} onClose={() => setOpen(null)}>
        You can customize any of these modals by passing your own content, footer, and action labels.
      </InfoModal>
      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
      <HelpCenterModal open={helpCenterOpen} onClose={() => setHelpCenterOpen(false)} />

      <ConfirmModal
        open={open === "confirm"}
        onClose={() => setOpen(null)}
        onConfirm={() => {
          setOpen(null);
          showSuccessToast("Confirmed");
        }}
      >
        Publishing this change will make it visible to every user immediately. Continue?
      </ConfirmModal>
    </PreviewPage>
  );
}
