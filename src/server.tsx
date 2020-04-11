import React from "react";
import express from "express";
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

interface MiddlewareConfig {
  createApp: () => JSX.Element;
  logger?: Logger;
  viewStateCache?: ViewStateCache;
  requestManifest?: () => Promise<Manifest>;
}

export const createStreamMiddleware = (config: MiddlewareConfig) => {
  const {
    createApp,
    logger = createDefaultLogger(),
    viewStateCache,
    requestManifest = createDefaultManifestRequester(),
  } = config;
  const watchManifest = requestManifest({
    shouldWatch: process.env.NODE_ENV !== "production",
  });
  return async (req: express.Request, res: express.Response) => {
    const requestViewStateCache = viewStateCache ?? new Map();
    try {
      const createAppContext = (chunkNode: React.ReactNode) => (
        <PxGlobalServerProvider>{chunkNode}</PxGlobalServerProvider>
      );
      let orderedChunks = renderStaticChunkTemplate({
        createApp,
        createAppContext,
      });
      orderedChunks = enhanceChunksWithViewStateCache(
        requestViewStateCache,
        orderedChunks
      );
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
      const manifest = await watchManifest;
      if (!manifest) {
        throw new Error("Cannot render the client without a manifest file");
      }
      const assets = getManifestAssetsByChunks(manifest, orderedChunks, logger);

      res.setHeader("Content-Type", "text/html");
      res.setHeader(
        "Link",
        [...assets.css.links, ...assets.js.links].join(", ")
      );
      res.write(htmlStart([...assets.css.tags, ...assets.js.tags].join("")));

      const stream = renderToChunkStream({
        orderedChunks,
        createAppContext,
      });
      stream.pipe(res, { end: false });
      stream.on("end", () => {
        res.write(htmlEnd);
        res.end();
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
      <main>
`;
const htmlEnd = `
      </main>
    </body>
  </html>
`;
