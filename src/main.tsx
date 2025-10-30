import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './lib/pwa';

// Reduce noisy console errors coming from injected third-party scripts and vite HMR ping failures.
// Filter 'Failed to fetch' originating from known benign sources (FullStory, Vite client ping) so they don't spam dev console.
window.addEventListener('error', (ev: ErrorEvent) => {
  try {
    const msg = (ev.message || '').toString();
    const src = (ev.filename || '').toString();

    const isFailedFetch = msg.includes('Failed to fetch');
    const isFullStory = src.includes('fullstory') || msg.includes('fullstory');
    const isVitePing = src.includes('@vite/client') || msg.includes('waitForSuccessfulPing') || msg.includes('ping');

    if (isFailedFetch && (isFullStory || isVitePing)) {
      ev.preventDefault();
    }
  } catch (e) {
    // ignore
  }
});

window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
  try {
    const reason = ev.reason;
    const text = typeof reason === 'string' ? reason : (reason && reason.message) ? String(reason.message) : '';
    if (text.includes('Failed to fetch') || text.includes('waitForSuccessfulPing') || text.includes('@vite/client')) {
      ev.preventDefault();
    }
  } catch (e) {
    // ignore
  }
});

(async function boot() {
  try {
    // Register service worker (PWA) if available
    try { registerServiceWorker(); } catch (e) { /* ignore */ }

    // Attempt to perform an initial supabase pull if configured
    const envHasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    if (envHasSupabase) {
      // dynamic import to avoid loading supabase in dev if not configured
      const sync = await import('./lib/sync');
      try { await sync.pullFromSupabase(); } catch (e) { console.error('initial pull failed', e); }
    }
  } catch (e) {
    // ignore
  }

  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();
