import { executeResource } from "./executeResource";
import { createAsyncCache } from "./caches";
import { createNestedPromise } from "./createNestedPromise";
import {
  Request,
  RequestCreatorConfig,
  ResourceStatusHandler,
} from "./request.types";
import { ResourceId } from "./resource.types";

export const createRequest = ({
  cache = createAsyncCache(),
  pendingCache = new Map(),
  resourceState = createResourceStatusHandler(),
}: Partial<RequestCreatorConfig> = {}): Request => {
  const usedResources = new Set<ResourceId>();
  const registerResourceUsage = (resourceId: ResourceId) => {
    usedResources.add(resourceId);
  };

  const request: Request = (resource) => {
    return createNestedPromise(
      executeResource(resource, {
        cache,
        pendingCache,
        resourceState,
        registerResourceUsage,
      }).then(({ result }) => result)
    );
  };
  request.clone = () => createRequest({ cache, pendingCache, resourceState });
  request.reset = () => usedResources.clear();
  request.addResourceUpdatedListener = (cb: Function) =>
    resourceState.onChange(cb);
  request.removeResourceUpdatedListener = (cb: Function) =>
    resourceState.removeOnChange(cb);
  request.getUpdateAtForResourceIds = (resourceIds: ResourceId[]) =>
    resourceState.getUpdateAtForResourceIds(resourceIds);
  request.retrieveUsedResourceIds = () => [...usedResources];
  return request;
};

const createResourceStatusHandler = (): ResourceStatusHandler => {
  const updatedAt = new Map<ResourceId, number>();
  const invalidatedResources = new Set<ResourceId>();
  const listeners = new Set<Function>();

  const update = (
    resourceId: ResourceId,
    { invalidate }: { invalidate: boolean }
  ) => {
    const now = Date.now();
    updatedAt.set(resourceId, now);
    if (invalidate) {
      invalidatedResources.add(resourceId);
    } else {
      invalidatedResources.delete(resourceId);
    }
    listeners.forEach((cb) => cb(resourceId));
  };

  const getUpdateAtForResourceIds = (resourceIds: ResourceId[]) => {
    return resourceIds.map((id) => updatedAt.get(id));
  };

  return {
    isInvalid: invalidatedResources.has.bind(invalidatedResources),
    update,
    onChange: listeners.add.bind(listeners),
    removeOnChange: listeners.delete.bind(listeners),
    getUpdateAtForResourceIds,
  };
};
