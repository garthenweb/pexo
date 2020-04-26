import { generateRequestCacheKey } from "./utils/cacheKey";
import { useState, useEffect } from "react";

type RunTask<T, R> = (...inputs: Array<T>) => Promise<R>;

export enum CacheStrategies {
  CacheFirst,
  NetworkOnly,
  NetworkFirst,
  CacheOnly,
  // StaleWhileRevalidate,
}

type ResourceId = string;

interface Resource<T, R> {
  inputs: Array<T>;
  resourceId: ResourceId;
  runTask: RunTask<T, R>;
  strategy: CacheStrategies;
  generateCacheKey: (resourceId: ResourceId, inputs: any[]) => string;
  cacheable?: boolean;
  bundleable?: boolean;
  mutates: boolean;
  ttl?: number;
}

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

interface CacheItem<T> {
  createdAt: number;
  value: T;
}

interface AsyncCache {
  get: (key: string) => Promise<CacheItem<any> | undefined>;
  set: <T = unknown>(key: string, item: CacheItem<T>) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

interface SyncCache {
  get: (key: string) => CacheItem<any> | undefined;
  has: (key: string) => boolean;
  set: <T = unknown>(key: string, item: CacheItem<T>) => void;
  delete: (key: string) => void;
}

export const createAsyncCache = (): AsyncCache => {
  const cache = new Map<string, CacheItem<unknown>>();
  return {
    get: async (key: string) => cache.get(key),
    set: async <T = unknown>(key: string, item: CacheItem<T>) => {
      cache.set(key, item);
    },
    delete: async (key: string) => {
      cache.delete(key);
    },
  };
};

interface Config {
  cache: AsyncCache;
  pendingCache: SyncCache;
  invalidatedResources: ReturnType<typeof createInvalidResourceHandler>;
}

interface ExecuteConfig extends Config {
  registerResourceUsage: (resourceId: ResourceId) => void;
}

export interface Request {
  <T = any, R = any>(resource: Promise<Resource<T, R>>): Promise<R>;
  clone: () => Request;
  reset: () => void;
  addResourceInvalidationChangeListener: (
    cb: (isInvalid: boolean) => void
  ) => void;
  removeResourceInvalidationChangeListener: (
    cb: (isInvalid: boolean) => void
  ) => void;
  isOneResourceInvalid: (ids: ResourceId[]) => boolean;
  retrieveUsedResourceIds: () => ResourceId[];
}

const createInvalidResourceHandler = () => {
  const invalidatedResources = new Set<ResourceId>();
  const listeners = new Set<Function>();

  const updateResourceValidationStatus = (
    resourceId: ResourceId,
    isValid: boolean
  ) => {
    if (isValid) {
      invalidatedResources.delete(resourceId);
    } else {
      invalidatedResources.add(resourceId);
    }
    listeners.forEach((cb) => cb());
  };

  return {
    has: invalidatedResources.has.bind(invalidatedResources),
    updateResourceValidationStatus,
    onChange: listeners.add.bind(listeners),
    removeOnChange: listeners.delete.bind(listeners),
  };
};

export const createRequest = ({
  cache = createAsyncCache(),
  pendingCache = new Map(),
  invalidatedResources = createInvalidResourceHandler(),
}: Partial<Config> = {}) => {
  const usedResources = new Set<ResourceId>();
  const registerResourceUsage = (resourceId: ResourceId) => {
    usedResources.add(resourceId);
  };

  const request: Request = <T, R>(
    resource: Promise<Resource<T, R>>
  ): Promise<R> => {
    return createNestedPromise(
      executeResource(resource, {
        cache,
        pendingCache,
        invalidatedResources,
        registerResourceUsage,
      })
    );
  };
  request.clone = () =>
    createRequest({ cache, pendingCache, invalidatedResources });
  request.reset = () => usedResources.clear();
  request.addResourceInvalidationChangeListener = (cb: Function) =>
    invalidatedResources.onChange(cb);
  request.removeResourceInvalidationChangeListener = (cb: Function) =>
    invalidatedResources.removeOnChange(cb);
  request.isOneResourceInvalid = (resourceIds: ResourceId[]) =>
    resourceIds.length > 0 &&
    [...resourceIds].some((id) => invalidatedResources.has(id));
  request.retrieveUsedResourceIds = () => [...usedResources];
  return request;
};

const nestedPromiseHandler = {
  get: (promise: Promise<any>, prop: string) => {
    if (prop === "then") {
      return promise.then.bind(promise);
    }
    return createNestedPromise(promise.then((res) => res[prop]));
  },
};

const createNestedPromise = <T>(p: Promise<T>): any => {
  return new Proxy(p, nestedPromiseHandler);
};

const executeResource = async <T, R>(
  asyncResource: Promise<Resource<T, R>>,
  config: ExecuteConfig
) => {
  const resource = await asyncResource;
  const cacheKey = resource.generateCacheKey(
    resource.resourceId,
    resource.inputs
  );
  config.registerResourceUsage(resource.resourceId);

  switch (resource.strategy) {
    case CacheStrategies.NetworkOnly: {
      return executeAndStoreInCache(resource, cacheKey, config);
    }
    case CacheStrategies.NetworkFirst: {
      try {
        return await executeAndStoreInCache(resource, cacheKey, config);
      } catch (error) {
        const cached = await retrieveFromCache(resource, cacheKey, config);
        return cached ?? Promise.reject(error);
      }
    }
    case CacheStrategies.CacheOnly: {
      const cached = await retrieveFromCache(resource, cacheKey, config);
      if (!cached) {
        return Promise.reject(
          new Error(
            "Could not retrieve the value from cache for CacheOnly strategy"
          )
        );
      }
      return cached;
    }
    case CacheStrategies.CacheFirst: {
      const cached = await retrieveFromCache(resource, cacheKey, config);
      return cached ?? executeAndStoreInCache(resource, cacheKey, config);
    }
    default: {
      throw new Error(
        "Unknown cache strategy used. Choose one of CacheFirst, CacheOnly, NetworkFirst and NetworkOnly."
      );
    }
  }
};

const retrieveFromCache = async <T, R>(
  { resourceId, ttl, cacheable }: Resource<T, R>,
  cacheKey: string,
  { cache, invalidatedResources }: ExecuteConfig
) => {
  if (!cacheable) {
    return void 0;
  }

  if (invalidatedResources.has(resourceId)) {
    return void 0;
  }

  const item = await cache.get(cacheKey);
  if (!item) {
    return void 0;
  }

  if (!ttl) {
    return item.value;
  }

  const expiresAt = item.createdAt + ttl;
  if (Date.now() <= expiresAt) {
    return item.value;
  }

  return void 0;
};

const executeAndStoreInCache = async <T, R>(
  {
    resourceId,
    inputs,
    runTask,
    bundleable,
    cacheable,
    mutates,
  }: Resource<T, R>,
  cacheKey: string,
  { cache, pendingCache, invalidatedResources }: ExecuteConfig
) => {
  if (bundleable && pendingCache.has(cacheKey)) {
    return pendingCache.get(cacheKey);
  }

  const request = runTask(...inputs);

  if (bundleable) {
    pendingCache.set(cacheKey, {
      createdAt: Date.now(),
      value: request,
    });
  }

  return request
    .then((res) => {
      if (cacheable) {
        cache.set(cacheKey, {
          createdAt: Date.now(),
          value: request,
        });
      }
      if (!mutates) {
        invalidatedResources.updateResourceValidationStatus(resourceId, true);
      }
      return res;
    })
    .finally(() => {
      pendingCache.delete(cacheKey);
      if (mutates) {
        invalidatedResources.updateResourceValidationStatus(resourceId, false);
      }
    });
};

export const useResourceInvalidator = (
  request: Request,
  resourceIds?: string[]
) => {
  const [isInvalid, setIsInvalid] = useState(
    request.isOneResourceInvalid(resourceIds ?? [])
  );
  useEffect(() => {
    const update = () => {
      setIsInvalid(request.isOneResourceInvalid(resourceIds ?? []));
    };
    request.addResourceInvalidationChangeListener(update);
    return () => request.removeResourceInvalidationChangeListener(update);
  }, [request, resourceIds?.join(",")]);

  return isInvalid;
};
