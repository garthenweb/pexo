import { ChunkTemplate } from "../renderer/renderStaticChunkTemplate";
import { exists } from "@pexo/utils";

export const getHydrationChunkScript = (chunks: ChunkTemplate[]) => {
  const chunkNames = chunks.map((chunk) => chunk.chunkName).filter(exists);
  return `<script type="application/json" data-px-runtime data-px-hydration-chunks>${JSON.stringify(
    chunkNames
  )}</script>`;
};
