import { CacheStrategies } from "./executeResource";
import { generateRequestCacheKey } from "../utils/cacheKey";
import {
  CreateRequestResource,
  ResourceMethodConfig,
  ResourceCreatorConfig,
} from "./resource.types";

type Method = "create" | "read" | "update" | "delete";

export const createRequestResource: CreateRequestResource = (
  resourceId: any,
  taskConfig: any,
  config?: ResourceCreatorConfig
) => {
  const tasks =
    typeof taskConfig === "function" ? { read: taskConfig } : taskConfig;
  const {
    ttl,
    cacheable,
    bundleable,
    strategy,
    generateCacheKey,
  } = Object.assign(
    {
      ttl: 0,
      cacheable: false,
      bundleable: true,
      strategy: CacheStrategies.CacheFirst,
    },
    config
  );

  const createResourceMethod = (method: Method) => {
    if (typeof tasks[method] !== "function") {
      throw new Error(`Method \`${method}\` does not exist on this resource`);
    }
    return async (...args: any): Promise<ResourceMethodConfig<any>> => ({
      resourceId,
      args: await Promise.all(args),
      ttl: method === "read" ? ttl : 0,
      cacheable: method === "read" ? cacheable : false,
      bundleable: method === "read" ? bundleable : false,
      mutates: method !== "read",
      runTask: tasks[method],
      strategy: method === "read" ? strategy : CacheStrategies.NetworkOnly,
      generateCacheKey: generateCacheKey ?? generateRequestCacheKey,
    });
  };

  const defaultTask: any =
    typeof tasks.read === "function"
      ? createResourceMethod("read")
      : () => new Error("Read task does not exist for this resource");

  Object.keys(tasks).forEach((method) => {
    defaultTask[method] = createResourceMethod(method as Method);
  });

  return defaultTask;
};
