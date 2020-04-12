import React from "react";
import ReactDOM from "react-dom";

import { PxGlobalClientProvider } from "./context/GlobalContext";
import { ViewStateCache } from "./types/ViewStateCache";
import { createDefaultLogger, Logger } from "./utils/logger";
import {
  injectGlobalRuntime,
  clearGlobalRuntime,
} from "./runtime/injectGlobalRuntime";
import { cleanRuntime } from "./runtime/cleanRuntime";
import { hydrateRequiredChunks } from "./runtime/dynamicImports";

interface MountConfig {
  requestContainer: () => Element;
  createApp: () => JSX.Element;
  viewStateCache?: ViewStateCache;
  logger?: Logger;
}

export const mount = async (config: MountConfig) => {
  const {
    createApp,
    logger = createDefaultLogger(),
    viewStateCache = new Map(),
    requestContainer,
  } = config;
  const node = createApp();

  const staticChunkModuleCache = await hydrateRequiredChunks();
  await injectGlobalRuntime().ready;
  const container = requestContainer();
  if (!container) {
    throw new Error(
      "A container is expected to be returned from requestContainer, but none was found."
    );
  }

  hydrateViewStateCache(viewStateCache, container);
  cleanRuntime(container);

  const renderMethod = viewStateCache.size ? "hydrate" : "render";
  ReactDOM[renderMethod](
    <PxGlobalClientProvider
      viewStateCache={viewStateCache}
      staticChunkModuleCache={staticChunkModuleCache}
    >
      {node}
    </PxGlobalClientProvider>,
    container
  );
  if (renderMethod === "render") {
    logger.warn(
      "Falling back to ReactDom.render instead of ReactDom.hydrate because there is a mismatch between the view store cache and the rendered chunks"
    );
  }
  return container;
};

export const unmount = (container: Element) => {
  ReactDOM.unmountComponentAtNode(container);
  clearGlobalRuntime();
};

const hydrateViewStateCache = (
  viewStateCache: ViewStateCache,
  container: Element
) => {
  [
    ...container.querySelectorAll<HTMLScriptElement>(
      "[data-px-chunk-view-state-cache-key]"
    ),
  ].forEach((el) => {
    viewStateCache.set(
      el.dataset.pxChunkViewStateCacheKey!,
      JSON.parse(el.innerHTML)
    );
  });
};
