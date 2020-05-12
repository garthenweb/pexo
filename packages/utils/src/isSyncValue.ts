export const isSyncValue = <T extends {}>(val: T | Promise<T>): val is T => {
  return typeof (val as any).then !== "function";
};
