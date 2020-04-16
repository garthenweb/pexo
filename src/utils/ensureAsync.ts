import { isSyncValue } from "./isSyncValue";

export const ensureAsync = async <T>(value: T | Promise<T>): Promise<T> => {
  if (isSyncValue(value)) {
    return await value;
  }
  return value;
};
