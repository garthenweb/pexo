import { ExecuteConfig, Resource } from "./types";

export enum CacheStrategies {
  CacheFirst,
  NetworkOnly,
  NetworkFirst,
  CacheOnly,
  // StaleWhileRevalidate,
}

export const executeResource = async <T, R>(
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
