import { registerSW } from 'virtual:pwa-register';

/**
 * Registers the production Progressive Web App service worker.
 * Adheres strictly to docs/CODE_QUALITY_AND_NAMING_STANDARDS.md.
 */
export const registerPwaServiceWorker = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const updateServiceWorkerFunction = registerSW({
      immediate: true,
      onNeedRefresh() {
        // Automatically activate new service worker and refresh to prevent stale chunks
        updateServiceWorkerFunction(true);
      },
      onOfflineReady() {
        // App shell is precached and ready
      },
      onRegisteredSW(serviceWorkerScriptUrl, serviceWorkerRegistration) {
        // Check for updates periodically every hour
        if (serviceWorkerRegistration) {
          const ONE_HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
          setInterval(() => {
            serviceWorkerRegistration.update().catch((updateError) => {
              // Silently handle offline update check failures
            });
          }, ONE_HOUR_IN_MILLISECONDS);
        }
      },
      onRegisterError(registrationError) {
        // Log registration failure without breaking application runtime
        console.error('[PWA] Service Worker registration failed:', registrationError);
      },
    });
  }
};

export default registerPwaServiceWorker;
