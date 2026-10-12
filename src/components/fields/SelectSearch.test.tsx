import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SelectSearch } from "./SelectSearch";

const OPTIONS = [
  { label: "Cash Entry", value: "cashEntry" },
  { label: "Cash Movement", value: "cashMovement" },
  { label: "Stock Report", value: "stockReport" },
];

function setup(props: Partial<{ searchable: boolean; autoFocusSearch: boolean }> = {}, onChange = vi.fn()) {
  function Harness() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <>
        <SelectSearch
          label="Report"
          options={OPTIONS}
          value={value}
          onChange={(v) => {
            setValue(v);
            onChange(v);
          }}
          {...props}
        />
        <button type="button">Next field</button>
      </>
    );
  }
  render(<Harness />);
  return { user: userEvent.setup(), trigger: screen.getByRole("button", { name: "Report" }), onChange };
}

describe("SelectSearch keyboard", () => {
  it("search, arrow, Enter picks — and focus comes back to the trigger", async () => {
    const { user, trigger, onChange } = setup();
    trigger.focus();
    await user.keyboard("{Enter}");
    const search = await screen.findByRole("textbox", { name: "Search..." });
    await vi.waitFor(() => expect(search).toHaveFocus());
    await user.keyboard("cash{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("cashMovement");
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveTextContent("Cash Movement");
  });

  it("Escape closes and returns focus to the trigger instead of dropping it", async () => {
    const { user, trigger } = setup();
    trigger.focus();
    await user.keyboard("{Enter}");
    await vi.waitFor(() => expect(screen.getByRole("textbox", { name: "Search..." })).toHaveFocus());
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("Tab from the open search box closes it and moves on to the next field", async () => {
    const { user, trigger } = setup();
    trigger.focus();
    await user.keyboard("{Enter}");
    await vi.waitFor(() => expect(screen.getByRole("textbox", { name: "Search..." })).toHaveFocus());
    await user.tab();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next field" })).toHaveFocus();
  });

  it("works from the trigger alone when there's no search box", async () => {
    const { user, trigger, onChange } = setup({ searchable: false });
    trigger.focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("stockReport");
    expect(trigger).toHaveFocus();
  });

  it("works from the trigger with autoFocusSearch off, and typing moves into the search box", async () => {
    const { user, trigger, onChange } = setup({ autoFocusSearch: false });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("stock");
    expect(screen.getByRole("textbox", { name: "Search..." })).toHaveValue("stock");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("stockReport");
  });
});
