const { Runtime } = require("@parcel/plugin");
const path = require("path");

Object.defineProperty(exports, "__esModule", {
  value: true,
});

// https://regex101.com/r/AM0c3m/2
const REGEX_REMOVE_EXTENSION = /(?:(?:\/index)|(?:\/index)?\.(?:js|mjs|jsm|jsx|es6|cjs|ts|tsx)+)$/;

exports.default = new Runtime({
  apply({ bundle, bundleGraph, options }) {
    if (
      bundle.type !== "js" ||
      !bundle.isEntry ||
      process.env.PEXO_CONTEXT !== "client"
    ) {
      return;
    }

    let asyncDependencies = [];
    bundle.traverse((node) => {
      if (node.type !== "dependency") {
        return;
      }
      let dependency = node.value;
      if (dependency.isAsync && !dependency.isURL) {
        asyncDependencies.push(dependency);
      }
    });

    const chunkMap = new Map();
    for (let dependency of asyncDependencies) {
      let resolved = bundleGraph.resolveAsyncDependency(dependency, bundle);
      if (!resolved) {
        continue;
      }
      const assetFilePath = path.resolve(
        path.dirname(dependency.sourcePath),
        dependency.moduleSpecifier
      );
      chunkMap.set(
        path
          .relative(process.cwd(), assetFilePath)
          .replace(REGEX_REMOVE_EXTENSION, ""),
        getLoaderRuntimes({
          bundle,
          bundleGraph,
          bundleGroup: resolved.value,
        })
      );
    }

    return {
      filePath: __filename,
      code: `globalThis.__pxChunkMap = {${[...chunkMap.entries()]
        .map(
          ([chunkName, importPath]) => `["${chunkName}"]: () => ${importPath}`
        )
        .join(",")}};`,
      isEntry: true,
    };
  },
});

// the following code is mostly a copy of @parcel/runtime-js
function getLoaderRuntimes({ bundle, bundleGroup, bundleGraph }) {
  // Sort so the bundles containing the entry asset appear last
  let externalBundles = bundleGraph
    .getBundlesInBundleGroup(bundleGroup)
    .filter((bundle) => !bundle.isInline)
    .sort((bundle) =>
      bundle
        .getEntryAssets()
        .map((asset) => asset.id)
        .includes(bundleGroup.entryAssetId)
        ? 1
        : -1
    );

  // CommonJS is a synchronous module system, so there is no need to load bundles in parallel.
  // Importing of the other bundles will be handled by the bundle group entry.
  // Do the same thing in library mode for ES modules, as we are building for another bundler
  // and the imports for sibling bundles will be in the target bundle.
  if (bundle.env.outputFormat === "commonjs" || bundle.env.isLibrary) {
    externalBundles = externalBundles.slice(-1);
  }

  let loaders = getLoaders(bundle.env);

  // Determine if we need to add a dynamic import() polyfill, or if all target browsers support it natively.
  let needsDynamicImportPolyfill = false;
  if (bundle.env.isBrowser() && bundle.env.outputFormat === "esmodule") {
    needsDynamicImportPolyfill = !bundle.env.matchesEngines(
      DYNAMIC_IMPORT_BROWSERS
    );
  }

  let loaderModules = loaders
    ? externalBundles
        .map((to) => {
          let loader = loaders[to.type];
          if (!loader) {
            return;
          }

          let relativePathExpr = getRelativePathExpr(bundle, to);

          // Use esmodule loader if possible
          if (to.type === "js" && to.env.outputFormat === "esmodule") {
            if (!needsDynamicImportPolyfill) {
              return `import("./" + ${relativePathExpr})`;
            }

            loader = nullthrows(
              loaders.IMPORT_POLYFILL,
              `No import() polyfill available for context '${bundle.env.context}'`
            );
          } else if (to.type === "js" && to.env.outputFormat === "commonjs") {
            return `Promise.resolve(require("./" + ${relativePathExpr}))`;
          }

          return `require(${JSON.stringify(
            loader
          )})(require('@parcel/runtime-js/lib/bundle-url').getBundleURL() + ${relativePathExpr})`;
        })
        .filter(Boolean)
    : [];

  if (loaderModules.length > 0) {
    let loaders = loaderModules.join(", ");
    if (
      loaderModules.length > 1 &&
      (bundle.env.outputFormat === "global" ||
        !externalBundles.every((b) => b.type === "js"))
    ) {
      loaders = `Promise.all([${loaders}])`;
      if (bundle.env.outputFormat !== "global") {
        loaders += `.then(r => r[r.length - 1])`;
      }
    } else {
      loaders = `(${loaders})`;
    }

    if (bundle.env.outputFormat === "global") {
      loaders += `.then(() => parcelRequire('${bundleGraph.getAssetPublicId(
        bundleGraph.getAssetById(bundleGroup.entryAssetId)
      )}')${
        // In global output with scope hoisting, functions return exports are
        // always returned. Otherwise, the exports are returned.
        bundle.env.scopeHoist ? "()" : ""
      })`;
    }
    return loaders;
  }

  return "";
}

// List of browsers that support dynamic import natively
// https://caniuse.com/#feat=es6-module-dynamic-import
const DYNAMIC_IMPORT_BROWSERS = {
  edge: "76",
  firefox: "67",
  chrome: "63",
  safari: "11.1",
  opera: "50",
};

const LOADERS = {
  browser: {
    css: "@parcel/runtime-js/lib/loaders/browser/css-loader",
    html: "@parcel/runtime-js/lib/loaders/browser/html-loader",
    js: "@parcel/runtime-js/lib/loaders/browser/js-loader",
    wasm: "@parcel/runtime-js/lib/loaders/browser/wasm-loader",
    IMPORT_POLYFILL: "@parcel/runtime-js/lib/loaders/browser/import-polyfill",
  },
  worker: {
    js: "@parcel/runtime-js/lib/loaders/worker/js-loader",
    wasm: "@parcel/runtime-js/lib/loaders/worker/wasm-loader",
    IMPORT_POLYFILL: false,
  },
  node: {
    css: "@parcel/runtime-js/lib/loaders/node/css-loader",
    html: "@parcel/runtime-js/lib/loaders/node/html-loader",
    js: "@parcel/runtime-js/lib/loaders/node/js-loader",
    wasm: "@parcel/runtime-js/lib/loaders/node/wasm-loader",
    IMPORT_POLYFILL: null,
  },
};
function getLoaders(ctx) {
  if (ctx.isWorker()) return LOADERS.worker;
  if (ctx.isBrowser()) return LOADERS.browser;
  if (ctx.isNode()) return LOADERS.node;
  return null;
}

function getRelativePathExpr(from, to) {
  if (shouldUseRuntimeManifest(from)) {
    return `require('@parcel/runtime-js/lib/relative-path')(${JSON.stringify(
      from.publicId
    )}, ${JSON.stringify(to.publicId)})`;
  }

  return JSON.stringify(
    relativeBundlePath(from, to, { leadingDotSlash: false })
  );
}

function shouldUseRuntimeManifest(bundle) {
  let env = bundle.env;
  return !env.isLibrary && env.outputFormat === "global" && env.isBrowser();
}
