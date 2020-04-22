import { generateRequestCacheKey } from "./utils/cacheKey";

type RunTask<T, R> = (...inputs: Array<T>) => Promise<R>;

export enum CacheStrategies {
  CacheFirst,
  NetworkOnly,
  NetworkFirst,
  CacheOnly,
  // StaleWhileRevalidate,
}

interface Resource<T, R> {
  inputs: Array<T>;
  resourceId: string;
  runTask: RunTask<T, R>;
  strategy: CacheStrategies;
  generateCacheKey: (resourceId: string, inputs: any[]) => string;
  cacheable?: boolean;
  ttl?: number;
}

interface RequestResourceConfig {
  cacheable?: boolean;
  ttl?: number;
  strategy?: CacheStrategies;
  generateCacheKey?: (resourceId: string, inputs: any[]) => string;
}

type ResourceCall<T, R> = (input: T) => Promise<Resource<T, R>>;

let lastResourceId = 0;
export const createRequestResource = <T, R>(
  runTask: RunTask<T, R>,
  config: RequestResourceConfig = {}
): ResourceCall<T, R> => {
  const resourceId = (++lastResourceId).toString();
  return async (...args: T[]) => ({
    resourceId,
    inputs: await Promise.all(args),
    ttl: config.ttl,
    cacheable: config.cacheable,
    runTask,
    strategy: config.strategy ?? CacheStrategies.CacheFirst,
    generateCacheKey: config.generateCacheKey ?? generateRequestCacheKey,
  });
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
}

export type Request = <T = any, R = any>(
  resource: Promise<Resource<T, R>>
) => Promise<R>;

export const createRequest = ({
  cache = createAsyncCache(),
  pendingCache = new Map(),
}: Partial<Config> = {}) => {
  const request: Request = <T, R>(
    resource: Promise<Resource<T, R>>
  ): Promise<R> => {
    return createNestedPromise(
      executeResource(resource, { cache, pendingCache })
    );
  };
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
  config: Config
) => {
  const resource = await asyncResource;
  const cacheKey = resource.cacheable
    ? resource.generateCacheKey(resource.resourceId, resource.inputs)
    : null;

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
  { ttl }: Resource<T, R>,
  cacheKey: string | null,
  { cache }: Config
) => {
  if (!cacheKey) {
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
  { inputs, runTask }: Resource<T, R>,
  cacheKey: string | null,
  { cache, pendingCache }: Config
) => {
  if (!cacheKey) {
    return runTask(...inputs);
  }

  if (pendingCache.has(cacheKey)) {
    return pendingCache.get(cacheKey);
  }

  const request = runTask(...inputs);

  pendingCache.set(cacheKey, {
    createdAt: Date.now(),
    value: request,
  });

  return request
    .then((res) => {
      cache.set(cacheKey, {
        createdAt: Date.now(),
        value: request,
      });
      return res;
    })
    .finally(() => {
      pendingCache.delete(cacheKey);
    });
};
