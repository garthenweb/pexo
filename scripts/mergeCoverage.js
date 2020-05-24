// @see https://github.com/facebook/jest/issues/2418#issuecomment-276056758
const createReporter = require("istanbul-api").createReporter;
const istanbulCoverage = require("istanbul-lib-coverage");

const map = istanbulCoverage.createCoverageMap();
const reporter = createReporter();

const files = [
  require("../coverage/coverage-final-legacy.json"),
  require("../coverage/coverage-final-experimental.json"),
];

files.forEach((file) => {
  Object.keys(file).forEach((filename) => map.addFileCoverage(file[filename]));
});

reporter.addAll(["json", "lcov", "text"]);
reporter.write(map);
