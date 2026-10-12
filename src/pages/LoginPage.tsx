import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, BarChart3, Mail, MapPin, PackageSearch, ShieldCheck, FileSpreadsheet, Users } from "lucide-react";
import { TextInput } from "../components/fields/TextInput";
import { PasswordInput } from "../components/fields/PasswordInput";
import { TextButton } from "../components/buttons/TextButton";
import { Logo } from "../components/common/Logo";
import { showInfoToast, showSuccessToast } from "../store/toastStore";
import { ToastContainer } from "../components/toast/ToastContainer";
import { InvalidCredentialsError, useAuthStore } from "../store/authStore";
import { ROUTES } from "../routes/paths";
import { cn } from "../lib/cn";
import loginBg from "../assets/LoginPageImg.png";

/** From this many wrong-credential attempts in a row, the page suggests contacting the administrator. */
const MAX_FAILED_ATTEMPTS = 5;

const FEATURES = [
  { icon: MapPin, label: "Real-time\nTracking" },
  { icon: BarChart3, label: "Powerful\nAnalytics" },
  { icon: ShieldCheck, label: "Secure &\nReliable" },
];

// What the platform covers — no figures here, since nothing on this page is loaded from the server.
const COVERAGE = [
  { icon: PackageSearch, label: "Stock & Consumption" },
  { icon: FileSpreadsheet, label: "Reports & Excel exports" },
  { icon: Users, label: "Users & Location Rights" },
];

/**
 * Split left/right layout — left panel uses the provided location-analytics
 * background image (src/assets/LoginPageImg.png) with our own copy overlaid,
 * right panel is a plain (un-boxed) form on white, matching the reference
 * design.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [shake, setShake] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Wrong-credential attempts since the page opened (a network failure is not counted).
  const failedAttempts = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
    if (formError) setFormError("");
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
    if (formError) setFormError("");
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = "Email address is required.";
    if (!password.trim()) errors.password = "Password is required.";
    if (errors.email || errors.password) {
      setFieldErrors(errors);
      triggerShake();
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      const name = useAuthStore.getState().user?.name;
      failedAttempts.current = 0;
      showSuccessToast(name ? `Welcome back, ${name}` : "Welcome back", "Let's analyze your data for a better tomorrow.");
      navigate(ROUTES.overallSummary);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Invalid credentials. Please try again.");
      if (err instanceof InvalidCredentialsError) {
        failedAttempts.current += 1;
        if (failedAttempts.current >= MAX_FAILED_ATTEMPTS) {
          showInfoToast("Having trouble signing in?", "Too many unsuccessful attempts. Please contact your administrator to check or reset your password.");
        }
      }
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  }

  const m = mounted;

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950">
      {/* LEFT — background image + our own copy overlaid */}
      <div className="relative hidden w-1/2 flex-col overflow-hidden lg:flex">
        {/* The source image's content (pins/map) sits in its left portion, with empty
            gradient to the right — object-left keeps that content in frame instead of
            center-cropping into the empty side. */}
        <img src={loginBg} alt="" className="absolute inset-0 h-full w-full object-cover object-left" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/55 to-slate-950/85" />

        <div className="relative flex h-full flex-col justify-between p-8 xl:p-10">
          <div className={cn("flex items-center gap-3", m ? "animate-fade-up" : "opacity-0")}>
            <Logo variant="white" className="h-8 w-auto object-contain" />
            <span className="h-6 w-px bg-white/20" />
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-slate-300">Track · Analyze · Manage</span>
          </div>

          <div className="max-w-md">
            <div className={cn(m ? "animate-fade-up" : "opacity-0")} style={{ animationDelay: "100ms" }}>
              <h1 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
                Smarter Location Insights for a <span className="text-brand-400">Better Tomorrow</span>
              </h1>
              <p className="mt-3 text-sm text-slate-300">
                Monitor locations, analyze trends, and make data-driven decisions with our powerful location
                management and analytics platform.
              </p>
            </div>

            <div className={cn("mt-6 flex gap-6", m ? "animate-fade-up" : "opacity-0")} style={{ animationDelay: "200ms" }}>
              {FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-400">
                    <f.icon className="h-4 w-4" />
                  </span>
                  <p className="whitespace-pre-line text-xs font-medium leading-snug text-slate-300">{f.label}</p>
                </div>
              ))}
            </div>

            <div className={cn("mt-8 flex flex-wrap gap-3", m ? "animate-fade-up" : "opacity-0")} style={{ animationDelay: "300ms" }}>
              {COVERAGE.map((c) => (
                <div
                  key={c.label}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-2 pr-4 backdrop-blur-sm"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
                    <c.icon className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-xs font-medium text-slate-200">{c.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className={cn("text-xs text-slate-500", m ? "animate-fade-up" : "opacity-0")} style={{ animationDelay: "400ms" }}>
            © {new Date().getFullYear()} Esfita. All rights reserved.
          </p>
        </div>
      </div>

      {/* RIGHT — plain form, no card border */}
      <div className="flex w-full flex-col overflow-y-auto bg-white px-6 py-6 dark:bg-slate-950 lg:w-1/2">
        <div className="flex justify-end lg:justify-end">
          <p className="hidden text-xs text-slate-400 sm:flex sm:items-center sm:gap-2 dark:text-slate-500">
            <span>Manage Locations</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Gain Insights</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Drive Growth</span>
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className={cn("w-full max-w-sm", m ? "animate-fade-up" : "opacity-0")} style={{ animationDelay: "150ms" }}>
            <Logo className="h-8 w-auto object-contain" />

            <div className="mt-4">
              <h2 className="text-page-title">Welcome Back</h2>
              <p className="text-body mt-1">Sign in to your account to continue.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className={cn("mt-6 space-y-4", shake && "animate-shake-x")}>
              {formError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 animate-error-slide-in dark:border-red-900 dark:bg-red-500/10"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300">Sign in failed</p>
                    <p className="text-xs text-red-600 dark:text-red-400">{formError}</p>
                  </div>
                </div>
              )}

              <TextInput
                label="Email Address"
                type="email"
                placeholder="Enter your email address"
                autoComplete="email"
                autoFocus
                required
                disabled={submitting}
                leadingIcon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                error={fieldErrors.email}
              />

              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={submitting}
                showStrength={false}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                error={fieldErrors.password}
              />

              <TextButton type="submit" fullWidth loading={submitting} leadingIcon={<ArrowRight className="h-4 w-4" />}>
                {submitting ? "Signing in…" : "Sign In"}
              </TextButton>
            </form>
          </div>
        </div>

        <p className="pb-2 text-center text-xs text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} Esfita. All rights reserved.
        </p>
      </div>
      <ToastContainer />
    </div>
  );
}
