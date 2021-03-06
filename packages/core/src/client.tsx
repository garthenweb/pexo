import React from "react";
import {
  render,
  hydrate,
  unmountComponentAtNode,
  unstable_createRoot as createRoot,
} from "react-dom";

import { PxGlobalClientProvider } from "./context/GlobalContext";
import { ViewStateCache } from "./types/ViewStateCache";
import { createDefaultLogger, Logger } from "./utils/logger";
import {
  injectGlobalRuntime,
  clearGlobalRuntime,
} from "./runtime/injectGlobalRuntime";
import { cleanRuntime } from "./runtime/cleanRuntime";
import { hydrateRequiredChunks } from "./runtime/dynamicImports";
import { Plugin, registerServiceWorker } from "./plugins";
import { injectGlobalErrorHandler } from "./utils/injectGlobalErrorHandler";

interface MountConfig {
  requestContainer: () => Element;
  createApp: () => JSX.Element;
  viewStateCache?: ViewStateCache;
  logger?: Logger;
  plugins?: Plugin[];
}

export const mount = async (config: MountConfig) => {
  const {
    createApp,
    logger = createDefaultLogger(),
    viewStateCache = new Map(),
    requestContainer,
    plugins = [],
  } = config;

  if (plugins.includes("service-worker")) {
    registerServiceWorker();
  }
  const [, node, appStatus] = await Promise.all([
    process.env.PEXO_EXPERIMENTAL !== "true"
      ? hydrateRequiredChunks()
      : Promise.resolve({}),
    createApp(),
    injectGlobalRuntime().ready,
  ]);
  // check static chunks one more time as hydration marks could be added later
  const staticChunkModuleCache = await hydrateRequiredChunks();

  const container = requestContainer();
  if (!container) {
    throw new Error(
      "A container is expected to be returned from requestContainer, but none was found."
    );
  }

  if (plugins.includes("styled-components")) {
    rearrangeStyledComponentsStyles(container);
  }
  hydrateViewStateCache(viewStateCache, container);
  cleanRuntime(container);

  if (appStatus.isOutdated) {
    injectGlobalErrorHandler(() => {
      location.reload(true);
    });
  }

  const app = (
    <PxGlobalClientProvider
      viewStateCache={viewStateCache}
      staticChunkModuleCache={staticChunkModuleCache}
      reloadOnNavigation={appStatus.isOutdated}
    >
      {node}
    </PxGlobalClientProvider>
  );

  if (!appStatus.isOutdated && viewStateCache.size) {
    if (process.env.PEXO_EXPERIMENTAL === "true") {
      logger.info("Running in experimental mode");
      createRoot(container).render(app);
    } else {
      hydrate(app, container);
    }
  } else {
    render(app, container);
    if (appStatus.isOutdated) {
      logger.warn(
        "Falling back to ReactDom.render instead of ReactDom.hydrate because the server has another version than the client and cannot send a valid application state"
      );
    }
    if (!viewStateCache.size) {
      logger.warn(
        "Falling back to ReactDom.render instead of ReactDom.hydrate because there is a mismatch between the view store cache and the rendered chunks"
      );
    }
  }

  return container;
};

export const unmount = (container: Element) => {
  unmountComponentAtNode(container);
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

const rearrangeStyledComponentsStyles = (container: Element) => {
  const styles = [
    ...container.querySelectorAll<HTMLStyleElement>("style[data-styled]"),
  ];
  if (styles.length) {
    const head = document.querySelector("head") as HTMLHeadElement;
    const styleContent = styles.reduce(
      (styles, el) => `${styles}${el.innerHTML}`,
      ""
    );
    const firstStyle = styles.slice(0, 1)[0];
    firstStyle.innerHTML = styleContent;
    head?.appendChild(firstStyle);
    styles.slice(1).forEach((el) => el.remove());
  }
};
