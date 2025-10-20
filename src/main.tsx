import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Reduce noisy console errors coming from injected third-party scripts (e.g., FullStory/Vite ping failures)
// We filter known benign 'Failed to fetch' errors to avoid spamming the console during development.
window.addEventListener('error', (ev: ErrorEvent) => {
  try {
    const msg = ev.message || '';
    const src = ev.filename || '';
    if (msg.includes('Failed to fetch') && src.includes('fullstory')) {
      // suppress
      ev.preventDefault();
    }
  } catch (e) {
    // ignore
  }
});

window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
  try {
    const reason = ev.reason;
    if (reason && typeof reason === 'object') {
      const message = (reason.message || '').toString();
      if (message.includes('Failed to fetch')) {
        // suppress this noisy rejection
        ev.preventDefault();
      }
    } else if (typeof reason === 'string' && reason.includes('Failed to fetch')) {
      ev.preventDefault();
    }
  } catch (e) {
    // ignore
  }
});

createRoot(document.getElementById("root")!).render(<App />);
