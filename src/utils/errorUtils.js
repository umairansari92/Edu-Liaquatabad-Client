/**
 * Safe Error Message Extractor & Toast Safeguards
 * Education Department Liaquatabad Town Centre (DMC)
 *
 * Guarantees that any thrown error, AxiosError, Redux Thunk rejection, or custom object
 * is converted into a human-readable string suitable for display in UI toasts and alerts.
 * Strictly prevents "Objects are not valid as a React child (found: [object Error])" crashes.
 */

/**
 * Extracts a user-facing string from any error object, string, or unknown entity.
 *
 * @param {unknown} error - Error object, string, or unknown thrown entity
 * @param {string} fallbackMessage - Fallback text if error contains no readable message
 * @returns {string} Safe, printable string message
 */
export const getErrorMessage = (error, fallbackMessage = 'An unexpected error occurred.') => {
  if (!error) {
    return fallbackMessage;
  }

  // 1. Direct string
  if (typeof error === 'string') {
    const trimmedMessage = error.trim();
    return trimmedMessage.length > 0 ? trimmedMessage : fallbackMessage;
  }

  // 2. Axios or API response: error.response.data.message
  if (typeof error?.response?.data?.message === 'string' && error.response.data.message.trim()) {
    return error.response.data.message.trim();
  }

  // 3. Axios or API response: error.response.data.error
  if (typeof error?.response?.data?.error === 'string' && error.response.data.error.trim()) {
    return error.response.data.error.trim();
  }

  // 4. Redux Toolkit payload or standard response object: error.data.message
  if (typeof error?.data?.message === 'string' && error.data.message.trim()) {
    return error.data.message.trim();
  }

  // 5. Standard JavaScript Error: error.message
  if (typeof error?.message === 'string' && error.message.trim()) {
    const message = error.message.trim();
    if (message === 'Network Error' || error.code === 'ERR_NETWORK') {
      return 'Network connection issue. Please check your internet connectivity.';
    }
    return message;
  }

  // 6. HTTP Status text fallback
  if (typeof error?.statusText === 'string' && error.statusText.trim()) {
    return error.statusText.trim();
  }

  return fallbackMessage;
};

/**
 * Installs global safeguards onto react-hot-toast to ensure raw Error instances
 * never propagate to React children rendering.
 *
 * @param {import('react-hot-toast').default} toastInstance
 */
export const installSafeToastSafeguards = (toastInstance) => {
  if (!toastInstance || typeof toastInstance.error !== 'function') {
    return;
  }

  if (toastInstance._safeToastInstalled) {
    return;
  }
  toastInstance._safeToastInstalled = true;

  const originalToastError = toastInstance.error.bind(toastInstance);
  toastInstance.error = (messageOrError, toastOptions) => {
    const safeDisplayMessage = getErrorMessage(messageOrError, 'An unexpected error occurred.');
    return originalToastError(safeDisplayMessage, toastOptions);
  };
};

export default getErrorMessage;
