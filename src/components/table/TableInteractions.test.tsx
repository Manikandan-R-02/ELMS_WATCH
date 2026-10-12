import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Table, type Column } from "./Table";

interface Row {
  id: number;
  name: string;
}

const ROWS: Row[] = [
  { id: 1, name: "alpha" },
  { id: 2, name: "beta" },
];

const COLUMNS: Column<Row>[] = [
  { key: "id", header: "ID", accessor: (r) => r.id, sortable: true },
  { key: "name", header: "Name", render: (r) => <b>{r.name}</b>, sortable: true },
];

describe("Table interactions", () => {
  it("sorts when a sortable header is clicked or activated from the keyboard", () => {
    const onSortChange = vi.fn();
    render(<Table columns={COLUMNS} data={ROWS} rowKey={(r) => r.id} onSortChange={onSortChange} />);
    const header = screen.getByRole("button", { name: /ID/ });
    fireEvent.click(header);
    fireEvent.keyDown(header, { key: "Enter" });
    fireEvent.keyDown(header, { key: " " });
    fireEvent.keyDown(header, { key: "a" });
    expect(onSortChange.mock.calls.map((c) => c[0])).toEqual(["id", "id", "id"]);
  });

  it("reflects the active sort in aria-sort", () => {
    const { rerender } = render(<Table columns={COLUMNS} data={ROWS} rowKey={(r) => r.id} sortKey="id" sortDirection="asc" />);
    expect(screen.getByRole("button", { name: /ID/ })).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByRole("button", { name: /Name/ })).toHaveAttribute("aria-sort", "none");
    rerender(<Table columns={COLUMNS} data={ROWS} rowKey={(r) => r.id} sortKey="id" sortDirection="desc" />);
    expect(screen.getByRole("button", { name: /ID/ })).toHaveAttribute("aria-sort", "descending");
    rerender(<Table columns={COLUMNS} data={ROWS} rowKey={(r) => r.id} sortKey="id" sortDirection={null} />);
    expect(screen.getByRole("button", { name: /ID/ })).toHaveAttribute("aria-sort", "none");
  });

  it("calls onRowClick for a click or an Enter/Space key on a row", () => {
    const onRowClick = vi.fn();
    render(<Table columns={COLUMNS} data={ROWS} rowKey={(r) => r.id} onRowClick={onRowClick} />);
    const row = screen.getByText("alpha").closest("tr")!;
    fireEvent.click(row);
    fireEvent.keyDown(row, { key: "Enter" });
    fireEvent.keyDown(row, { key: " " });
    fireEvent.keyDown(row, { key: "x" });
    expect(onRowClick).toHaveBeenCalledTimes(3);
    expect(onRowClick).toHaveBeenCalledWith(ROWS[0]);
  });

  it("shows a loader while loading and the empty message with no data", () => {
    const { rerender } = render(<Table columns={COLUMNS} data={[]} rowKey={(r) => r.id} emptyMessage="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    rerender(<Table columns={COLUMNS} data={[]} rowKey={(r) => r.id} emptyMessage="Nothing here" loading />);
    expect(screen.queryByText("Nothing here")).not.toBeInTheDocument();
  });

  it("renders pagination when asked", () => {
    render(<Table columns={COLUMNS} data={ROWS} rowKey={(r) => r.id} pagination={{ page: 1, pageSize: 10, total: 2, onPageChange: vi.fn() }} />);
    expect(screen.getByRole("button", { name: "Next page" })).toBeInTheDocument();
  });

  it("turns the vertical wheel into horizontal scroll when the table overflows", () => {
    const { container } = render(<Table columns={COLUMNS} data={ROWS} rowKey={(r) => r.id} />);
    const scroller = container.querySelector(".overflow-x-auto") as HTMLElement;
    Object.defineProperty(scroller, "scrollWidth", { value: 800, configurable: true });
    Object.defineProperty(scroller, "clientWidth", { value: 200, configurable: true });
    const wheel = new WheelEvent("wheel", { deltaY: 40, deltaX: 0, cancelable: true });
    scroller.dispatchEvent(wheel);
    expect(scroller.scrollLeft).toBe(40);
    expect(wheel.defaultPrevented).toBe(true);
    const sideways = new WheelEvent("wheel", { deltaY: 1, deltaX: 40, cancelable: true });
    scroller.dispatchEvent(sideways);
    expect(sideways.defaultPrevented).toBe(false);
  });

  it("keeps the body rows in the table body", () => {
    render(<Table columns={COLUMNS} data={ROWS} rowKey={(r) => r.id} />);
    expect(within(screen.getAllByRole("rowgroup")[1]).getAllByRole("row")).toHaveLength(2);
  });
});
