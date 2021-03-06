import {
  ResourceMethodConfig,
  ResourceTask,
  ResourceId,
  ResourceTaskReturnType,
  PromiseValue,
} from "./resource.types";
import { AsyncCache, SyncCache } from "./caches";
import { DeepPromiseProps } from "./createNestedPromise";

export interface Request {
  <U extends ResourceTask>(
    resource: Promise<ResourceMethodConfig<U>>
  ): DeepPromiseProps<PromiseValue<ResourceTaskReturnType<U>>>;
  clone: () => Request;
  reset: () => void;
  addResourceUpdatedListener: (cb: (updatedResourceId: string) => void) => void;
  removeResourceUpdatedListener: (
    cb: (updatedResourceId: string) => void
  ) => void;
  getUpdateAtForResourceIds: (ids: ResourceId[]) => (number | undefined)[];
  retrieveUsedResourceIds: () => string[];
}

export interface RequestCreatorConfig {
  cache: AsyncCache;
  pendingCache: SyncCache;
  resourceState: ResourceStatusHandler;
}

export interface ResourceStatusHandler {
  isInvalid: (resourceId: ResourceId) => boolean;
  update: (resourceId: string, config: { invalidate: boolean }) => void;
  onChange: (cb: Function) => void;
  removeOnChange: (cb: Function) => void;
  getUpdateAtForResourceIds: (
    resourceIds: ResourceId[]
  ) => (number | undefined)[];
}
