import { sha1 } from "object-hash";

export const generateChunkCacheKey = (name: string, props: any) => {
  return sha1({ name, ...props });
};

export const generateRequestCacheKey = (
  resourceId: string,
  args: unknown[]
) => {
  return sha1({ resourceId, args });
};
