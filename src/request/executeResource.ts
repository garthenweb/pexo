import { isGeneratorValue } from "../utils/isGeneratorValue";
import { Enhancer } from "./resourceEnhancer";
import {
  ResourceMethodConfig,
  ResourceTask,
  ResourceExecuteConfig,
} from "./resource.types";
import { isRequestResource } from "./isRequestResource";

export enum CacheStrategies {
  CacheFirst,
  NetworkOnly,
  NetworkFirst,
  CacheOnly,
  StaleWhileRevalidate,
}

export const executeResource = async <U extends ResourceTask>(
  asyncResource: Promise<ResourceMethodConfig<U>> | ResourceMethodConfig<U>,
  config: ResourceExecuteConfig
) => {
  const resource = await asyncResource;
  const cacheKey = resource.generateCacheKey(
    resource.resourceId,
    resource.args
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
    case CacheStrategies.StaleWhileRevalidate: {
      const req = executeAndStoreInCache(resource, cacheKey, config);
      const cached = await retrieveFromCache(resource, cacheKey, config, {
        allowStale: true,
      });
      if (cached) {
        result = cached;
        req.catch(() =>
          console.warn("Request for revalidation failed in background")
        );
      } else {
        result = req;
      }
      break;
    }
    default: {
      throw new Error(
        "Unknown cache strategy used. Choose one of CacheFirst, CacheOnly, NetworkFirst and NetworkOnly."
      );
    }
  }
  return { cacheKey, result: await result };
};

const retrieveFromCache = async <U extends ResourceTask>(
  { resourceId, ttl, cacheable }: ResourceMethodConfig<U>,
  cacheKey: string,
  { cache, resourceState }: ResourceExecuteConfig,
  options?: { allowStale: boolean }
) => {
  const { allowStale } = Object.assign({}, options);
  if (!cacheable) {
    return void 0;
  }

  if (resourceState.isInvalid(resourceId) && !allowStale) {
    return void 0;
  }

  const item = await cache.get(cacheKey);
  if (!item) {
    return void 0;
  }

  if (allowStale || !ttl) {
    return item.value;
  }

  const expiresAt = item.createdAt + ttl;
  if (Date.now() <= expiresAt) {
    return item.value;
  }

  return void 0;
};

const executeAndStoreInCache = async <U extends ResourceTask>(
  resource: ResourceMethodConfig<U>,
  cacheKey: string,
  config: ResourceExecuteConfig
) => {
  const { resourceId, bundleable, mutates } = resource;
  const { pendingCache, resourceState } = config;
  if (bundleable && pendingCache.has(cacheKey)) {
    const { value } = pendingCache.get(cacheKey)!;
    return value.then(({ result }: any) => result);
  }

  const request = taskRunner(resource, config);

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

const updateCache = async <U extends ResourceTask>(
  nextValue: unknown,
  { cacheable, resourceId }: ResourceMethodConfig<U>,
  cacheKey: string,
  { cache, resourceState }: ResourceExecuteConfig
) => {
  if (cacheable) {
    cache.set(cacheKey, {
      createdAt: Date.now(),
      value: nextValue,
    });
    resourceState.update(resourceId, { invalidate: false });
  }
};

const taskRunner = async <U extends ResourceTask>(
  resource: ResourceMethodConfig<U>,
  config: ResourceExecuteConfig
) => {
  const request = resource.runTask(...resource.args);
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
          const enhancedResource = await getEnhancedResource(
            value[1],
            resource
          );
          if (enhancedResource) {
            ({ result } = await retrieveCachedResource(
              enhancedResource,
              config
            ));
          }
          break;
        }
        case Enhancer.APPLY: {
          const [, enhancedResourceConfig, transform] = value;
          const enhancedResource = await getEnhancedResource(
            enhancedResourceConfig,
            resource
          );
          if (enhancedResource) {
            const {
              cacheKey,
              result: cacheResult,
            } = await retrieveCachedResource(enhancedResource, config);
            if (cacheResult !== undefined && cacheKey) {
              const nextResult = transform(cacheResult);
              result = updateCache(
                nextResult,
                enhancedResource,
                cacheKey,
                config
              );
              updatesApplied = true;
            }
          }
          break;
        }
      }

      ({ value, done } = await request.next(result));
    }
  }

  return { result: value, updatesApplied };
};

const retrieveCachedResource = async <U extends ResourceTask>(
  enhancedResource: ResourceMethodConfig<U>,
  config: ResourceExecuteConfig
) => {
  if (!enhancedResource) {
    return { result: undefined, cacheKey: undefined };
  }

  try {
    return await executeResource(
      { ...enhancedResource, strategy: CacheStrategies.CacheOnly },
      config
    );
  } catch {
    // TODO return cache key from error object
    return { result: undefined, cacheKey: undefined };
  }
};

const getEnhancedResource = async <U extends ResourceTask>(
  enhancedResource: Promise<ResourceMethodConfig<U>> | any[] | undefined,
  callingResource: ResourceMethodConfig<U>
) => {
  const resource = await enhancedResource;
  if (isRequestResource(resource)) {
    return resource;
  }

  if (!callingResource.readResource) {
    return undefined;
  }

  return {
    ...callingResource.readResource,
    args: resource || [],
  };
};
