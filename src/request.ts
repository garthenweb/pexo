import { generateRequestCacheKey } from "./utils/cacheKey";

type RunTask<T, R> = (...inputs: Array<T>) => Promise<R>;

interface Resource<T, R> {
  inputs: Array<T>;
  resourceId: string;
  config: RequestResourceConfig;
  runTask: RunTask<T, R>;
}

interface RequestResourceConfig {
  cacheable?: boolean;
  ttl?: number;
}

type ResourceCall<T, R> = (input: T) => Promise<Resource<T, R>>;

let lastResourceId = 0;
export const createRequestResource = <T, R>(
  runTask: RunTask<T, R>,
  config: RequestResourceConfig = {}
): ResourceCall<T, R> => {
  const resourceId = (++lastResourceId).toString();
  return async (...args: T[]) => ({
    inputs: await Promise.all(args),
    resourceId,
    config,
    runTask,
  });
};

interface CacheItem<T> {
  createdAt: number;
  value: T;
}

interface AsyncCache {
  get: (key: string) => Promise<CacheItem<any> | undefined>;
  has: (key: string) => boolean;
  set: <T = unknown>(key: string, item: CacheItem<T>) => Promise<void>;
}

const createCache = (): AsyncCache => {
  const cache = new Map<string, CacheItem<unknown>>();
  return {
    get: async (key: string) => cache.get(key),
    has: (key: string) => cache.has(key),
    set: async <T = unknown>(key: string, item: CacheItem<T>) => {
      cache.set(key, item);
    },
  };
};

interface Config {
  cache: AsyncCache;
}

export type Request = <T = any, R = any>(
  resource: Promise<Resource<T, R>>
) => Promise<R>;

export const createRequest = ({
  cache = createCache(),
}: Partial<Config> = {}) => {
  const request: Request = <T, R>(
    resource: Promise<Resource<T, R>>
  ): Promise<R> => {
    return createNestedPromise(executeResource(resource, { cache }));
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
  resource: Promise<Resource<T, R>>,
  { cache }: Config
) => {
  const res = await resource;
  const cacheKey = res.config.cacheable
    ? generateRequestCacheKey(res.resourceId, res.inputs)
    : null;

  if (cacheKey && cache.has(cacheKey)) {
    const item = (await cache.get(cacheKey))!;
    if (!res.config.ttl) {
      return item.value;
    }
    const expiresAt = item.createdAt + res.config.ttl;
    if (Date.now() <= expiresAt) {
      return item.value;
    }
  }

  const req = res.runTask(...res.inputs);

  if (cacheKey) {
    cache.set(cacheKey, {
      createdAt: Date.now(),
      value: req,
    });
  }

  return req;
};
