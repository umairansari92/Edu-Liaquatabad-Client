import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage Progressive Web App (PWA) installation state and user prompt.
 * Conforms strictly to docs/CODE_QUALITY_AND_NAMING_STANDARDS.md.
 */
export const usePwaInstall = () => {
  const [deferredPromptEvent, setDeferredPromptEvent] = useState(null);
  const [isApplicationInstalled, setIsApplicationInstalled] = useState(false);

  useEffect(() => {
    // Check if the application is currently running in standalone display mode
    const isStandaloneWindow =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandaloneWindow) {
      setIsApplicationInstalled(true);
    }

    const beforeInstallPromptHandler = (eventObject) => {
      // Prevent browser default mini-infobar on mobile devices
      eventObject.preventDefault();
      // Stash the event so it can be triggered by custom UI action
      setDeferredPromptEvent(eventObject);
    };

    const appInstalledHandler = () => {
      // Clear deferred prompt and mark as installed
      setDeferredPromptEvent(null);
      setIsApplicationInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);
    window.addEventListener('appinstalled', appInstalledHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, []);

  const triggerInstallPrompt = useCallback(async () => {
    if (!deferredPromptEvent) {
      return false;
    }

    // Show the native browser install prompt
    await deferredPromptEvent.prompt();

    // Wait for the user to respond to the prompt
    const userChoiceResult = await deferredPromptEvent.userChoice;

    if (userChoiceResult.outcome === 'accepted') {
      setIsApplicationInstalled(true);
    }

    // Prompt can only be used once; discard reference
    setDeferredPromptEvent(null);
    return userChoiceResult.outcome === 'accepted';
  }, [deferredPromptEvent]);

  return {
    canInstallApplication: Boolean(deferredPromptEvent) && !isApplicationInstalled,
    isApplicationInstalled,
    triggerInstallPrompt,
  };
};

export default usePwaInstall;
