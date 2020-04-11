import { Manifest, ManifestItem } from "./requestManifest";
import { ChunkTemplate } from "../renderer/renderStaticChunkTemplate";
import { exists } from "./exists";
import { Logger } from "./logger";

export const getManifestAssetsByChunks = (
  manifest: Manifest,
  chunks: ChunkTemplate[],
  logger: Logger
) => {
  const bundleNames = chunks.map((chunk) => chunk.chunkName).filter(exists);
  const entryAssets = {
    js: new Set<string>(),
    css: new Set<string>(),
  };
  const chunkAssets = {
    js: new Set<string>(),
    css: new Set<string>(),
  };

  Object.values(manifest).forEach((bundle) => {
    if (bundle.isEntry) {
      bundle.js.forEach((asset) => entryAssets.js.add(asset));
      bundle.css.forEach((asset) => entryAssets.css.add(asset));
    }
  });

  bundleNames.forEach((bundleName) => {
    const bundle = manifest[bundleName];
    if (!bundle) {
      logger.warn(
        `Tried to resolve assets for chunk with name \`${bundleName}\` using the manifest but did not find anything. This can cause issues while hydration in the client and maybe even errors at runtime.`
      );
      return;
    }
    bundle.js.forEach((asset) => chunkAssets.js.add(asset));
    bundle.css.forEach((asset) => chunkAssets.css.add(asset));
  });

  const cssAssetLinks = [
    ...entryAssets.css.values(),
    ...chunkAssets.css.values(),
  ].map((asset) => `<${asset}>; rel=preload; as=style`);
  const cssAssetTags = [
    ...entryAssets.css.values(),
    ...chunkAssets.css.values(),
  ].map((asset) => `<link href="${asset}" rel="stylesheet" />`);
  const jsAssetLinks = [
    ...entryAssets.js.values(),
    ...chunkAssets.js.values(),
  ].map((asset) => `<${asset}>; rel=preload; as=script`);
  const jsAssetTags = [...entryAssets.js.values()].map(
    (asset) => `<script src="${asset}" async></script>`
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
