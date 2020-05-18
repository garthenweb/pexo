const { Reporter } = require("@parcel/plugin");
const path = require("path");

Object.defineProperty(exports, "__esModule", {
  value: true,
});

// https://regex101.com/r/AM0c3m/2
const REGEX_REMOVE_EXTENSION = /(?:(?:\/index)|(?:\/index)?\.(?:js|mjs|jsm|jsx|es6|cjs|ts|tsx)+)$/;

exports.default = new Reporter({
  async report({ event, options }) {
    if (
      event.type !== "buildSuccess" ||
      process.env.PEXO_CONTEXT !== "client"
    ) {
      return;
    }
    const { distDir } = options;
    const serverDistDir = path.dirname(distDir);
    const manifest = {};
    for (let bundle of event.bundleGraph.getBundles()) {
      const mainEntryBundle = bundle.getMainEntry();
      if (mainEntryBundle) {
        const mainBundleName = path
          .relative(process.cwd(), mainEntryBundle.filePath)
          .replace(REGEX_REMOVE_EXTENSION, "");
        manifest[mainBundleName] = manifest[mainBundleName] || {
          js: [],
          css: [],
          isEntry: bundle.isEntry,
          isWorker: bundle.env.isWorker(),
        };
        if (bundle.type === "js" || bundle.type === "css") {
          manifest[mainBundleName][bundle.type].push(
            path.relative(serverDistDir, bundle.filePath)
          );
        }
      }
    }

    options.outputFS.writeFile(
      path.join(serverDistDir, "manifest.json"),
      JSON.stringify(manifest, null, "  ")
    );
  },
});
