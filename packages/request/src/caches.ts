export interface CacheItem<T> {
  createdAt: number;
  value: T;
}

export interface AsyncCache {
  get: (key: string) => Promise<CacheItem<any> | undefined>;
  set: <T = unknown>(key: string, item: CacheItem<T>) => Promise<void>;
  delete: (key: string) => Promise<void>;
  entries: () => Promise<[string, CacheItem<any>][]>;
}

export interface SyncCache {
  get: (key: string) => CacheItem<any> | undefined;
  has: (key: string) => boolean;
  set: <T = unknown>(key: string, item: CacheItem<T>) => void;
  delete: (key: string) => void;
}

export const createAsyncCache = (): AsyncCache => {
  const cache = new Map<string, CacheItem<unknown>>();
  return {
    get: async (key: string) => cache.get(key),
    set: async <T = unknown>(key: string, item: CacheItem<T>) => {
      cache.set(key, item);
    },
    delete: async (key: string) => {
      cache.delete(key);
    },
    entries: () => {
      return Promise.all(
        Array.from(cache.entries()).map(
          async ([key, asyncValue]) =>
            [key, await asyncValue] as [string, CacheItem<any>]
        )
      );
    },
  };
};
