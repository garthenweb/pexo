const { Runtime } = require("@parcel/plugin");
const path = require("path");

Object.defineProperty(exports, "__esModule", {
  value: true,
});

// https://regex101.com/r/AM0c3m/2
const REGEX_REMOVE_EXTENSION = /(?:(?:\/index)|(?:\/index)?\.(?:js|mjs|jsm|jsx|es6|cjs|ts|tsx)+)$/;

exports.default = new Runtime({
  apply({ bundle, bundleGraph }) {
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
      const runtime = getLoaderRuntime({
        bundle,
        bundleGraph,
        bundleGroup: resolved.value,
      });
      chunkMap.set(
        path
          .relative(process.cwd(), assetFilePath)
          .replace(REGEX_REMOVE_EXTENSION, ""),
        runtime ? runtime.code : ""
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

// nullthrows is a copy from https://github.com/zertosh/nullthrows/blob/master/nullthrows.js
function nullthrows(x, message) {
  if (x != null) {
    return x;
  }
  var error = new Error(
    message !== undefined ? message : "Got unexpected " + x
  );
  error.framesToPop = 1; // Skip nullthrows's own stack frame.
  throw error;
}

//
// the following code is mostly a copy of @parcel/runtime-js
//
const { flatMap, relativeBundlePath } = require("@parcel/utils");

// List of browsers that support dynamic import natively
// https://caniuse.com/#feat=es6-module-dynamic-import
const DYNAMIC_IMPORT_BROWSERS = {
  edge: "76",
  firefox: "67",
  chrome: "63",
  safari: "11.1",
  opera: "50",
};

// Used for as="" in preload/prefetch
const TYPE_TO_RESOURCE_PRIORITY = {
  css: "style",
  js: "script",
};

const BROWSER_PRELOAD_LOADER =
  "@parcel/runtime-js/lib/loaders/browser/preload-loader";
const BROWSER_PREFETCH_LOADER =
  "@parcel/runtime-js/lib/loaders/browser/prefetch-loader";

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

function getLoaderRuntime({ bundle, bundleGroup, bundleGraph }) {
  let loaders = getLoaders(bundle.env);
  if (loaders == null) {
    return;
  }

  let externalBundles = bundleGraph
    .getBundlesInBundleGroup(bundleGroup)
    .filter((bundle) => !bundle.isInline);

  let mainBundle = nullthrows(
    externalBundles.find(
      (bundle) => bundle.getMainEntry()?.id === bundleGroup.entryAssetId
    )
  );

  // CommonJS is a synchronous module system, so there is no need to load bundles in parallel.
  // Importing of the other bundles will be handled by the bundle group entry.
  // Do the same thing in library mode for ES modules, as we are building for another bundler
  // and the imports for sibling bundles will be in the target bundle.
  if (bundle.env.outputFormat === "commonjs" || bundle.env.isLibrary) {
    externalBundles = [mainBundle];
  } else {
    // Otherwise, load the bundle group entry after the others.
    externalBundles.splice(externalBundles.indexOf(mainBundle), 1);
    externalBundles.reverse().push(mainBundle);
  }

  // Determine if we need to add a dynamic import() polyfill, or if all target browsers support it natively.
  let needsDynamicImportPolyfill = false;
  if (bundle.env.isBrowser() && bundle.env.outputFormat === "esmodule") {
    needsDynamicImportPolyfill = !bundle.env.matchesEngines(
      DYNAMIC_IMPORT_BROWSERS
    );
  }

  let loaderModules = externalBundles
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
    .filter(Boolean);

  if (bundle.env.context === "browser") {
    loaderModules.push(
      ...flatMap(
        // TODO: Allow css to preload resources as well
        externalBundles.filter((to) => to.type === "js"),
        (from) => {
          let { preload, prefetch } = getHintedBundleGroups(bundleGraph, from);

          return [
            ...getHintLoaders(
              bundleGraph,
              bundle,
              preload,
              BROWSER_PRELOAD_LOADER
            ),
            ...getHintLoaders(
              bundleGraph,
              bundle,
              prefetch,
              BROWSER_PREFETCH_LOADER
            ),
          ];
        }
      )
    );
  }

  if (loaderModules.length === 0) {
    return;
  }

  let loaderCode = loaderModules.join(", ");
  if (
    loaderModules.length > 1 &&
    (bundle.env.outputFormat === "global" ||
      !externalBundles.every((b) => b.type === "js"))
  ) {
    loaderCode = `Promise.all([${loaderCode}])`;
    if (bundle.env.outputFormat !== "global") {
      loaderCode += `.then(r => r[r.length - 1])`;
    }
  } else {
    loaderCode = `(${loaderCode})`;
  }

  if (bundle.env.outputFormat === "global") {
    loaderCode += `.then(() => module.bundle.root('${bundleGraph.getAssetPublicId(
      bundleGraph.getAssetById(bundleGroup.entryAssetId)
    )}')${
      // In global output with scope hoisting, functions return exports are
      // always returned. Otherwise, the exports are returned.
      bundle.env.scopeHoist ? "()" : ""
    })`;
  }

  // THIS EXPORT WAS CHANGED, WE ONLY RETURN CODE
  return {
    code: loaderCode,
  };
}

function getHintedBundleGroups(bundleGraph, bundle) {
  let preload = [];
  let prefetch = [];
  bundle.traverse((node) => {
    if (node.type !== "dependency") {
      return;
    }

    let dependency = node.value;
    // $FlowFixMe
    let attributes = dependency.meta?.importAttributes;
    if (
      dependency.isAsync &&
      !dependency.isURL &&
      typeof attributes === "object" &&
      attributes != null &&
      // $FlowFixMe
      (attributes.preload || attributes.prefetch)
    ) {
      let resolved = bundleGraph.resolveAsyncDependency(dependency, bundle);
      if (resolved?.type === "bundle_group") {
        // === true for flow
        if (attributes.preload === true) {
          preload.push(resolved.value);
        }
        if (attributes.prefetch === true) {
          prefetch.push(resolved.value);
        }
      }
    }
  });

  return { preload, prefetch };
}

function getHintLoaders(bundleGraph, from, bundleGroups, loader) {
  let hintLoaders = [];
  for (let bundleGroupToPreload of bundleGroups) {
    let bundlesToPreload = bundleGraph.getBundlesInBundleGroup(
      bundleGroupToPreload
    );

    for (let bundleToPreload of bundlesToPreload) {
      let relativePathExpr = getRelativePathExpr(from, bundleToPreload);
      let priority = TYPE_TO_RESOURCE_PRIORITY[bundleToPreload.type];
      hintLoaders.push(
        `require(${JSON.stringify(
          loader
        )})(require('@parcel/runtime-js/lib/bundle-url').getBundleURL() + ${relativePathExpr}, ${
          priority ? JSON.stringify(priority) : "null"
        }, ${JSON.stringify(
          bundleToPreload.target.env.outputFormat === "esmodule"
        )})`
      );
    }
  }

  return hintLoaders;
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
