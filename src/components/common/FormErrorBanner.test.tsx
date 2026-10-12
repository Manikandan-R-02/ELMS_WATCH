import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormErrorBanner } from "./FormErrorBanner";

describe("FormErrorBanner", () => {
  it("announces the message as an alert", () => {
    render(<FormErrorBanner message="Could not save" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Could not save");
  });
});
