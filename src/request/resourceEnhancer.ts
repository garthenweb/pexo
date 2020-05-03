import { ResourceMethodConfig, ResourceTask } from "./resource.types";

export const Enhancer = {
  RETRIEVE: Symbol("RETRIEVE"),
  APPLY: Symbol("APPLY"),
};

export const retrieve = <U extends ResourceTask>(
  resource: ResourceMethodConfig<U>
) => [Enhancer.RETRIEVE, resource];

export const apply = <T extends unknown, U extends ResourceTask<T>>(
  resource: ResourceMethodConfig<U>,
  transformer: (cachedResource: T) => T
) => [Enhancer.APPLY, resource, transformer];
