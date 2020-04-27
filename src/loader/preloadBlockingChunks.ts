import { ChunkTemplate } from "../renderer/renderStaticChunkTemplate";
import { Redirect } from "../utils/Redirect";
import { executePromiseQueue } from "../utils/executePromiseQueue";
import { requestDataForChunks } from "./requestDataForChunks";
import { GenerateViewStateUtils } from "../types/GenerateViewStateUtils";
import { ViewStateCache } from "../types/ViewStateCache";

export const preloadBlockingChunks = async (
  chunks: ChunkTemplate[],
  utils: GenerateViewStateUtils,
  viewStateCache: ViewStateCache
) => {
  const redirectLoader = chunks.filter(
    (chunk) => chunk.isRedirect && chunk.generateViewState
  );
  const headLoader = chunks.filter(
    (chunk) => chunk.isHead && chunk.generateViewState
  );

  const redirectRequests = requestDataForChunks(
    redirectLoader,
    utils,
    viewStateCache
  );
  const headRequests = requestDataForChunks(headLoader, utils, viewStateCache);
  await executePromiseQueue(redirectRequests, (chunk) => {
    if (chunk.viewState) {
      throw new Redirect(chunk.viewState);
    }
  });
  const headConfig = {};
  await executePromiseQueue(headRequests, (chunk) => {
    if (chunk.viewState) {
      Object.assign(headConfig, chunk.viewState);
    }
  });

  return { headConfig };
};
