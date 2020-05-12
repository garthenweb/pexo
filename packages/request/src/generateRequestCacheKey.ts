import { sha1 } from "object-hash";

export const generateRequestCacheKey = (
  resourceId: string,
  args: unknown[]
) => {
  return sha1({ resourceId, args });
};
