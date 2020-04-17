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
          Promise.resolve(chunk.generateViewState(chunk.props, utils)).then(
            async (viewState) => {
              if (!isGeneratorValue(viewState)) {
                resolve({ ...chunk, viewState });
                return;
              }
              let lastValue;
              for await (const value of viewState) {
                lastValue = value;
              }
              resolve({ ...chunk, viewState: lastValue });
            }
          );
          return;
        }

        resolve(chunk);
      })
  );
};
