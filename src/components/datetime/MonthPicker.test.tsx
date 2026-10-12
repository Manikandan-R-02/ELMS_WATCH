import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MonthPicker } from "./MonthPicker";

const SEPT_2026 = new Date(2026, 8, 1);

function setup(onChange = vi.fn()) {
  function Harness() {
    const [value, setValue] = useState<Date | null>(SEPT_2026);
    return (
      <>
        <MonthPicker
          label="Period"
          value={value}
          onChange={(d) => {
            setValue(d);
            onChange(d);
          }}
        />
        <button type="button">Next field</button>
      </>
    );
  }
  render(<Harness />);
  return { user: userEvent.setup(), input: screen.getByRole("combobox", { name: "Period" }), onChange };
}

const highlighted = (input: HTMLElement) => document.getElementById(input.getAttribute("aria-activedescendant") ?? "");

describe("MonthPicker keyboard", () => {
  it("opens on focus with the current month highlighted", async () => {
    const { user, input } = setup();
    await user.click(input);
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(highlighted(input)).toHaveAccessibleName("September 2026");
  });

  it("moves with arrows and picks with Enter", async () => {
    const { user, input, onChange } = setup();
    await user.click(input);
    await user.keyboard("{ArrowRight}");
    expect(highlighted(input)).toHaveAccessibleName("October 2026");
    await user.keyboard("{ArrowDown}"); // one row = +3 months
    expect(highlighted(input)).toHaveAccessibleName("January 2027");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(new Date(2027, 0, 1));
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("jumps a year with Page Up / Page Down", async () => {
    const { user, input, onChange } = setup();
    await user.click(input);
    await user.keyboard("{PageDown}{PageDown}{PageUp}");
    expect(highlighted(input)).toHaveAccessibleName("September 2027");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(new Date(2027, 8, 1));
  });

  it("browsing with arrows then Escape changes nothing", async () => {
    const { user, input, onChange } = setup();
    await user.click(input);
    await user.keyboard("{ArrowLeft}{ArrowLeft}{Escape}");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("September 2026");
  });

  it("reopens from the keyboard with ArrowDown after Escape", async () => {
    const { user, input } = setup();
    await user.click(input);
    await user.keyboard("{Escape}");
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("closes when tabbing away, even with half-typed text", async () => {
    const { user, input } = setup();
    await user.click(input);
    await user.clear(input);
    await user.type(input, "1");
    await user.tab();
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Next field" })).toHaveFocus();
    expect(input).toHaveValue("September 2026");
  });

  it("still accepts a typed mm/yyyy value", async () => {
    const { user, input, onChange } = setup();
    await user.click(input);
    await user.clear(input);
    await user.type(input, "032025{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(new Date(2025, 2, 1));
  });
});
