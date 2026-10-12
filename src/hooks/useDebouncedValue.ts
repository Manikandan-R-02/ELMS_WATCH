import { useEffect, useState } from "react";

/**
 * Returns `value`, but delayed until it stops changing for `delayMs`. Use this
 * before firing a search API call or an expensive filter/sort from a text
 * input — without it, every keystroke does the full round-trip/computation.
 *
 * @example
 * const [query, setQuery] = useState("");
 * const debouncedQuery = useDebouncedValue(query, 300);
 * useEffect(() => { if (debouncedQuery) fetchResults(debouncedQuery); }, [debouncedQuery]);
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
