import { isGeneratorValue } from "../utils/isGeneratorValue";
import { Enhancer } from "./resourceEnhancer";
import {
  ResourceMethodConfig,
  ResourceTask,
  ResourceExecuteConfig,
  MaybeEnhancerResource,
  EnhancerObject,
} from "./resource.types";
import { isRequestResource } from "./isRequestResource";
import { isSyncValue } from "../utils/isSyncValue";

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
  let req = resource.runTask(...resource.args);
  if (isGeneratorValue(req)) {
    return executeGeneratorEnhancer(req, resource, config);
  }
  const mutableOptions = { updatesApplied: false };
  if (isSyncValue(req) && typeof req === "function") {
    req = req(createEnhancer(resource, config, mutableOptions));
  }
  return req.then((result) => ({ result, ...mutableOptions }));
};

const createEnhancer = <U extends ResourceTask>(
  parentResource: ResourceMethodConfig<U>,
  config: ResourceExecuteConfig,
  options: { updatesApplied: boolean }
) => {
  const retrieve: EnhancerObject["retrieve"] = (maybeResource) =>
    executeRetrieveEnhancer(maybeResource, parentResource, config);
  const request: EnhancerObject["request"] = (maybeResource) =>
    executeRequestEnhancer(maybeResource, parentResource, config);
  const apply: EnhancerObject["apply"] = async (maybeResource, transformer) => {
    const result = await executeApplyEnhancer(
      transformer ? maybeResource : undefined,
      parentResource,
      config,
      transformer ?? maybeResource
    );
    if (result) {
      options.updatesApplied = true;
    }
    return result;
  };
  return { request, retrieve, apply };
};

const executeGeneratorEnhancer = async <U extends ResourceTask, T = unknown>(
  req: AsyncGenerator<unknown, T, unknown>,
  parentResource: ResourceMethodConfig<U>,
  config: ResourceExecuteConfig
) => {
  let updatesApplied = false;
  let { value, done } = await req.next();
  while (!done) {
    if (done) {
      return value;
    }
    if (Array.isArray(value)) {
      let result;
      switch (value[0]) {
        case Enhancer.RETRIEVE: {
          result = await executeRetrieveEnhancer(
            value[1],
            parentResource,
            config
          );
          break;
        }
        case Enhancer.REQUEST: {
          result = await executeRequestEnhancer(
            value[1],
            parentResource,
            config
          );
          break;
        }
        case Enhancer.APPLY: {
          const [, maybeResource, transform] = value;
          result = await executeApplyEnhancer(
            maybeResource,
            parentResource,
            config,
            transform
          );
          if (result) {
            updatesApplied = true;
          }
          break;
        }
      }

      ({ value, done } = await req.next(result));
    }
  }

  return { result: value, updatesApplied };
};

const executeRetrieveEnhancer = async <
  U extends ResourceTask,
  V extends ResourceTask
>(
  maybeResource: MaybeEnhancerResource<U>,
  parentResource: ResourceMethodConfig<V>,
  config: ResourceExecuteConfig
) => {
  const { result } = await executeEnhancer(
    maybeResource,
    parentResource,
    config,
    CacheStrategies.CacheOnly
  );
  return result;
};

const executeRequestEnhancer = async <
  U extends ResourceTask,
  V extends ResourceTask
>(
  maybeResource: MaybeEnhancerResource<U>,
  parentResource: ResourceMethodConfig<V>,
  config: ResourceExecuteConfig
) => {
  const { result } = await executeEnhancer(
    maybeResource,
    parentResource,
    config,
    CacheStrategies.CacheFirst
  );
  return result;
};

const executeApplyEnhancer = async <
  U extends ResourceTask,
  V extends ResourceTask,
  T extends unknown
>(
  maybeResource: MaybeEnhancerResource<U>,
  parentResource: ResourceMethodConfig<V>,
  config: ResourceExecuteConfig,
  transform: (r: T) => T
) => {
  const {
    result: cacheResult,
    cacheKey,
    enhancedResource,
  } = await executeEnhancer(
    maybeResource,
    parentResource,
    config,
    CacheStrategies.CacheOnly
  );

  if (enhancedResource && cacheResult !== undefined && cacheKey) {
    const nextResult = transform(cacheResult);
    updateCache(nextResult, enhancedResource, cacheKey, config);
    return nextResult;
  }

  return undefined;
};

const executeEnhancer = async <U extends ResourceTask, V extends ResourceTask>(
  maybeResource: MaybeEnhancerResource<U>,
  parentResource: ResourceMethodConfig<V>,
  config: ResourceExecuteConfig,
  strategy: CacheStrategies
) => {
  const resource = await getEnhancedResource(maybeResource, parentResource);
  if (resource) {
    return {
      ...(await accessCachedResource(resource, config, strategy)),
      enhancedResource: resource,
    };
  }
  return {
    result: undefined,
    cacheKey: undefined,
    enhancedResource: undefined,
  };
};

const accessCachedResource = async <U extends ResourceTask>(
  enhancedResource: ResourceMethodConfig<U>,
  config: ResourceExecuteConfig,
  strategy: CacheStrategies
) => {
  if (!enhancedResource) {
    return { result: undefined, cacheKey: undefined };
  }

  console.log("asd", enhancedResource);
  try {
    return await executeResource({ ...enhancedResource, strategy }, config);
  } catch (e) {
    console.log("error", e);
    // TODO return cache key from error object
    return { result: undefined, cacheKey: undefined };
  }
};

const getEnhancedResource = async <
  U extends ResourceTask,
  V extends ResourceTask
>(
  enhancedResource: MaybeEnhancerResource<U>,
  parentResource: ResourceMethodConfig<V>
) => {
  const resource = await enhancedResource;
  if (isRequestResource(resource)) {
    return resource;
  }

  if (!parentResource.readResource) {
    return undefined;
  }

  return {
    ...parentResource.readResource,
    args: resource || [],
  };
};
