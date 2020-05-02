import { CacheStrategies } from "./executeResource";

export type RunTask<T, R> = (...inputs: Array<T>) => Promise<R>;

export type ResourceId = string;

export interface Resource<T, R> {
  inputs: Array<T>;
  resourceId: ResourceId;
  runTask: RunTask<T, R>;
  strategy: CacheStrategies;
  generateCacheKey: (resourceId: ResourceId, inputs: any[]) => string;
  cacheable?: boolean;
  bundleable?: boolean;
  mutates: boolean;
  ttl?: number;
}

export interface CacheItem<T> {
  createdAt: number;
  value: T;
}

export interface Config {
  cache: AsyncCache;
  pendingCache: SyncCache;
  resourceState: ResourceStatusHandler;
}

export interface ExecuteConfig extends Config {
  registerResourceUsage: (resourceId: ResourceId) => void;
}

export interface Request {
  <T = any, R = any>(resource: Promise<Resource<T, R>>): Promise<R>;
  clone: () => Request;
  reset: () => void;
  addResourceUpdatedListener: (cb: (updatedResourceId: string) => void) => void;
  removeResourceUpdatedListener: (
    cb: (updatedResourceId: string) => void
  ) => void;
  getUpdateAtForResourceIds: (ids: ResourceId[]) => (number | undefined)[];
  retrieveUsedResourceIds: () => string[];
}

export interface AsyncCache {
  get: (key: string) => Promise<CacheItem<any> | undefined>;
  set: <T = unknown>(key: string, item: CacheItem<T>) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

export interface SyncCache {
  get: (key: string) => CacheItem<any> | undefined;
  has: (key: string) => boolean;
  set: <T = unknown>(key: string, item: CacheItem<T>) => void;
  delete: (key: string) => void;
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
