import {
  Config,
  ResourceId,
  Resource,
  Request,
  InvalidResourceHandler,
} from "./types";
import { executeResource } from "./executeResource";
import { createAsyncCache } from "./caches";
import { createNestedPromise } from "./createNestedPromise";

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

const createInvalidResourceHandler = (): InvalidResourceHandler => {
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
