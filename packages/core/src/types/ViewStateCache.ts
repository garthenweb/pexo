export type ViewStateCache = Map<
  string,
  {
    viewState: {};
    resourceIds: string[];
    updatedAt: number;
  }
>;
