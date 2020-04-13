import React, { ReactNode } from "react";
import ReactDOMServer from "react-dom/server";
import { ServerStyleSheet } from "styled-components";
import { Writable, PassThrough } from "stream";
import { ChunkTemplate } from "./renderStaticChunkTemplate";
import { requestDataForChunks } from "../loader/requestDataForChunks";
import { executePromiseQueue } from "../utils/executePromiseQueue";
import { Plugin } from "../plugins";

interface Config {
  orderedChunks: ChunkTemplate[];
  createAppContext: (node: ReactNode) => JSX.Element;
  plugins: Plugin[];
}

export const renderToChunkStream = ({
  orderedChunks,
  createAppContext,
  plugins,
}: Config) => {
  const writable = new Writable();
  const stream = new PassThrough();

  stream.pipe(writable);
  stream.unpipe(writable);

  executePromiseQueue(
    requestDataForChunks(orderedChunks),
    async (chunk: ChunkTemplate) => {
      const chunkNodes = generateChunkNodes(chunk);
      let chunkStream: NodeJS.ReadableStream;
      if (plugins.includes("styled-components")) {
        const sheet = new ServerStyleSheet();
        const jsx = sheet.collectStyles(createAppContext(chunkNodes));
        chunkStream = sheet.interleaveWithNodeStream(
          ReactDOMServer.renderToNodeStream(jsx)
        );
      } else {
        chunkStream = ReactDOMServer.renderToNodeStream(
          createAppContext(chunkNodes)
        );
      }

      chunkStream.pipe(stream, { end: false });
      await new Promise((resolve) =>
        chunkStream.on("end", () => {
          stream.write(chunk.nextTemplateChunk);
          resolve();
        })
      );
    }
  ).finally(() => {
    stream.write(
      `<script data-px-runtime>window.__px = window.__px || []; window.__px.push('start')</script>`
    );
    stream.end();
  });

  return stream;
};

const generateChunkNodes = (chunk: ChunkTemplate) => {
  const resolvedViewState = chunk.viewState ?? {};
  const chunkNode = chunk.View ? (
    <chunk.View key={1} {...resolvedViewState} />
  ) : null;
  const scriptNode = chunk.chunkCacheKey ? (
    <script
      key={2}
      type="application/json"
      data-px-runtime
      data-px-chunk-view-state-cache-key={chunk.chunkCacheKey}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(resolvedViewState),
      }}
    />
  ) : null;
  return [chunkNode, scriptNode];
};
