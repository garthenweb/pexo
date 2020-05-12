import { CacheStrategies } from "./executeResource";
import { generateRequestCacheKey } from "./generateRequestCacheKey";
import {
  CreateRequestResource,
  ResourceMethodConfig,
  ResourceCreatorConfig,
} from "./resource.types";
import { REQUEST_RESOURCE } from "./isRequestResource";

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

  const createResourceMethodConfig = (
    method: Method
  ): Omit<ResourceMethodConfig<any>, "args" | "readResource"> => ({
    resourceId,
    ttl: method === "read" ? ttl : 0,
    cacheable: method === "read" ? cacheable : false,
    bundleable: method === "read" ? bundleable : false,
    mutates: method !== "read",
    runTask: tasks[method],
    strategy: method === "read" ? strategy : CacheStrategies.NetworkOnly,
    generateCacheKey: generateCacheKey ?? generateRequestCacheKey,
    __symbol: REQUEST_RESOURCE,
  });

  const createResourceMethod = (method: Method) => {
    if (typeof tasks[method] !== "function") {
      throw new Error(`Method \`${method}\` does not exist on this resource`);
    }
    return async (...args: any): Promise<ResourceMethodConfig<any>> => ({
      ...createResourceMethodConfig(method),
      args: await Promise.all(args),
      readResource: tasks.read ? createResourceMethodConfig("read") : undefined,
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
