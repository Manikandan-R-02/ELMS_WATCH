import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Card } from "../components/cards/Card";
import { TextButton } from "../components/buttons/TextButton";

/**
 * Catch-all route (`path="*"` in router.tsx) — anything that doesn't match a known
 * page lands here instead of rendering a blank <Outlet />.
 */
export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <Compass className="mx-auto h-10 w-10 text-brand-600 dark:text-brand-400" />
        <h1 className="text-page-title mt-4">Page not found</h1>
        <p className="text-body-sm mt-2">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <Link to="/" className="mt-5 inline-block">
          <TextButton>Back to Overview</TextButton>
        </Link>
      </Card>
    </div>
  );
}
