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
  return async (req: express.Request, res: express.Response) => {
    logger.info(`Receive request with url \`${req.url}\``);
    const disableServerSideRendering = req.query.ssr === "0";
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
      });
      orderedChunks = enhanceChunksWithViewStateCache(
        requestViewStateCache,
        orderedChunks
      );
      if (!disableServerSideRendering) {
        try {
          orderedChunks = await preloadBlockingChunks(orderedChunks);
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
      res.setHeader(
        "Link",
        [...assets.css.links, ...assets.js.links].join(", ")
      );
      res.write(
        htmlStart(
          `${hydrationChunkScript}${[
            ...assets.css.tags,
            ...assets.js.tags,
          ].join("")}`
        )
      );

      if (disableServerSideRendering) {
        res.write(READY_EVENT);
        res.write(htmlEnd);
        res.end();
        logger.info(`End response for request with url \`${req.url}\``);
        return;
      }

      const stream = renderToChunkStream({
        orderedChunks,
        createAppContext,
        plugins,
      });
      stream.pipe(res, { end: false });
      stream.on("end", () => {
        res.write(htmlEnd);
        res.end();
        logger.info(`End response for request with url \`${req.url}\``);
      });
    } catch (err) {
      logger.error(err);
    }
  };
};

const htmlStart = (header: string) => `
  <!doctype html>
  <html>
    <head>
      ${header}
    </head>
    <body>
      <main>`;
const htmlEnd = `</main>
    </body>
  </html>
`;
