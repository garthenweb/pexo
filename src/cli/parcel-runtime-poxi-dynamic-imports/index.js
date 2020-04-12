const { Runtime } = require("@parcel/plugin");
const path = require("path");

Object.defineProperty(exports, "__esModule", {
  value: true,
});

// https://regex101.com/r/AM0c3m/1
const REGEX_REMOVE_EXTENSION = /(?:(?:\/index)|(?:\/index)?\.(?:\w|\d)+)$/;

exports.default = new Runtime({
  apply({ bundle, bundleGraph, options }) {
    if (bundle.type !== "js" || !bundle.isEntry) {
      return;
    }
    const { projectRoot } = options;
    const distDir = path.join(options.projectRoot, "dist");
    const mainBundleName = path.relative(
      projectRoot,
      bundle.getMainEntry().filePath
    );

    const chunkMap = new Map();
    for (let b of bundleGraph.getBundles()) {
      if (bundle === b) {
        continue;
      }
      const mainBundleName = path.relative(
        projectRoot,
        b.getMainEntry().filePath
      );
      const importBundleName = path.relative(
        __dirname,
        b.getMainEntry().filePath
      );
      chunkMap.set(
        mainBundleName.replace(REGEX_REMOVE_EXTENSION, ""),
        importBundleName
      );
    }

    return {
      filePath: __filename,
      code: `globalThis.__pxChunkMap = {${[...chunkMap.entries()]
        .map(
          ([chunkName, importPath]) =>
            `["${chunkName}"]: () => import("${importPath}")`
        )
        .join(",")}};`,
      isEntry: true,
    };
  },
});
