import { ChunkTemplate } from "../renderer/renderStaticChunkTemplate";
import { Redirect } from "../utils/Redirect";

export const preloadBlockingChunks = async (chunks: ChunkTemplate[]) => {
  const loadingChunks = chunks.map((chunk) => {
    if (chunk.isRedirect && !chunk.viewState && chunk.generateViewState) {
      return {
        ...chunk,
        viewState: chunk.generateViewState(chunk.props),
      };
    }
    return chunk;
  });

  const redirectLoader = loadingChunks
    .filter((chunk) => chunk.isRedirect && chunk.viewState)
    .map((chunk) => chunk.viewState);

  // TODO fire as soon as the first redirect resolved and was positive
  (await Promise.all(redirectLoader)).forEach((resolvedViewState) => {
    if (resolvedViewState) {
      throw new Redirect(resolvedViewState);
    }
  });

  return loadingChunks;
};
