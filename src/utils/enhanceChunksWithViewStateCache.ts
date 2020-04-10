import { ViewStateCache } from "../types/ViewStateCache";
import { ChunkTemplate } from "../renderer/renderStaticChunkTemplate";
import { isSyncValue } from "./isSyncValue";

export const enhanceChunksWithViewStateCache = (
  cache: ViewStateCache,
  chunks: ChunkTemplate[]
) => {
  return chunks.map((chunk) => {
    if (!chunk.generateViewState) {
      return chunk;
    }
    return {
      ...chunk,
      generateViewState: (props: any) => {
        if (chunk.chunkCacheKey && cache.has(chunk.chunkCacheKey)) {
          return cache.get(chunk.chunkCacheKey);
        }
        if (chunk.generateViewState && chunk.chunkCacheKey) {
          const viewState = chunk.generateViewState(props);
          if (isSyncValue(viewState)) {
            cache.set(chunk.chunkCacheKey, viewState);
            return viewState;
          }
          return Promise.resolve(viewState).then((res) => {
            cache.set(chunk.chunkCacheKey!, res);
            return res;
          });
        }
        return;
      },
    };
  });
};
