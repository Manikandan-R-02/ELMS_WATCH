import { useRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFocusFirstInput } from "./useFocusFirstInput";

function Harness({ ready }: Readonly<{ ready: boolean }>) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusFirstInput(ref, ready);
  return (
    <div>
      <input aria-label="search" />
      <div ref={ref}>
        <input aria-label="locked" disabled />
        <input aria-label="first" defaultValue="12.5" />
        <input aria-label="second" />
      </div>
    </div>
  );
}

describe("useFocusFirstInput", () => {
  it("does nothing until the data is ready", async () => {
    render(<Harness ready={false} />);
    await new Promise((r) => setTimeout(r, 50));
    expect(document.body).toHaveFocus();
  });

  it("focuses (and selects) the first enabled input inside the container once ready", async () => {
    const { rerender } = render(<Harness ready={false} />);
    rerender(<Harness ready />);
    const first = screen.getByLabelText("first") as HTMLInputElement;
    await waitFor(() => expect(first).toHaveFocus());
    expect(first.selectionStart).toBe(0);
    expect(first.selectionEnd).toBe(4);
  });

  it("does take focus from a link or button left focused by the menu click that opened the screen", async () => {
    const { rerender } = render(
      <>
        <a href="#x" aria-label="menu link">
          Productivity
        </a>
        <Harness ready={false} />
      </>
    );
    screen.getByLabelText("menu link").focus();
    rerender(
      <>
        <a href="#x" aria-label="menu link">
          Productivity
        </a>
        <Harness ready />
      </>
    );
    await waitFor(() => expect(screen.getByLabelText("first")).toHaveFocus());
  });

  it("never steals focus from a field the person is already typing in", async () => {
    const { rerender } = render(<Harness ready={false} />);
    screen.getByLabelText("search").focus();
    rerender(<Harness ready />);
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByLabelText("search")).toHaveFocus();
  });
});
