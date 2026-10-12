import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("shows the range and total, and a window with ellipses around a middle page", () => {
    render(<Pagination page={5} pageSize={10} total={100} onPageChange={vi.fn()} />);
    expect(screen.getByText("41")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getAllByText("…")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "6" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10" })).toBeInTheDocument();
  });

  it("navigates with the number, first, previous, next and last buttons", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={5} pageSize={10} total={100} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: "6" }));
    fireEvent.click(screen.getByRole("button", { name: "First page" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    fireEvent.click(screen.getByRole("button", { name: "Last page" }));
    expect(onPageChange.mock.calls.map((c) => c[0])).toEqual([6, 1, 4, 6, 10]);
  });

  it("disables back-navigation on the first page and forward-navigation on the last", () => {
    const { rerender } = render(<Pagination page={1} pageSize={10} total={30} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "First page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
    rerender(<Pagination page={3} pageSize={10} total={30} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Last page" })).toBeDisabled();
  });

  it("handles an empty list as a single page showing 0", () => {
    render(<Pagination page={1} pageSize={10} total={0} onPageChange={vi.fn()} />);
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("…")).not.toBeInTheDocument();
  });

  it("shows only one ellipsis near either end", () => {
    const { rerender } = render(<Pagination page={1} pageSize={10} total={100} onPageChange={vi.fn()} />);
    expect(screen.getAllByText("…")).toHaveLength(1);
    rerender(<Pagination page={10} pageSize={10} total={100} onPageChange={vi.fn()} />);
    expect(screen.getAllByText("…")).toHaveLength(1);
  });

  it("offers a page-size picker only when a change handler is given", () => {
    const { rerender } = render(<Pagination page={1} pageSize={10} total={100} onPageChange={vi.fn()} />);
    expect(screen.queryByText("10 / page")).not.toBeInTheDocument();
    rerender(<Pagination page={1} pageSize={10} total={100} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />);
    expect(screen.getByText("10 / page")).toBeInTheDocument();
  });
});
