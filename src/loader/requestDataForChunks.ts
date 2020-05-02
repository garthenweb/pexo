import { ChunkTemplate } from "../renderer/renderStaticChunkTemplate";
import { isGeneratorValue } from "../utils/isGeneratorValue";
import { GenerateViewStateUtils } from "../types/GenerateViewStateUtils";
import { ViewStateCache } from "../types/ViewStateCache";

export const requestDataForChunks = (
  chunks: ChunkTemplate[],
  utils: GenerateViewStateUtils,
  cache: ViewStateCache
): Promise<ChunkTemplate>[] => {
  return chunks.map((chunk) =>
    new Promise<ChunkTemplate>((resolve) => {
      if (chunk.chunkCacheKey && cache.has(chunk.chunkCacheKey)) {
        return resolve({
          ...chunk,
          ...cache.get(chunk.chunkCacheKey),
        });
      }
      if (chunk.generateViewState && !chunk.viewState) {
        const request = utils.request.clone();
        Promise.resolve(
          chunk.generateViewState(chunk.props, { ...utils, request })
        ).then(async (viewState) => {
          if (!isGeneratorValue(viewState)) {
            resolve({
              ...chunk,
              viewState,
              resourceIds: request.retrieveUsedResourceIds(),
              updatedAt: Date.now(),
            });
            return;
          }
          let lastValue;
          for await (const value of viewState) {
            lastValue = value;
          }
          resolve({
            ...chunk,
            viewState: lastValue,
            resourceIds: request.retrieveUsedResourceIds(),
            updatedAt: Date.now(),
          });
        });
        return;
      }

      resolve(chunk);
    }).then((chunk) => {
      if (chunk.chunkCacheKey) {
        cache.set(chunk.chunkCacheKey, {
          viewState: chunk.viewState,
          resourceIds: chunk.resourceIds || [],
          updatedAt: chunk.updatedAt || Date.now(),
        });
      }
      return chunk;
    })
  );
};
