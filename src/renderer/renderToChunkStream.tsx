import React from "react";
import ReactDOMServer from "react-dom/server";
import { ReactNode } from "react";
import { Writable, PassThrough } from "stream";
import { ChunkTemplate } from "./renderStaticChunkTemplate";
import { requestDataForChunks } from "../loader/requestDataForChunks";

interface Config {
  orderedChunks: ChunkTemplate[];
  createAppContext: (node: ReactNode) => JSX.Element;
}

export const renderToChunkStream = ({
  orderedChunks,
  createAppContext,
}: Config) => {
  const writable = new Writable();
  const stream = new PassThrough();

  stream.pipe(writable);
  stream.unpipe(writable);

  requestDataForChunks(orderedChunks)
    .reduce(
      (queue, chunk) =>
        queue.then(async () => {
          const chunkNodes = await generateChunkNodes(chunk);
          const chunkStream = ReactDOMServer.renderToNodeStream(
            createAppContext(chunkNodes)
          );
          chunkStream.pipe(stream, { end: false });
          await new Promise((resolve) =>
            chunkStream.on("end", () => {
              stream.write(chunk.nextTemplateChunk);
              resolve();
            })
          );
        }),
      Promise.resolve()
    )
    .then(() => stream.end());

  return stream;
};

const generateChunkNodes = async (chunk: ChunkTemplate) => {
  const resolvedViewState = await chunk.viewState;
  const chunkNode = chunk.View ? (
    <chunk.View key={1} {...resolvedViewState} />
  ) : null;
  const scriptNode = chunk.chunkCacheKey ? (
    <script
      key={2}
      defer
      data-px-chunk-view-state={chunk.chunkCacheKey}
      dangerouslySetInnerHTML={{
        __html: `window.pxProvider.viewStateCache['${
          chunk.chunkCacheKey
        }'] = ${JSON.stringify(resolvedViewState)}`,
      }}
    />
  ) : null;
  return [chunkNode, scriptNode];
};
