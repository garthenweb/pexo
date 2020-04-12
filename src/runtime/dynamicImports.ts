import { ChunkModule } from "../components/types";
import { StaticChunkModuleCache } from "../context/StaticChunkModuleCacheContext";

interface ImportMap {
  [chunkName: string]: () => Promise<ChunkModule<any, any>>;
}

export const hydrateRequiredChunks = async (
  importMap: ImportMap = globalThis.__pxChunkMap
): Promise<StaticChunkModuleCache> => {
  const chunkNames = JSON.parse(
    document.querySelector("[data-px-hydration-chunks]")?.innerHTML || "[]"
  ) as string[];

  if (chunkNames.length === 0) {
    return new Map();
  }

  const asyncChunks: Promise<
    readonly [string, ChunkModule<any, any>]
  >[] = chunkNames
    .filter((name) => importMap[name])
    .map((name) =>
      importMap[name]().then(
        (mod: ChunkModule<any, any>) => [name, mod] as const
      )
    );
  return new Map(await Promise.all(asyncChunks));
};

declare global {
  namespace globalThis {
    var __pxChunkMap: ImportMap;
  }
}
