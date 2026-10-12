import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

function setup({ onConfirm = vi.fn() } = {}) {
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open dialog
        </button>
        <button type="button">Page button behind</button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          onEnter={() => {
            onConfirm();
            setOpen(false);
          }}
          title="Download report?"
          footer={
            <>
              <button type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  setOpen(false);
                }}
              >
                Download
              </button>
            </>
          }
        >
          <input aria-label="Note" />
        </Modal>
      </>
    );
  }
  render(<Harness />);
  return { user: userEvent.setup(), onConfirm };
}

describe("Modal keyboard", () => {
  it("puts the cursor in the first field when it opens (not on the Close button)", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Note" })).toHaveFocus());
  });

  it("a dialog with no field focuses the dialog itself", async () => {
    render(
      <Modal open onClose={() => {}} title="Sure?" footer={<button type="button">OK</button>}>
        <p>Nothing to fill in.</p>
      </Modal>
    );
    await waitFor(() => expect(screen.getByRole("dialog", { name: "Sure?" })).toHaveFocus());
  });

  it("keeps Tab inside the dialog instead of reaching the page behind it", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
    // Close (x) -> Note -> Cancel -> Download -> wraps back to Close.
    for (let i = 0; i < 6; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    await user.tab({ shift: true });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("Enter on a focused Cancel only cancels — it must not also confirm", async () => {
    const { user, onConfirm } = setup();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    screen.getByRole("button", { name: "Cancel" }).focus();
    await user.keyboard("{Enter}");
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Enter in the focused first field confirms", async () => {
    const { user, onConfirm } = setup();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Note" })).toHaveFocus());
    await user.keyboard("{Enter}");
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("Escape closes it and returns focus to the button that opened it", async () => {
    const { user } = setup();
    const opener = screen.getByRole("button", { name: "Open dialog" });
    await user.click(opener);
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Note" })).toHaveFocus());
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
