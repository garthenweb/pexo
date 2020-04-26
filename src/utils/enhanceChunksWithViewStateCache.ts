import { ViewStateCache } from "../types/ViewStateCache";
import { ChunkTemplate } from "../renderer/renderStaticChunkTemplate";
import { isSyncValue } from "./isSyncValue";
import { GenerateViewStateUtils } from "../types/GenerateViewStateUtils";

export const enhanceChunksWithViewStateCache = (
  cache: ViewStateCache,
  chunks: ChunkTemplate[],
  utils: GenerateViewStateUtils
) => {
  return chunks.map((chunk) => {
    if (!chunk.generateViewState) {
      return chunk;
    }
    return {
      ...chunk,
      generateViewState: (props: any) => {
        if (chunk.chunkCacheKey && cache.has(chunk.chunkCacheKey)) {
          return cache.get(chunk.chunkCacheKey)!.viewState;
        }
        if (chunk.generateViewState && chunk.chunkCacheKey) {
          const request = utils.request.clone();
          const viewState = chunk.generateViewState(props, {
            ...utils,
            request,
          });
          if (isSyncValue(viewState)) {
            cache.set(chunk.chunkCacheKey, {
              viewState,
              resourceIds: request.retrieveUsedResourceIds(),
            });
            return viewState;
          }
          return Promise.resolve(viewState).then((res) => {
            cache.set(chunk.chunkCacheKey!, {
              viewState: res,
              resourceIds: request.retrieveUsedResourceIds(),
            });
            return res;
          });
        }
        return;
      },
    };
  });
};
