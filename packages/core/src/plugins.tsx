export type Plugin = "styled-components" | "service-worker" | undefined;

export const createPluginStyledComponents = (): Plugin => "styled-components";

export const createPluginServiceWorker = ({
  disable,
}: {
  disable?: boolean;
} = {}): Plugin => {
  return disable ? undefined : "service-worker";
};

export const registerServiceWorker = (path = "/sw.js") => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(path, { scope: "/" });

    navigator.serviceWorker.ready.then((registration) => {
      if (process.env.VERSION) {
        return registration.navigationPreload.setHeaderValue(
          process.env.VERSION
        );
      }
    });
  }
};
