import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { cspPlugin } from './build/cspPlugin.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The same `VITE_*` values the app bundle is built with — also feed the CSP in index.html.
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [react(), cspPlugin(env)],
    build: {
      rollupOptions: {
        output: {
          // Vendor chunk splitting: framework/router/state code changes rarely, so it
          // stays cached across deploys separately from app code and from recharts
          // (the largest single dependency, ~100kB — only needed by /charts, whose own
          // page module is already route-split via React.lazy in src/router.tsx).
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
            // driver.js (the onboarding tour engine) is only ever reached via a dynamic
            // `import("driver.js")` inside OnboardingProvider.startTour — giving it its
            // own chunk (instead of falling into the catch-all 'vendor' bucket below,
            // which loads eagerly on every page) is what actually makes that dynamic
            // import defer its ~25kB until a tour is started, not just look deferred.
            if (id.includes('driver.js')) return 'vendor-tour'
            if (id.includes('react-router') || id.includes('/react/') || id.includes('/react-dom/')) return 'vendor-react'
            if (
              id.includes('axios') ||
              id.includes('zustand') ||
              id.includes('date-fns') ||
              id.includes('clsx') ||
              id.includes('tailwind-merge')
            ) {
              return 'vendor-utils'
            }
            return 'vendor'
          },
        },
      },
    },
  }
})
