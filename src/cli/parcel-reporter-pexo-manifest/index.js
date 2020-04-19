const { Reporter } = require("@parcel/plugin");
const path = require("path");

Object.defineProperty(exports, "__esModule", {
  value: true,
});

// https://regex101.com/r/AM0c3m/1
const REGEX_REMOVE_EXTENSION = /(?:(?:\/index)|(?:\/index)?\.(?:\w|\d)+)$/;

exports.default = new Reporter({
  async report({ event, options }) {
    if (
      event.type !== "buildSuccess" ||
      process.env.PEXO_CONTEXT !== "client"
    ) {
      return;
    }
    const { projectRoot } = options;
    const distDir = path.join(options.projectRoot, "dist");

    const manifest = {};
    for (let bundle of event.bundleGraph.getBundles()) {
      const mainBundleName = path
        .relative(projectRoot, bundle.getMainEntry().filePath)
        .replace(REGEX_REMOVE_EXTENSION, "");
      manifest[mainBundleName] = manifest[mainBundleName] || {
        js: [],
        css: [],
        isEntry: bundle.isEntry,
        isWorker: bundle.env.isWorker(),
      };
      if (bundle.type === "js" || bundle.type === "css") {
        manifest[mainBundleName][bundle.type].push(
          path.relative(distDir, bundle.filePath)
        );
      }
    }

    options.outputFS.writeFile(
      path.join(distDir, "manifest.json"),
      JSON.stringify(manifest, null, "  ")
    );
  },
});
