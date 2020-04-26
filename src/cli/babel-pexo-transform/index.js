const path = require("path");
const { sha1 } = require("object-hash");
const ALLOWED_REACT_COMPONENTS = ["Chunk", "RedirectChunk", "HeadChunk"];

// https://regex101.com/r/AM0c3m/1
const REGEX_REMOVE_EXTENSION = /(?:(?:\/index)|(?:\/index)?\.(?:\w|\d)+)$/;

const getCWDRelativeFilename = (filename) => {
  return path.relative(process.cwd(), filename);
};

const getChunkNameFromImport = (filename, importName) => {
  return path
    .join(getCWDRelativeFilename(path.dirname(filename)), importName)
    .replace(REGEX_REMOVE_EXTENSION, "");
};

const getResourceName = (filename, variableName) => {
  return sha1(`${getCWDRelativeFilename(filename)}__${variableName}`);
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

          if (process.env.PEXO_CONTEXT === "server") {
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
      CallExpression(path, state) {
        if (
          t.isIdentifier(path.node.callee) &&
          path.node.callee.name === "createRequestResource"
        ) {
          if (!t.isStringLiteral(path.node.arguments[0])) {
            path.node.arguments.unshift(
              t.stringLiteral(
                getResourceName(state.file.opts.filename, path.parent.id.name)
              )
            );
          }
        }
      },
    },
  };
};
