import { ChunkTemplate } from "../renderer/renderStaticChunkTemplate";

export const requestDataForChunks = (chunks: ChunkTemplate[]) => {
  return chunks.map((chunk) => ({
    ...chunk,
    viewState:
      !chunk.viewState && chunk.generateViewState
        ? chunk.generateViewState(chunk.props)
        : chunk.viewState,
  }));
};
