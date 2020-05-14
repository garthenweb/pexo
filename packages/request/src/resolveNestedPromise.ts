import { isSyncValue } from "@pexo/utils";

export const resolveNestedPromise = async (
  input: unknown
): Promise<unknown> => {
  if (!isSyncValue) {
    return resolveNestedPromise(await input);
  }

  if (Array.isArray(input)) {
    return Promise.all(input.map((i) => resolveNestedPromise(i)));
  }

  if (typeof input !== 'object') {
    return input
  }

  const entries = Object.entries(input as object);
  if (!entries.length) {
    return input;
  }

  const resolved = {};
  for (const [key, value] of entries) {
    resolved[key] = await resolveNestedPromise(value);
  }
  return resolved;
};
