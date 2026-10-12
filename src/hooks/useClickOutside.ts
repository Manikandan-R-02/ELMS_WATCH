import { useEffect, type RefObject } from "react";

/** Pass a single ref, or an array of refs when a portaled panel must also count as "inside" (e.g. PickerShell's `portal` mode). */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null> | RefObject<T | null>[],
  onOutside: () => void,
  active = true
) {
  useEffect(() => {
    if (!active) return;
    const refs = Array.isArray(ref) ? ref : [ref];
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      const isInside = refs.some((r) => r.current && r.current.contains(target));
      if (!isInside) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside, active]);
}
