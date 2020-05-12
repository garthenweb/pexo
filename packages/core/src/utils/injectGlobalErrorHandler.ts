export const injectGlobalErrorHandler = (fn: () => void) => {
  window.onerror = fn;
};
