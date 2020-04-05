import React from "react";
import ReactDOMServer from "react-dom/server";
import { ReactNode } from "react";
import { Writable, PassThrough } from "stream";
import { ChunkTemplate } from "./renderStaticChunkTemplate";

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

  fetchDataForChunks(orderedChunks)
    .reduce(
      (queue, chunk) =>
        queue.then(async () => {
          const viewProps = await chunk.viewState;
          const chunkNode = chunk.View ? <chunk.View {...viewProps} /> : null;
          const chunkStream = ReactDOMServer.renderToNodeStream(
            createAppContext(chunkNode)
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

const fetchDataForChunks = (chunks: ChunkTemplate[]) => {
  return chunks.map((chunk) => ({
    ...chunk,
    viewState: chunk.generateViewState
      ? chunk.generateViewState(chunk.props)
      : {},
  }));
};
