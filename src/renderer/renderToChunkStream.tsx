import React, { ReactNode } from "react";
import ReactDOMServer from "react-dom/server";
import { ServerStyleSheet } from "styled-components";
import { Writable, PassThrough } from "stream";
import { ChunkTemplate } from "./renderStaticChunkTemplate";
import { requestDataForChunks } from "../loader/requestDataForChunks";
import { executePromiseQueue } from "../utils/executePromiseQueue";
import { Plugin } from "../plugins";
import { GenerateViewStateUtils } from "../types/GenerateViewStateUtils";
import { ViewStateCache } from "../types/ViewStateCache";

interface Config {
  orderedChunks: ChunkTemplate[];
  createAppContext: (node: ReactNode) => JSX.Element;
  viewStateCache: ViewStateCache;
  plugins: Plugin[];
  utils: GenerateViewStateUtils;
}

export const renderToChunkStream = ({
  orderedChunks,
  createAppContext,
  viewStateCache,
  plugins,
  utils,
}: Config) => {
  const writable = new Writable();
  const stream = new PassThrough();

  stream.pipe(writable);
  stream.unpipe(writable);

  executePromiseQueue(
    requestDataForChunks(orderedChunks, utils, viewStateCache),
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
    stream.end();
  });

  return stream;
};

const createServerActions = (keys: string[]) => {
  const actions = {};
  keys.forEach((key) => {
    actions[key] = () =>
      new Error(
        "View actions should never be called on the server. This most often happens when the action was accidentally used in the render function and was not wrapped into an effect or an event handler."
      );
  });
  return actions;
};

const generateChunkNodes = (chunk: ChunkTemplate) => {
  const resolvedViewState = chunk.viewState ?? {};
  const resourceIds = chunk.resourceIds ?? [];
  const updatedAt = chunk.updatedAt ?? Date.now();
  const actions = chunk.actionKeys && createServerActions(chunk.actionKeys);
  const chunkNode = chunk.View ? (
    <chunk.View key={1} {...resolvedViewState} actions={actions} />
  ) : null;
  const scriptNode = chunk.chunkCacheKey ? (
    <script
      key={2}
      type="application/json"
      data-px-runtime
      data-px-chunk-view-state-cache-key={chunk.chunkCacheKey}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          viewState: resolvedViewState,
          resourceIds,
          updatedAt,
        }),
      }}
    />
  ) : null;
  return [chunkNode, scriptNode];
};
