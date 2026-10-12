import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown } from "./Markdown";

describe("Markdown blocks", () => {
  it("renders a fenced code block with its language", () => {
    render(<Markdown content={"```ts\nconst a = 1;\nconst b = 2;\n```"} />);
    expect(screen.getByText("ts")).toBeInTheDocument();
    expect(screen.getByText(/const a = 1;/)).toBeInTheDocument();
  });

  it("renders a code block without a language and tolerates a missing closing fence", () => {
    render(<Markdown content={"```\nunterminated"} />);
    expect(screen.getByText("unterminated")).toBeInTheDocument();
  });

  it("renders blockquotes, one paragraph per quoted line", () => {
    const { container } = render(<Markdown content={"> first\n> second **bold**"} />);
    const quote = container.querySelector("blockquote");
    expect(quote?.querySelectorAll("p")).toHaveLength(2);
    expect(screen.getByText("bold").tagName).toBe("STRONG");
  });

  it("renders bullet and numbered lists, joining lazy continuation lines", () => {
    const { container } = render(<Markdown content={"- one\n  continued\n- two\n\n1. first\n2. second"} />);
    expect(container.querySelectorAll("ul > li")).toHaveLength(2);
    expect(container.querySelectorAll("ol > li")).toHaveLength(2);
    expect(screen.getByText("one continued")).toBeInTheDocument();
  });

  it("renders horizontal rules and paragraphs with CRLF line endings", () => {
    const { container } = render(<Markdown content={"hello\r\nworld\r\n\r\n---\r\n\r\nafter"} />);
    expect(container.querySelector("hr")).toBeInTheDocument();
    expect(screen.getByText("hello world")).toBeInTheDocument();
    expect(screen.getByText("after")).toBeInTheDocument();
  });
});
