import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSortedPaged } from "./useSortedPaged";

interface Row {
  id: number;
  name: string;
}

const ROWS: Row[] = [
  { id: 1, name: "Charlie" },
  { id: 2, name: "Alice" },
  { id: 3, name: "Bob" },
  { id: 4, name: "Delta" },
  { id: 5, name: "Echo" },
];

function setup(pageSize = 2) {
  return renderHook(() => useSortedPaged<Row>(ROWS, (row, key) => (row as unknown as Record<string, string | number>)[key], pageSize));
}

describe("useSortedPaged", () => {
  it("returns the first page, unsorted, by default", () => {
    const { result } = setup();
    expect(result.current.rows).toEqual([ROWS[0], ROWS[1]]);
    expect(result.current.sortKey).toBeNull();
    expect(result.current.pagination.page).toBe(1);
    expect(result.current.pagination.total).toBe(5);
  });

  it("slices the correct rows once the page changes", () => {
    const { result } = setup();
    act(() => result.current.pagination.onPageChange(3));
    expect(result.current.rows).toEqual([ROWS[4]]);
  });

  it("cycles a column through asc -> desc -> unsorted on repeated clicks", () => {
    const { result } = setup(10);

    act(() => result.current.onSortChange("name"));
    expect(result.current.sortKey).toBe("name");
    expect(result.current.sortDirection).toBe("asc");
    expect(result.current.rows.map((r) => r.name)).toEqual(["Alice", "Bob", "Charlie", "Delta", "Echo"]);

    act(() => result.current.onSortChange("name"));
    expect(result.current.sortDirection).toBe("desc");
    expect(result.current.rows.map((r) => r.name)).toEqual(["Echo", "Delta", "Charlie", "Bob", "Alice"]);

    act(() => result.current.onSortChange("name"));
    expect(result.current.sortKey).toBeNull();
    expect(result.current.sortDirection).toBeNull();
    // Back to the original, un-resorted order.
    expect(result.current.rows.map((r) => r.name)).toEqual(["Charlie", "Alice", "Bob", "Delta", "Echo"]);
  });

  it("resets to page 1 when sorting changes while on a later page", () => {
    const { result } = setup();
    act(() => result.current.pagination.onPageChange(3));
    expect(result.current.pagination.page).toBe(3);

    act(() => result.current.onSortChange("name"));
    expect(result.current.pagination.page).toBe(1);
  });

  it("resets to page 1 when the page size changes", () => {
    const { result } = setup();
    act(() => result.current.pagination.onPageChange(2));
    act(() => result.current.pagination.onPageSizeChange(5));
    expect(result.current.pagination.page).toBe(1);
    expect(result.current.rows).toHaveLength(5);
  });
});
