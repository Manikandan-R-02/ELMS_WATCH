import { useState } from "react";
import { Loader } from "../components/loader/Loader";
import { LocationLoader } from "../components/loader/LocationLoader";
import { SupplyChainLoader } from "../components/loader/SupplyChainLoader";
import { ConveyorLoader } from "../components/loader/ConveyorLoader";
import { ScanLoader } from "../components/loader/ScanLoader";
import { Skeleton } from "../components/loader/Skeleton";
import { DotsLoader } from "../components/loader/DotsLoader";
import { TextButton } from "../components/buttons/TextButton";
import { Card } from "../components/cards/Card";
import { useLoaderStore } from "../store/loaderStore";
import axiosClient from "../api/axiosClient";
import { showSuccessToast } from "../store/toastStore";
import { PreviewPage, PreviewSection, ComponentApi } from "./PreviewSection";

async function simulateApiCall() {
  try {
    await axiosClient.get("https://jsonplaceholder.typicode.com/todos/1");
    showSuccessToast("Request complete", "The global loader tracked this axios call automatically.");
  } catch {
    showSuccessToast("Request finished", "(Network call failed in this sandbox, but the loader still ran.)");
  }
}

export function LoaderPreviewPage() {
  const [buttonLoading, setButtonLoading] = useState(false);
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const setManualLoading = useLoaderStore((s) => s.setManualLoading);

  function simulateUiRender() {
    setManualLoading(true);
    setTimeout(() => setManualLoading(false), 1500);
  }

  return (
    <PreviewPage
      title="Loader"
      description="LocationLoader — a pin dropping with an elastic squash-and-bounce onto a radar-style bullseye (three concentric rings, always visible together, gently breathing) with a shadow at its center that pulses on impact — is this project's default themed indicator, used for loading states everywhere except the login page. Older themed siblings (truck/conveyor/scan) remain available below."
    >
      <PreviewSection title="Global loader" description="Fills the page-content area (below the header, beside the sidebar/top nav — never over them) and shows automatically for every axios call and route change (via AppLoader, the Location Management loading card); trigger it manually for any other async UI work with useLoaderStore.setManualLoading.">
        <div className="flex flex-wrap gap-3">
          <TextButton onClick={simulateUiRender}>Simulate UI render (1.5s)</TextButton>
          <TextButton variant="outline" onClick={simulateApiCall}>
            Simulate API call (axios)
          </TextButton>
        </div>
        <ComponentApi
          importCode={'import { useLoaderStore } from "../store/loaderStore";\n\nconst { setManualLoading } = useLoaderStore.getState();\nsetManualLoading(true);  // shows GlobalLoader\nsetManualLoading(false); // hides it'}
          props={[
            { name: "isLoading", type: "boolean", description: "Read-only derived state: activeRequests > 0 || manualLoading." },
            { name: "start() / stop()", type: "() => void", description: "Called automatically by axiosClient's interceptors — increments/decrements activeRequests." },
            { name: "setManualLoading", type: "(loading: boolean) => void", description: "Use for any async UI work that isn't an axios call." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Standalone themed loaders" description="Use inside a Card or empty state while a section is fetching its own data. LocationLoader is the default for this project — the others remain as sibling metaphors.">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 py-8 dark:border-brand-700">
            <LocationLoader size="md" />
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-8 dark:border-slate-700">
            <SupplyChainLoader size="sm" />
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-8 dark:border-slate-700">
            <ConveyorLoader />
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-8 dark:border-slate-700">
            <ScanLoader />
          </div>
        </div>
        <ComponentApi
          importCode={'import { LocationLoader } from "../components/loader/LocationLoader";\nimport { SupplyChainLoader } from "../components/loader/SupplyChainLoader";\nimport { ConveyorLoader } from "../components/loader/ConveyorLoader";\nimport { ScanLoader } from "../components/loader/ScanLoader";'}
          props={[
            { name: "label", type: "string", description: "Set to \"\" to hide the caption entirely. Each has its own default (\"Loading...\", \"Loading supply chain data...\", \"Processing...\", \"Scanning...\")." },
            { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "All four accept this — scales the artwork and caption together." },
            { name: "(when to use which)", type: "—", description: "LocationLoader: this project's default, general fetch/sync/route-change. SupplyChainLoader/ConveyorLoader/ScanLoader: kept as alternate themed metaphors, not currently wired into GlobalLoader." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Inline spinner" description="Small generic spinner for buttons and tight spaces — see the `loading` prop on TextButton.">
        <div className="flex flex-wrap items-center gap-6">
          <Loader size="sm" />
          <Loader size="md" />
          <Loader size="lg" />
          <TextButton
            loading={buttonLoading}
            onClick={() => {
              setButtonLoading(true);
              setTimeout(() => setButtonLoading(false), 1500);
            }}
          >
            Save
          </TextButton>
        </div>
        <ComponentApi
          importCode={'import { Loader } from "../components/loader/Loader";'}
          props={[{ name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Also used internally by TextButton's loading state." }]}
        />
      </PreviewSection>

      <PreviewSection title="Skeleton" description="Content-shaped placeholder — use in place of a spinner while a card, list, or table row's real data is still loading.">
        <div className="flex flex-wrap items-center gap-3">
          <TextButton variant="outline" onClick={() => setSkeletonLoading((v) => !v)}>
            {skeletonLoading ? "Show loaded content" : "Show skeleton"}
          </TextButton>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card>
            {skeletonLoading ? (
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" />
                <div className="flex-1">
                  <Skeleton variant="text" width="60%" />
                  <div className="mt-2">
                    <Skeleton variant="text" lines={2} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">MR</span>
                <div>
                  <p className="text-card-title">Manikandan R</p>
                  <p className="text-body-sm mt-0.5">Administrator — signed in from Chennai, IN. Last active 2 minutes ago.</p>
                </div>
              </div>
            )}
          </Card>
          <Card>{skeletonLoading ? <Skeleton variant="rect" height={96} /> : <div className="flex h-24 items-center justify-center rounded-lg bg-brand-50 text-sm font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">Chart / image content</div>}</Card>
        </div>
        <ComponentApi
          importCode={'import { Skeleton } from "../components/loader/Skeleton";'}
          props={[
            { name: "variant", type: '"text" | "rect" | "circle"', default: '"text"', description: "Shape of the placeholder." },
            { name: "lines", type: "number", default: "1", description: 'variant="text" only — stacks N lines, the last one rendered shorter.' },
            { name: "width / height", type: "number | string", description: "Overrides the default size for the chosen variant." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Dots loader" description="Compact three-dot loader for very tight spaces — a table cell, a chat bubble, inline status text — where the spinner or truck loader would be too heavy.">
        <div className="flex flex-wrap items-center gap-6">
          <DotsLoader size="sm" />
          <DotsLoader size="md" />
          <DotsLoader size="lg" />
          <span className="text-body-sm flex items-center gap-2">
            Syncing <DotsLoader size="sm" />
          </span>
        </div>
        <ComponentApi
          importCode={'import { DotsLoader } from "../components/loader/DotsLoader";'}
          props={[{ name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Dot diameter." }]}
        />
      </PreviewSection>
    </PreviewPage>
  );
}
