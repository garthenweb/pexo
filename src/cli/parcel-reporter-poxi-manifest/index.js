const { Reporter } = require("@parcel/plugin");
const path = require("path");

Object.defineProperty(exports, "__esModule", {
  value: true,
});

exports.default = new Reporter({
  async report({ event, options }) {
    if (event.type !== "buildSuccess" || process.env.POXI_CONTEXT !== "client") {
      return;
    }
    const { projectRoot } = options;

    const manifest = {};
    for (let bundle of event.bundleGraph.getBundles()) {
      const mainBundleName = path.relative(
        projectRoot,
        bundle.getMainEntry().filePath
      );
      manifest[mainBundleName] = manifest[mainBundleName] || {
        js: [],
        css: [],
      };
      if (bundle.type === "js" || bundle.type === "css") {
        manifest[mainBundleName][bundle.type].push(
          path.relative(projectRoot, bundle.filePath)
        );
      }
    }

    options.outputFS.writeFile(
      path.join(options.projectRoot, "dist", "manifest.json"),
      JSON.stringify(manifest, null, "  ")
    );
  },
});
