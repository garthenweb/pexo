import React from "react";
import ReactDOM from "react-dom";

import { PxGlobalClientProvider } from "./context/GlobalContext";
import { ViewStateCache } from "./types/ViewStateCache";
import { createDefaultLogger, Logger } from "./utils/logger";

interface MountConfig {
  container: Element;
  createApp: () => JSX.Element;
  viewStateCache?: ViewStateCache;
  logger?: Logger;
}

export const mount = (config: MountConfig) => {
  const {
    createApp,
    logger = createDefaultLogger(),
    viewStateCache = createDefaultViewStateCache(),
    container,
  } = config;
  const node = createApp();
  const chunkViewStateScripts = [
    ...container.querySelectorAll("[data-px-chunk-view-state-cache-key]"),
  ] as HTMLScriptElement[];
  const isViewStateComplete = chunkViewStateScripts.every((el) =>
    viewStateCache.has(el.dataset.pxChunkViewStateCacheKey!)
  );
  chunkViewStateScripts.forEach((el) => el.remove());

  const renderMethod =
    isViewStateComplete && viewStateCache.size ? "hydrate" : "render";
  ReactDOM[renderMethod](
    <PxGlobalClientProvider viewStateCache={viewStateCache}>
      {node}
    </PxGlobalClientProvider>,
    container
  );
  if (renderMethod === "render") {
    logger.warn(
      "Falls back to ReactDom.render instead of ReactDom.hydrate because there is a mismatch between the view store cache and the rendered chunks"
    );
  }
  return container;
};

export const unmount = (container: Element) =>
  ReactDOM.unmountComponentAtNode(container);

const createDefaultViewStateCache = (): ViewStateCache =>
  new Map(
    window.hasOwnProperty("window.pxProviderViewStateCache")
      ? Object.entries(window.pxProviderViewStateCache)
      : undefined
  );
