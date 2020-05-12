/**
 * Used to fix errors in react when testing
 * @caution In a perfect world this should never be used production code but only in tests. Always try to fix it in the tests first!
 */
export const fireAsAct = (cb: () => void) => {
  if (process.env.NODE_ENV === "test") {
    const { act } = require("react-dom/test-utils");
    act(() => cb());
  } else {
    cb();
  }
};
