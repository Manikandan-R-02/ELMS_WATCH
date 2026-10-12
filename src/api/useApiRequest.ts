import { useCallback, useRef, useState } from "react";
import { isRequestCanceled } from "./axiosClient";
import { toApiError, type ApiError } from "./types";

export function useApiRequest<TArgs extends unknown[], TResult>(
  requestFn: (...args: TArgs) => Promise<TResult>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<TResult | null>(null);
  // Guards against a stale response overwriting a fresher one — e.g. React StrictMode's
  // dev-mode double effect invocation firing the same request twice, or a fast month/filter
  // change re-running `run()` before the previous call has settled. Without this, whichever
  // call happens to *resolve* last wins the final state even if it was *started* first — a
  // slow, since-superseded call's error (or its success) can land after a newer call already
  // populated the screen, showing a contradictory "couldn't load" banner over data that's
  // actually visible and correct. Only the call whose id still matches the latest `run()` at
  // resolution time is allowed to update state.
  const latestRequestId = useRef(0);

  const run = useCallback(
    async (...args: TArgs) => {
      const requestId = ++latestRequestId.current;
      setLoading(true);
      setError(null);
      try {
        const result = await requestFn(...args);
        if (requestId === latestRequestId.current) {
          setData(result);
          setLoading(false);
        }
        return result;
      } catch (err) {
        // A cancelled call (the person left the screen) is neither shown as an error nor kept as data.
        if (requestId === latestRequestId.current) {
          if (!isRequestCanceled(err)) setError(toApiError(err));
          setLoading(false);
        }
        return null;
      }
    },
    [requestFn]
  );

  return { run, loading, error, data, setData };
}
