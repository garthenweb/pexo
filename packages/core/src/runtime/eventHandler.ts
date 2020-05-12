const createResolvablePromise = () => {
  let resolve: () => void;
  const resolved = new Promise<void>((r) => {
    resolve = () => r();
  });
  return {
    resolved,
    resolve: resolve!,
  };
};

export const createEventHandler = (queue?: string[]) => {
  const events = queue || [];
  const readyHandler = createResolvablePromise();
  let isOutdated = false;

  const executeEvent = (eventName: string) => {
    switch (eventName) {
      case "start":
        readyHandler.resolve();
        break;
      case "invalidate":
        isOutdated = true;
    }
  };

  events.forEach((eventName) => executeEvent(eventName));

  if (events.includes("start")) {
    readyHandler.resolve();
  }

  const eventHandler = {
    push: (eventName: string) => {
      events.push(eventName);
      executeEvent(eventName);
    },
    get ready() {
      return readyHandler.resolved.then(() => eventHandler);
    },
    get isOutdated() {
      return isOutdated;
    },
  };

  return eventHandler;
};
