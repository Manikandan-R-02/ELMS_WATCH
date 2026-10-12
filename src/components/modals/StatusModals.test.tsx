import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmModal, FailureModal, InfoModal, SessionModal, SuccessModal, WarningModal } from "./StatusModals";

const DETAILS = [{ label: "Location", value: "Chennai" }];
const LIST = { heading: "People", items: [{ label: "asha", sublabel: "admin" }, { label: "ravi" }] };

describe("status modals", () => {
  it("SuccessModal shows defaults, extras, and closes or acts from its footer", () => {
    const onClose = vi.fn();
    const onPrimaryAction = vi.fn();
    render(<SuccessModal open onClose={onClose} banner="Saved" details={DETAILS} list={LIST} onPrimaryAction={onPrimaryAction} />);
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Your changes were saved successfully.")).toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("Chennai")).toBeInTheDocument();
    expect(screen.getByText("People")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Close" }).at(-1)!);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalled();
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
  });

  it("SuccessModal falls back to onClose for its primary button and accepts a custom footer", () => {
    const onClose = vi.fn();
    const { rerender } = render(<SuccessModal open onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalled();
    rerender(<SuccessModal open onClose={onClose} footer={<button>Custom</button>} />);
    expect(screen.getByRole("button", { name: "Custom" })).toBeInTheDocument();
  });

  it("FailureModal shows the retry action", () => {
    const onPrimaryAction = vi.fn();
    render(<FailureModal open onClose={vi.fn()} banner="Oops" onPrimaryAction={onPrimaryAction} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Oops")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onPrimaryAction).toHaveBeenCalled();
  });

  it("WarningModal shows cancel and continue", () => {
    const onClose = vi.fn();
    const onPrimaryAction = vi.fn();
    render(<WarningModal open onClose={onClose} banner="Careful" onPrimaryAction={onPrimaryAction} />);
    expect(screen.getByText("Careful")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onClose).toHaveBeenCalled();
    expect(onPrimaryAction).toHaveBeenCalled();
  });

  it("InfoModal has a single acknowledge button and optional extras", () => {
    const onClose = vi.fn();
    render(<InfoModal open onClose={onClose} banner="FYI" details={DETAILS} />);
    expect(screen.getByText("FYI")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("ignores empty details and list", () => {
    render(<InfoModal open onClose={vi.fn()} details={[]} list={{ heading: "Nobody", items: [] }} />);
    expect(screen.queryByText("Nobody")).not.toBeInTheDocument();
  });

  it("ConfirmModal confirms, cancels, and disables both buttons while loading", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const { rerender } = render(<ConfirmModal open onClose={onClose} onConfirm={onConfirm} tone="danger" banner="Irreversible" />);
    expect(screen.getByText("Irreversible")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    rerender(<ConfirmModal open onClose={onClose} onConfirm={onConfirm} loading confirmLabel="Delete" cancelLabel="Back" />);
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });
});

describe("SessionModal", () => {
  afterEach(() => vi.useRealTimers());

  it("counts down once a second and calls onExpire at zero", () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    render(<SessionModal open onClose={vi.fn()} onExpire={onExpire} countdownSeconds={3} banner="Idle" />);
    expect(screen.getByText("Redirecting to login in 3s...")).toBeInTheDocument();
    expect(screen.getByText("Idle")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("Redirecting to login in 2s...")).toBeInTheDocument();
    expect(onExpire).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onExpire).toHaveBeenCalled();
  });

  it("logs out immediately from the footer button and does nothing while closed", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const onExpire = vi.fn();
    const { rerender } = render(<SessionModal open onClose={onClose} onExpire={onExpire} logoutLabel="Sign out" />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(onClose).toHaveBeenCalled();
    rerender(<SessionModal open={false} onClose={onClose} onExpire={onExpire} />);
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(onExpire).not.toHaveBeenCalled();
  });
});
