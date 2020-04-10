import React from "react";
import express from "express";
import { PxGlobalServerProvider } from "./context/GlobalContext";
import { renderStaticChunkTemplate } from "./renderer/renderStaticChunkTemplate";
import { renderToChunkStream } from "./renderer/renderToChunkStream";
import { preloadBlockingChunks } from "./loader/preloadBlockingChunks";
import { Redirect } from "./utils/Redirect";
import { ViewStateCache } from "./types/ViewStateCache";
import { enhanceChunksWithViewStateCache } from "./utils/enhanceChunksWithViewStateCache";

export interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (err: string | Error) => void;
}

interface MiddlewareConfig {
  createApp: () => JSX.Element;
  logger?: Logger;
  viewStateCache?: ViewStateCache
}

export const createStreamMiddleware = (config: MiddlewareConfig) => {
  const { createApp, logger, viewStateCache } = Object.assign(
    {
      logger: {
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
      },
    },
    config
  );
  return async (req: express.Request, res: express.Response) => {
    try {
      const createAppContext = (chunkNode: React.ReactNode) => (
        <PxGlobalServerProvider>{chunkNode}</PxGlobalServerProvider>
      );
      let orderedChunks = renderStaticChunkTemplate({
        createApp,
        createAppContext,
      });
      if (viewStateCache) {
        orderedChunks = enhanceChunksWithViewStateCache(
          viewStateCache,
          orderedChunks
        );
      }
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

      res.setHeader("Content-Type", "text/html");
      res.write(htmlStart);

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

const htmlStart = `
  <!doctype html>
  <html>
    <head>
    </head>
    <body>
      <main>
`;
const htmlEnd = `
      </main>
    </body>
  </html>
`;
