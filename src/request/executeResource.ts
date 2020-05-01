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
  { ttl, cacheable }: Resource<T, R>,
  cacheKey: string,
  { cache }: ExecuteConfig
) => {
  if (!cacheable) {
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
  const { pendingCache, invalidatedResources } = config;
  if (bundleable && pendingCache.has(cacheKey)) {
    const { result } = await pendingCache.get(cacheKey);
    return result;
  }

  const request = taskRunner(runTask(...inputs), config);

  if (bundleable) {
    pendingCache.set(cacheKey, {
      createdAt: Date.now(),
      value: request,
    });
  }

  try {
    const { result, disableInvalidation } = await request;
    await updateCache(result, resource, cacheKey, config);
    pendingCache.delete(cacheKey);
    if (mutates && !disableInvalidation) {
      invalidatedResources.updateResourceValidationStatus(resourceId, false);
    }
    return result;
  } catch (error) {
    pendingCache.delete(cacheKey);
    if (mutates) {
      invalidatedResources.updateResourceValidationStatus(resourceId, false);
    }
    throw error;
  }
};

const updateCache = async <T, R>(
  nextValue: any,
  { cacheable, mutates, resourceId }: Resource<T, R>,
  cacheKey: string,
  { cache, invalidatedResources }: ExecuteConfig
) => {
  if (cacheable) {
    cache.set(cacheKey, {
      createdAt: Date.now(),
      value: nextValue,
    });
  }
  if (!mutates) {
    invalidatedResources.updateResourceValidationStatus(resourceId, true);
  }
};

const taskRunner = async (
  request: Promise<any> | GeneratorFunction,
  config: ExecuteConfig
) => {
  if (!isGeneratorValue(request)) {
    return request.then((result) => ({ result, disableInvalidation: false }));
  }

  let { value, done } = await request.next();
  let disableInvalidation = false;
  while (!done) {
    if (done) {
      return value;
    }
    if (Array.isArray(value)) {
      let result;
      switch (value[0]) {
        case Enhancer.RETRIEVE: {
          result = await retrieveCachedResource(value[1], config);
          break;
        }
        case Enhancer.APPLY: {
          const [, enhancedResource, transform] = value;
          const cacheResult = await retrieveCachedResource(
            enhancedResource,
            config
          );
          const { cacheKey, result: nextResult } = transform(cacheResult);
          result = updateCache(nextResult, enhancedResource, cacheKey, config);
          disableInvalidation = true;
          break;
        }
      }

      ({ value, done } = await request.next(result));
    }
  }

  return { result: value, disableInvalidation };
};

const retrieveCachedResource = async (
  enhancedResource: Promise<Resource<any, any>>,
  config: ExecuteConfig
) => {
  try {
    return await executeResource(enhancedResource, config, {
      strategy: CacheStrategies.CacheOnly,
    }).then(({ result }) => result);
  } catch {
    return undefined;
  }
};
