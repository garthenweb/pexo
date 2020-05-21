import { ChunkTemplate } from "../renderer/renderStaticChunkTemplate";
import { exists } from "@pexo/utils";
import { CacheItem } from "@pexo/request";

export const getHydrationChunkScript = (chunks: ChunkTemplate[]) => {
  const chunkNames = chunks.map((chunk) => chunk.chunkName).filter(exists);
  return `<script type="application/json" data-px-runtime data-px-hydration-chunks>${JSON.stringify(
    chunkNames
  )}</script>`;
};

export const getHydrationResourceScript = (
  resources: [string, CacheItem<any>][]
) => {
  return resources
    .map(([key, resource]) => {
      return `<script type="application/json" data-px-runtime data-px-hydration-resource-key="${key}">${JSON.stringify(
        resource
      )}</script>`;
    })
    .reduce((all, script) => all + script, "");
};
