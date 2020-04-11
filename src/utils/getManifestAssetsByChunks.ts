import { Manifest } from "./requestManifest";
import { ChunkTemplate } from "../renderer/renderStaticChunkTemplate";
import { exists } from "./exists";
import { Logger } from "./logger";

export const getManifestAssetsByChunks = (
  manifest: Manifest,
  chunks: ChunkTemplate[],
  logger: Logger
) => {
  const bundleNames = chunks.map((chunk) => chunk.chunkName).filter(exists);
  const assets = {
    js: new Set<string>(),
    css: new Set<string>(),
  };
  bundleNames.forEach((bundleName) => {
    const bundle = manifest[bundleName];
    if (!bundle) {
      logger.warn(
        `Tried to resolve assets for chunk with name \`${bundleName}\` using the manifest but did not find anything. This can cause issues while hydration in the client and maybe even errors at runtime.`,
      );
      return;
    }
    bundle.js.forEach((asset) => assets.js.add(asset));
    bundle.css.forEach((asset) => assets.css.add(asset));
  });

  const cssAssetLinks = [...assets.css.values()].map(
    (asset) => `<${asset}>; rel=preload; as=style`
  );
  const cssAssetTags = [...assets.css.values()].map(
    (asset) => `<link href="${asset}" rel="stylesheet" />`
  );
  const jsAssetLinks = [...assets.js.values()].map(
    (asset) => `<${asset}>; rel=preload; as=script`
  );
  const jsAssetTags = [...assets.js.values()].map(
    (asset) => `<script src="${asset}" defer></script>`
  );

  return {
    css: {
      tags: cssAssetTags,
      links: cssAssetLinks,
    },
    js: {
      tags: jsAssetTags,
      links: jsAssetLinks,
    },
  };
};
