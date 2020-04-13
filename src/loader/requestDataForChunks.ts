import { ChunkTemplate } from "../renderer/renderStaticChunkTemplate";
import { isGeneratorValue } from "../utils/isGeneratorValue";

export const requestDataForChunks = (
  chunks: ChunkTemplate[]
): Promise<ChunkTemplate>[] => {
  return chunks.map(
    (chunk) =>
      new Promise((resolve) => {
        if (chunk.generateViewState && !chunk.viewState) {
          Promise.resolve(chunk.generateViewState(chunk.props)).then(
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
