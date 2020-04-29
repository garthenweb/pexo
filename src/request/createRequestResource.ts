import { RunTask, ResourceId, Resource } from "./types";
import { CacheStrategies } from "./executeResource";
import { generateRequestCacheKey } from "../utils/cacheKey";

interface RequestResourceConfig {
  cacheable?: boolean;
  bundleable?: boolean;
  ttl?: number;
  strategy?: CacheStrategies;
  generateCacheKey?: (resourceId: ResourceId, inputs: any[]) => string;
}

type Method = "create" | "read" | "update" | "delete";

type ResourceCall<T, R> = (input: T) => Promise<Resource<T, R>>;

let lastResourceId = 0;
export const createRequestResource = <T, R>(
  resourceId: string,
  runTask: RunTask<T, R>,
  config?: RequestResourceConfig
): ResourceCall<T, R> => {
  const id =
    typeof resourceId === "string" ? resourceId : (++lastResourceId).toString();
  const tasks = typeof runTask === "function" ? { read: runTask } : runTask;
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
    return async (...args: T[]) => ({
      resourceId: id,
      inputs: await Promise.all(args),
      ttl: method === "read" ? ttl : 0,
      cacheable: method === "read" ? cacheable : false,
      bundleable: method === "read" ? bundleable : false,
      mutates: method !== "read",
      runTask: tasks[method],
      strategy: method === "read" ? strategy : CacheStrategies.NetworkOnly,
      generateCacheKey: generateCacheKey ?? generateRequestCacheKey,
    });
  };

  const defaultTask =
    typeof tasks.read === "function"
      ? createResourceMethod("read")
      : () => new Error("Read task does not exist for this resource");

  Object.keys(tasks).forEach((method) => {
    defaultTask[method] = createResourceMethod(method);
  });

  return defaultTask;
};
