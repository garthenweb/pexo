import { ChunkTemplate } from "../renderer/renderStaticChunkTemplate";
import { Redirect } from "../utils/Redirect";
import { executePromiseQueue } from "../utils/executePromiseQueue";
import { requestDataForChunks } from "./requestDataForChunks";

export const preloadBlockingChunks = async (chunks: ChunkTemplate[]) => {
  const redirectLoader = chunks.filter(
    (chunk) => chunk.isRedirect && chunk.generateViewState
  );

  await executePromiseQueue(requestDataForChunks(redirectLoader), (chunk) => {
    if (chunk.viewState) {
      throw new Redirect(chunk.viewState);
    }
  });

  return chunks;
};
