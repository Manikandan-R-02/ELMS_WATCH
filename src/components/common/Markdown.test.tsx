import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown } from "./Markdown";

describe("Markdown inline markup", () => {
  it("renders bold, inline code and links inside a paragraph", () => {
    render(<Markdown content={"Use **bold** and `code` and [the docs](https://example.com/docs) now."} />);
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("code").tagName).toBe("CODE");
    const link = screen.getByRole("link", { name: "the docs" });
    expect(link).toHaveAttribute("href", "https://example.com/docs");
  });

  it("nests inline code inside bold", () => {
    render(<Markdown content={"**run `npm test` first**"} />);
    expect(screen.getByText("npm test").tagName).toBe("CODE");
  });

  it("leaves unmatched markers as plain text, quickly, even on a long line", () => {
    const long = "*".repeat(5000) + " ` [ " + "[".repeat(5000);
    const started = performance.now();
    render(<Markdown content={long} />);
    expect(performance.now() - started).toBeLessThan(1500);
    expect(screen.getByText(/\*{20}/)).toBeInTheDocument();
  });

  it("renders headings by level", () => {
    render(<Markdown content={"# One\n\n## Two\n\n### Three\n\n#### Four"} />);
    expect(screen.getByRole("heading", { level: 1, name: "One" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Two" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Three" })).toBeInTheDocument();
  });
});
