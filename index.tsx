import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register';
import { KeyboardManager } from './services/KeyboardManager';

registerSW({ immediate: true });

KeyboardManager.getInstance().init();

window.addEventListener('error', (event) => {
  console.error("Global uncaught error:", event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && typeof event.reason === 'object' && event.reason.code === 'auth/network-request-failed') {
    // Suppress expected internal Firebase Auth network errors when offline or in preview
    event.preventDefault();
    return;
  }
  console.error("Unhandled promise rejection:", event.reason);
});

// Fix for mobile keyboard pushing view offscreen
window.addEventListener('focusout', (e) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }, 50);
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);