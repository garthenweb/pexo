import {
  ResourceTask,
  MaybeEnhancerResource,
  ResourceTaskReturnType,
  PromiseValue,
} from "./resource.types";

export const Enhancer = {
  RETRIEVE: Symbol("RETRIEVE"),
  APPLY: Symbol("APPLY"),
  REQUEST: Symbol("REQUEST"),
};

export type EnhancerType<U extends ResourceTask, T = undefined> = readonly [
  symbol,
  MaybeEnhancerResource<U>,
  T
];

export const retrieve = <U extends ResourceTask>(
  resource?: MaybeEnhancerResource<U>
): EnhancerType<U> => [Enhancer.RETRIEVE, resource, undefined];

export const request = <U extends ResourceTask>(
  resource?: MaybeEnhancerResource<U>
) => [Enhancer.REQUEST, resource];

interface Apply {
  <V extends ResourceTask, T = PromiseValue<ResourceTaskReturnType<V>>>(
    maybeResource: MaybeEnhancerResource<V>,
    transformer: (prev: T) => T
  ): EnhancerType<V, (cachedResource: T) => T>;
}

interface Apply {
  <T>(transformer: (prev: T) => T): EnhancerType<
    ResourceTask<T>,
    (cachedResource: T) => T
  >;
}

export const apply: Apply = (...args: any) =>
  [
    Enhancer.APPLY,
    args[1] === undefined ? undefined : args[0],
    args[1] ?? args[0],
  ] as const;
