module.exports = {
  testMatch: ["<rootDir>/**/__tests__/*.test.+(ts|tsx|js)"],
  coveragePathIgnorePatterns: [
    "__tests__",
    "example",
    "coverage",
    ".parcel-cache",
    "node_modules",
    "scripts",
  ],
  "moduleNameMapper": {
    "^@pexo/utils$": "<rootDir>/packages/utils/src/utils.ts",
    "^@pexo/request$": "<rootDir>/packages/request/src/request.ts",
    "^@pexo/core$": "<rootDir>/packages/core/src/core.ts",
  }
};
