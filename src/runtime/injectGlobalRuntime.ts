import { createEventHandler } from "./eventHandler";

export const injectGlobalRuntime = () => {
  if (globalThis.hasOwnProperty("pxProvider")) {
    throw new Error(
      "Global object pxProvider is already registered. Either PoXi is initialized twice or there is a name conflict in this document."
    );
  }

  const eventHandler = createEventHandler(globalThis.__px);
  Object.defineProperty(globalThis, "__px", {
    value: eventHandler,
  });

  return eventHandler;
};

export const clearGlobalRuntime = () => {
  delete globalThis.__px;
};

declare global {
  namespace globalThis {
    var __px: [];
  }
}
