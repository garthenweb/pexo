import { ResourceMethodConfig, ResourceTask } from "./resource.types";

export const Enhancer = {
  RETRIEVE: Symbol("RETRIEVE"),
  APPLY: Symbol("APPLY"),
  REQUEST: Symbol("REQUEST"),
};

export const retrieve = <U extends ResourceTask>(
  resource?: Promise<ResourceMethodConfig<U>> | Parameters<U>
) => [Enhancer.RETRIEVE, resource];

export const request = <U extends ResourceTask>(
  resource?: Promise<ResourceMethodConfig<U>> | Parameters<U>
) => [Enhancer.REQUEST, resource];

interface Apply {
  <T extends unknown, U extends ResourceTask<T>>(
    resource: ResourceMethodConfig<U> | Parameters<U>,
    transformer: (cachedResource: T) => T
  ): readonly [
    symbol,
    ResourceMethodConfig<U> | Parameters<U>,
    (cachedResource: T) => T
  ];
}

interface Apply {
  <T extends unknown>(transformer: (cachedResource: T) => T): readonly [
    symbol,
    undefined,
    (cachedResource: T) => T
  ];
}

export const apply: Apply = (...args: any) =>
  [
    Enhancer.APPLY,
    args[1] === undefined ? undefined : args[0],
    args[1] ?? args[0],
  ] as const;
