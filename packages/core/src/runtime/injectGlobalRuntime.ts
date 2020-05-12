import { createEventHandler } from "./eventHandler";

export const injectGlobalRuntime = () => {
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
    var __px: string[];
  }
}
