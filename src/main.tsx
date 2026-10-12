import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useThemeStore } from './store/themeStore'
import { useLayoutStore } from './store/layoutStore'
import { useAuthStore } from './store/authStore'

useThemeStore.getState().hydrate()
useLayoutStore.getState().hydrate()
useAuthStore.getState().bootstrap()

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
