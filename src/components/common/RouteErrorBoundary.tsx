import { Component, type ErrorInfo, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Card } from "../cards/Card";
import { TextButton } from "../buttons/TextButton";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** What the page shows once a route has crashed: a short message and a reload button. */
function ErrorFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <TriangleAlert className="mx-auto h-10 w-10 text-red-600 dark:text-red-400" />
        <h1 className="text-page-title mt-4">Something went wrong</h1>
        <p className="text-body-sm mt-2">
          This page hit an unexpected error. Reloading usually fixes it.
        </p>
        <TextButton className="mt-5" onClick={() => globalThis.location.reload()}>
          Reload page
        </TextButton>
      </Card>
    </div>
  );
}

/**
 * Wraps <Routes> in router.tsx. Catches two distinct failure modes for a lazy-loaded
 * route: (1) the page component itself throwing during render, and (2) a stale chunk
 * URL 404ing after a new deploy ships ("Failed to fetch dynamically imported module") —
 * the latter is auto-recovered once via a hard reload before this fallback ever shows
 * (see the reloadOnChunkError() import in router.tsx). This only catches what (2)
 * leaves behind if the reload itself didn't fix it, plus any other render-time error.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Route render error:", error, info.componentStack);
  }

  render(): ReactNode {
    return this.state.hasError ? <ErrorFallback /> : this.props.children;
  }
}
