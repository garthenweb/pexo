import React from "react";
import ReactDOM from "react-dom";

import { PxGlobalClientProvider } from "./context/GlobalContext";

interface MountConfig {
  container: Element;
  createApp: () => React.ReactNode;
}

export const mount = (config: MountConfig) => {
  const node = config.createApp();
  ReactDOM.render(
    <PxGlobalClientProvider>{node}</PxGlobalClientProvider>,
    config.container
  );
  return config.container;
};

export const unmount = (container: Element) =>
  ReactDOM.unmountComponentAtNode(container);
