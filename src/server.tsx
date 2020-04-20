import React from "react";
import express from "express";
import { StaticRouter } from "react-router-dom";
import { PxGlobalServerProvider } from "./context/GlobalContext";
import { renderStaticChunkTemplate } from "./renderer/renderStaticChunkTemplate";
import { renderToChunkStream } from "./renderer/renderToChunkStream";
import { preloadBlockingChunks } from "./loader/preloadBlockingChunks";
import { Redirect } from "./utils/Redirect";
import { ViewStateCache } from "./types/ViewStateCache";
import { enhanceChunksWithViewStateCache } from "./utils/enhanceChunksWithViewStateCache";
import { createDefaultLogger, Logger } from "./utils/logger";
import {
  Manifest,
  createDefaultManifestRequester,
} from "./utils/requestManifest";
import { getManifestAssetsByChunks } from "./utils/getManifestAssetsByChunks";
import { getHydrationChunkScript } from "./utils/getHydrationChunkScript";
import { Plugin } from "./plugins";
import { READY_EVENT } from "./runtime/snippets";
import { renderHeadToString } from "./renderer/renderHead";
import { createRequest } from "./request";
import { exists } from "./utils/exists";

interface MiddlewareConfig {
  createApp: () => JSX.Element;
  logger?: Logger;
  viewStateCache?: ViewStateCache;
  requestManifest?: () => Promise<Manifest>;
  plugins?: Plugin[];
}

export const createStreamMiddleware = (config: MiddlewareConfig) => {
  const {
    createApp,
    logger = createDefaultLogger(),
    viewStateCache,
    requestManifest = createDefaultManifestRequester(logger),
    plugins = [],
  } = config;
  const request = createRequest();
  return async (req: express.Request, res: express.Response) => {
    logger.info(`Receive request with url \`${req.url}\``);
    const disableServerSideRendering = req.query.ssr === "0";
    const navPreloadHeader = req.headers[
      "service-worker-navigation-preload"
    ] as string | undefined;
    const shouldRenderRoutesOnly = exists(navPreloadHeader);
    const clientVersion =
      navPreloadHeader && navPreloadHeader !== "true"
        ? navPreloadHeader
        : undefined;
    if (shouldRenderRoutesOnly) {
      logger.info(
        `Detects to render request with url \`${req.url}\` to only serve routes content`
      );
    }
    const renderTemplate = (() => {
      if (req.url === "/__/px.sw.header") {
        return "header" as const;
      } else if (req.url === "/__/px.sw.footer") {
        return "footer" as const;
      }
      return undefined;
    })();
    const watchManifest = requestManifest({
      shouldWatch: process.env.NODE_ENV !== "production",
    });
    const requestViewStateCache = viewStateCache ?? new Map();
    try {
      const createAppContext = (chunkNode: React.ReactNode) => (
        <StaticRouter location={req.url}>
          <PxGlobalServerProvider>{chunkNode}</PxGlobalServerProvider>
        </StaticRouter>
      );
      let orderedChunks = renderStaticChunkTemplate({
        createApp,
        createAppContext,
        shouldRenderRoutesOnly: shouldRenderRoutesOnly
          ? "routes"
          : renderTemplate,
      });
      orderedChunks = enhanceChunksWithViewStateCache(
        requestViewStateCache,
        orderedChunks,
        { request }
      );
      let headConfig = {};
      if (!disableServerSideRendering && !shouldRenderRoutesOnly) {
        try {
          ({ headConfig } = await preloadBlockingChunks(orderedChunks, {
            request,
          }));
        } catch (throwable) {
          if (throwable instanceof Redirect) {
            res.redirect(throwable.status, throwable.pathname);
            res.end();
            return;
          }
          logger.error(throwable);
        }
      }
      const manifest = await watchManifest;
      if (!manifest) {
        throw new Error("Cannot render the client without a manifest file");
      }
      const assets = getManifestAssetsByChunks(manifest, orderedChunks, logger);
      const hydrationChunkScript = getHydrationChunkScript(orderedChunks);

      logger.info(`Start writing response for request with url \`${req.url}\``);
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Vary", "service-worker-navigation-preload");
      res.setHeader(
        "Link",
        [...assets.css.links, ...assets.js.links].join(", ")
      );
      if (clientVersion && clientVersion !== process.env.VERSION) {
        res.status(205);
      }
      const renderHead = !shouldRenderRoutesOnly && renderTemplate !== "footer";
      if (renderHead) {
        res.write(
          htmlStart(
            `${renderHeadToString(headConfig)}${hydrationChunkScript}${[
              ...assets.css.tags,
              ...assets.js.tags,
            ].join("")}`
          )
        );
      }

      if (disableServerSideRendering && !shouldRenderRoutesOnly) {
        res.write(READY_EVENT + htmlEnd);
        res.end();
        logger.info(`End response for request with url \`${req.url}\``);
        return;
      }

      const stream = renderToChunkStream({
        orderedChunks,
        createAppContext,
        plugins,
        utils: { request },
      });
      stream.pipe(res, { end: false });
      stream.on("end", () => {
        if (!renderHead) {
          res.write(hydrationChunkScript);
        }
        if (!shouldRenderRoutesOnly && renderTemplate !== "header") {
          res.write(READY_EVENT + htmlEnd);
        }
        res.end();
        logger.info(`End response for request with url \`${req.url}\``);
      });
    } catch (err) {
      logger.error(err);
    }
  };
};

const htmlStart = (header: string) =>
  `
<!doctype html>
<html>
  <head><meta charset="UTF-8">${header}</head>
  <body>
    <main>
`.trim();
const htmlEnd = `
    </main>
  </body>
</html>
`.trim();
