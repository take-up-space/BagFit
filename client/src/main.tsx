
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Nuclear cache-busting strategy
const APP_VERSION = Date.now().toString();
window.APP_VERSION = APP_VERSION;

// Service Worker Registration for Cache Invalidation
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('SW registered:', registration);
      return navigator.serviceWorker.ready;
    })
    .then(() => {
      // Force page reload to bypass cache if no cache-bust param
      if (window.location.search.indexOf('cache-bust') === -1) {
        const separator = window.location.search ? '&' : '?';
        window.location.search += separator + 'cache-bust=' + APP_VERSION;
      }
    })
    .catch((error) => {
      console.log('SW registration failed:', error);
    });
}

// Clear all localStorage cache
try {
  localStorage.removeItem('bagfit-cache');
  sessionStorage.clear();
} catch (e) {
  console.log('Cache clear failed:', e);
}

createRoot(document.getElementById("root")!).render(<App />);
