import { ChunkTemplate } from "../renderer/renderStaticChunkTemplate";
import { isGeneratorValue } from "../utils/isGeneratorValue";
import { GenerateViewStateUtils } from "../types/GenerateViewStateUtils";

export const requestDataForChunks = (
  chunks: ChunkTemplate[],
  utils: GenerateViewStateUtils
): Promise<ChunkTemplate>[] => {
  return chunks.map(
    (chunk) =>
      new Promise((resolve) => {
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
            });
          });
          return;
        }

        resolve(chunk);
      })
  );
};
