import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table, type Column } from "./Table";

interface Row {
  group: string;
  label: string;
}

const ROWS: Row[] = [
  { group: "A", label: "a1" },
  { group: "A", label: "a2" },
  { group: "B", label: "b1" },
];

const COLUMNS: Column<Row>[] = [
  { key: "group", header: "Group", sticky: true, width: "80px", accessor: (r) => r.group, mergeWith: (r) => r.group },
  { key: "label", header: "Label", accessor: (r) => r.label },
];

describe("Table", () => {
  it("renders one row per data item, with every cell's text visible", () => {
    render(<Table columns={COLUMNS} data={ROWS} rowKey={(_r, i) => i} />);
    expect(screen.getAllByRole("row")).toHaveLength(1 + ROWS.length); // header + 3 body rows
    expect(screen.getByText("a1")).toBeInTheDocument();
    expect(screen.getByText("a2")).toBeInTheDocument();
    expect(screen.getByText("b1")).toBeInTheDocument();
  });

  it("merges a mergeWith column's adjacent equal values into one spanning cell", () => {
    render(<Table columns={COLUMNS} data={ROWS} rowKey={(_r, i) => i} />);
    // "A" spans the first two rows, so it appears in the DOM exactly once (with rowSpan=2) even
    // though two data rows share it — "B" appears once too, but with no rowSpan since its group
    // is a run of one.
    const groupCellA = screen.getByText("A");
    expect(groupCellA.closest("td")).toHaveAttribute("rowSpan", "2");
    const groupCellB = screen.getByText("B");
    expect(groupCellB.closest("td")).not.toHaveAttribute("rowSpan");
  });

  it("shows the empty-state message when there's no data", () => {
    render(<Table columns={COLUMNS} data={[]} rowKey={(_r, i) => i} emptyMessage="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("cycles sort direction and calls onSortChange with the clicked column's key", () => {
    let clickedKey: string | null = null;
    const columns: Column<Row>[] = [{ key: "label", header: "Label", sortable: true, accessor: (r) => r.label }];
    render(
      <Table
        columns={columns}
        data={ROWS}
        rowKey={(_r, i) => i}
        sortKey={null}
        sortDirection={null}
        onSortChange={(key) => (clickedKey = key)}
      />
    );
    const header = within(screen.getAllByRole("row")[0]).getByRole("button", { name: /label/i });
    header.click();
    expect(clickedKey).toBe("label");
  });
});
