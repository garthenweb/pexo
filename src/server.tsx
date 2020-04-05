import React from "react";
import express from "express";
import { PxGlobalServerProvider } from "./context/GlobalContext";
import { renderStaticChunkTemplate } from "./renderer/renderStaticChunkTemplate";
import { renderToChunkStream } from "./renderer/renderToChunkStream";

export interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (err: string | Error) => void;
}

interface MiddlewareConfig {
  createApp: () => JSX.Element;
  logger?: Logger;
}

export const createStreamMiddleware = (config: MiddlewareConfig) => {
  const { createApp, logger } = Object.assign(
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
      const orderedChunks = renderStaticChunkTemplate({
        createApp,
        createAppContext,
      });
      // await preloadBlockingChunks(chunks);

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
