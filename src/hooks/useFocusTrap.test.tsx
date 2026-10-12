import { useRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFocusTrap } from "./useFocusTrap";

function Harness({ active = true, onEscape, withButtons = true }: Readonly<{ active?: boolean; onEscape?: () => void; withButtons?: boolean }>) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(active, ref, { onEscape });
  return (
    <div>
      <button>outside</button>
      <div ref={ref} tabIndex={-1} data-testid="trap">
        {withButtons && (
          <>
            <button>first</button>
            <button>last</button>
          </>
        )}
      </div>
    </div>
  );
}

const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

describe("useFocusTrap", () => {
  // jsdom has no layout, so every element reports no rectangles and would count as hidden.
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
  });
  afterEach(() => vi.restoreAllMocks());

  it("moves focus into the container and wraps Tab and Shift+Tab at the ends", async () => {
    render(<Harness />);
    await frame();
    const first = screen.getByText("first");
    const last = screen.getByText("last");
    expect(screen.getByTestId("trap")).toHaveFocus();

    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(first).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });

  it("sends Tab from the container itself to the first or last control", async () => {
    render(<Harness />);
    await frame();
    screen.getByTestId("trap").focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(screen.getByText("first")).toHaveFocus();
    screen.getByTestId("trap").focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(screen.getByText("last")).toHaveFocus();
  });

  it("keeps focus on the container when there is nothing focusable inside", async () => {
    render(<Harness withButtons={false} />);
    await frame();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(screen.getByTestId("trap")).toHaveFocus();
  });

  it("leaves Tab alone when focus is outside the container", async () => {
    render(<Harness />);
    await frame();
    screen.getByText("outside").focus();
    const event = new KeyboardEvent("keydown", { key: "Tab", cancelable: true, bubbles: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it("calls onEscape for Escape, and ignores other keys", async () => {
    const onEscape = vi.fn();
    render(<Harness onEscape={onEscape} />);
    await frame();
    fireEvent.keyDown(document, { key: "a" });
    expect(onEscape).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("restores focus to the previously focused element when released", async () => {
    const { rerender } = render(<Harness active={false} />);
    screen.getByText("outside").focus();
    rerender(<Harness active />);
    await frame();
    expect(screen.getByTestId("trap")).toHaveFocus();
    rerender(<Harness active={false} />);
    expect(screen.getByText("outside")).toHaveFocus();
  });
});
