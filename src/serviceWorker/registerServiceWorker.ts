export const registerServiceWorker = () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./worker", { scope: "/" });

    navigator.serviceWorker.ready.then((registration) => {
      if (process.env.VERSION) {
        return registration.navigationPreload.setHeaderValue(
          process.env.VERSION
        );
      }
    });
  }
};
