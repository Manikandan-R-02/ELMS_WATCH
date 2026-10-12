import { afterEach, describe, expect, it } from "vitest";
import { visibleTargetGetter } from "./tourUtils";

describe("visibleTargetGetter", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns a function that resolves the selector when the step is about to show", () => {
    const get = visibleTargetGetter('[data-tour="late"]');
    expect(get()).toBeUndefined();
    const el = document.createElement("div");
    el.setAttribute("data-tour", "late");
    el.getClientRects = () => [{}] as unknown as DOMRectList;
    document.body.appendChild(el);
    expect(get()).toBe(el);
  });
});
