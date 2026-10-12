import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionExpiredHandler } from "./SessionExpiredHandler";
import { useAuthStore } from "../../store/authStore";
import { SESSION_EXPIRED_EVENT, SESSION_REDIRECT_SECONDS } from "../../lib/sessionEvents";
import { ROUTES } from "../../routes/paths";

function renderHandler() {
  return render(
    <MemoryRouter initialEntries={["/some-screen"]}>
      <Routes>
        <Route path="/some-screen" element={<><p>a protected screen</p><SessionExpiredHandler /></>} />
        <Route path={ROUTES.login} element={<p>the login page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

const fireExpired = () => act(() => void window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT)));

describe("SessionExpiredHandler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    useAuthStore.setState({ isLoggedIn: true, user: { id: "1", name: "A", email: "a@b.c", role: "Admin", initials: "A", resultPK: "5" }, bootstrapping: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows nothing until a request answers 401", () => {
    renderHandler();
    expect(screen.queryByText("Session expired")).not.toBeInTheDocument();
  });

  it("opens the session modal with a 10 second countdown when the event fires", () => {
    expect(SESSION_REDIRECT_SECONDS).toBe(10);
    renderHandler();
    fireExpired();

    expect(screen.getByText("Session expired")).toBeInTheDocument();
    expect(screen.getByText("Redirecting to login in 10s...")).toBeInTheDocument();
    // The user stays on the screen (and signed in) while the modal counts down.
    expect(screen.getByText("a protected screen")).toBeInTheDocument();
    expect(useAuthStore.getState().isLoggedIn).toBe(true);
  });

  it("opens one modal even when several calls fail together", () => {
    renderHandler();
    fireExpired();
    fireExpired();
    fireExpired();

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("logs out and redirects to the login page after 10 seconds", () => {
    renderHandler();
    fireExpired();

    act(() => void vi.advanceTimersByTime(9_000));
    expect(screen.getByText("Redirecting to login in 1s...")).toBeInTheDocument();
    expect(screen.queryByText("the login page")).not.toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(1_000));
    expect(screen.getByText("the login page")).toBeInTheDocument();
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("logs out and redirects straight away on \"Log out now\"", () => {
    renderHandler();
    fireExpired();

    fireEvent.click(screen.getByRole("button", { name: "Log out now" }));

    expect(screen.getByText("the login page")).toBeInTheDocument();
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
  });
});
