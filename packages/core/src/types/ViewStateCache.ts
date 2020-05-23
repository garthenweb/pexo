export type ViewStateCache = Map<
  string,
  {
    viewState: {};
    resourceIds: string[];
    updatedAt: number;
  }
>;

export type ClientViewStateCacheItem = {
  viewState: {};
  resourceIds: string[];
  updatedAt: number;
  generator?: AsyncGenerator;
  error?: unknown;
};

export type ClientViewStateCache = Map<string, ClientViewStateCacheItem>;
