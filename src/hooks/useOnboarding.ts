/**
 * Re-exported from where the context actually lives, so consumers can
 * `import { useOnboarding } from "../hooks/useOnboarding"` following this
 * project's `hooks/` convention, without a second source of truth for the
 * context itself.
 */
export { useOnboarding } from "../components/onboarding/onboardingContext";
