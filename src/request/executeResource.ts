import { ExecuteConfig, Resource } from "./types";
import { isGeneratorValue } from "../utils/isGeneratorValue";
import { Enhancer } from "./resourceEnhancer";

export enum CacheStrategies {
  CacheFirst,
  NetworkOnly,
  NetworkFirst,
  CacheOnly,
  // StaleWhileRevalidate,
}

export const executeResource = async <T, R>(
  asyncResource: Promise<Resource<T, R>>,
  config: ExecuteConfig,
  resourceOverrides?: Partial<Resource<any, any>>
) => {
  const resource = { ...(await asyncResource), ...resourceOverrides };
  const cacheKey = resource.generateCacheKey(
    resource.resourceId,
    resource.inputs
  );
  config.registerResourceUsage(resource.resourceId);

  let result: unknown;
  switch (resource.strategy) {
    case CacheStrategies.NetworkOnly: {
      result = executeAndStoreInCache(resource, cacheKey, config);
      break;
    }
    case CacheStrategies.NetworkFirst: {
      try {
        result = await executeAndStoreInCache(resource, cacheKey, config);
      } catch (error) {
        const cached = await retrieveFromCache(resource, cacheKey, config);
        result = cached ?? Promise.reject(error);
      }
      break;
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
      result = cached;
      break;
    }
    case CacheStrategies.CacheFirst: {
      const cached = await retrieveFromCache(resource, cacheKey, config);
      result = cached ?? executeAndStoreInCache(resource, cacheKey, config);
      break;
    }
    default: {
      throw new Error(
        "Unknown cache strategy used. Choose one of CacheFirst, CacheOnly, NetworkFirst and NetworkOnly."
      );
    }
  }
  return { cacheKey, result };
};

const retrieveFromCache = async <T, R>(
  { resourceId, ttl, cacheable }: Resource<T, R>,
  cacheKey: string,
  { cache, resourceState }: ExecuteConfig
) => {
  if (!cacheable) {
    return void 0;
  }

  if (resourceState.isInvalid(resourceId)) {
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
  resource: Resource<T, R>,
  cacheKey: string,
  config: ExecuteConfig
) => {
  const { resourceId, inputs, runTask, bundleable, mutates } = resource;
  const { pendingCache, resourceState } = config;
  if (bundleable && pendingCache.has(cacheKey)) {
    const { value } = pendingCache.get(cacheKey)!;
    return value.then(({ result }) => result);
  }

  const request = taskRunner(runTask(...inputs), config);

  if (bundleable) {
    pendingCache.set(cacheKey, {
      createdAt: Date.now(),
      value: request,
    });
  }

  try {
    const { result, updatesApplied } = await request;
    pendingCache.delete(cacheKey);
    await updateCache(result, resource, cacheKey, config);
    if (mutates && !updatesApplied) {
      resourceState.update(resourceId, { invalidate: true });
    }
    return result;
  } catch (error) {
    pendingCache.delete(cacheKey);
    if (mutates) {
      resourceState.update(resourceId, { invalidate: true });
    }
    throw error;
  }
};

const updateCache = async <T, R>(
  nextValue: unknown,
  { cacheable, resourceId }: Resource<T, R>,
  cacheKey: string,
  { cache, resourceState }: ExecuteConfig
) => {
  if (cacheable) {
    cache.set(cacheKey, {
      createdAt: Date.now(),
      value: nextValue,
    });
    resourceState.update(resourceId, { invalidate: false });
  }
};

const taskRunner = async (
  request: Promise<any> | GeneratorFunction,
  config: ExecuteConfig
) => {
  let updatesApplied = false;
  if (!isGeneratorValue(request)) {
    return request.then((result) => ({ result, updatesApplied }));
  }

  let { value, done } = await request.next();
  while (!done) {
    if (done) {
      return value;
    }
    if (Array.isArray(value)) {
      let result;
      switch (value[0]) {
        case Enhancer.RETRIEVE: {
          ({ result } = await retrieveCachedResource(value[1], config));
          break;
        }
        case Enhancer.APPLY: {
          const [, enhancedResource, transform] = value;
          const {
            cacheKey,
            result: cacheResult,
          } = await retrieveCachedResource(enhancedResource, config);
          if (cacheResult !== undefined && cacheKey) {
            const nextResult = transform(cacheResult);
            result = updateCache(
              nextResult,
              await enhancedResource,
              cacheKey,
              config
            );
            updatesApplied = true;
          }
          break;
        }
      }

      ({ value, done } = await request.next(result));
    }
  }

  return { result: value, updatesApplied };
};

const retrieveCachedResource = async (
  enhancedResource: Promise<Resource<any, any>>,
  config: ExecuteConfig
) => {
  try {
    return await executeResource(enhancedResource, config, {
      strategy: CacheStrategies.CacheOnly,
    });
  } catch {
    // TODO return cache key from error object
    return { result: undefined, cacheKey: undefined };
  }
};
