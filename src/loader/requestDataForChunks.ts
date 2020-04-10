import { ChunkTemplate } from "../renderer/renderStaticChunkTemplate";

export const requestDataForChunks = (
  chunks: ChunkTemplate[]
): Promise<ChunkTemplate>[] => {
  return chunks.map(
    (chunk) =>
      new Promise((resolve) => {
        if (chunk.generateViewState && !chunk.viewState) {
          Promise.resolve(
            chunk.generateViewState(chunk.props)
          ).then((viewState) => resolve({ ...chunk, viewState }));
          return;
        }

        resolve(chunk);
      })
  );
};
