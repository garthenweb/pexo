const path = require("path");
const ALLOWED_REACT_COMPONENTS = ["Chunk", "RedirectChunk"];

// https://regex101.com/r/AM0c3m/1
const REGEX_REMOVE_EXTENSION = /(?:(?:\/index)|(?:\/index)?\.(?:\w|\d)+)$/;

const getChunkNameFromImport = (filename, importName) => {
  return path
    .relative(process.cwd(), path.join(path.dirname(filename), importName))
    .replace(REGEX_REMOVE_EXTENSION, "");
};

module.exports = function (api, options) {
  const t = api.types;
  return {
    visitor: {
      JSXElement(babelPath, state) {
        const element = babelPath.node.openingElement;
        if (ALLOWED_REACT_COMPONENTS.includes(element.name.name)) {
          const loadingAttr = element.attributes.find((attr) => {
            return attr.name.name === "loader";
          });
          const loadingFn = loadingAttr.value.expression;
          const importPath = loadingFn.body.arguments[0];
          const chunkName = getChunkNameFromImport(
            state.file.opts.filename,
            importPath.value
          );
          const idAttr = t.jsxAttribute(
            t.jsxIdentifier("name"),
            t.stringLiteral(chunkName)
          );
          element.attributes.push(idAttr);

          if (process.env.POXI_CONTEXT === "server") {
            // inspired by https://github.com/airbnb/babel-plugin-dynamic-import-node/blob/master/src/utils.js
            const requireCall = t.callExpression(t.identifier("require"), [
              importPath,
            ]);
            const { noInterop = false } = this.opts;
            const newImport =
              noInterop === true
                ? requireCall
                : t.callExpression(this.addHelper("interopRequireWildcard"), [
                    requireCall,
                  ]);
            loadingFn.body = newImport;
          }
        }
      },
    },
  };
};
