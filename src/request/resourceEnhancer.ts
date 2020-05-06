import { ResourceMethodConfig, ResourceTask } from "./resource.types";

export const Enhancer = {
  RETRIEVE: Symbol("RETRIEVE"),
  APPLY: Symbol("APPLY"),
  REQUEST: Symbol("REQUEST"),
};

type EnhancerResourceType<U extends ResourceTask> =
  | Promise<ResourceMethodConfig<U>>
  | Parameters<U>;

export type EnhancerType<U extends ResourceTask, T = undefined> = readonly [
  symbol,
  EnhancerResourceType<U> | undefined,
  T
];

export const retrieve = <U extends ResourceTask>(
  resource?: EnhancerResourceType<U>
): EnhancerType<U> => [Enhancer.RETRIEVE, resource, undefined];

export const request = <U extends ResourceTask>(
  resource?: Promise<ResourceMethodConfig<U>> | Parameters<U>
) => [Enhancer.REQUEST, resource];

interface Apply {
  <T extends unknown, U extends ResourceTask>(
    resource: EnhancerResourceType<U>,
    transformer: (cachedResource: T) => T
  ): EnhancerType<U, (cachedResource: T) => T>;
}

interface Apply {
  <T extends unknown, U extends ResourceTask>(
    transformer: (cachedResource: T) => T
  ): EnhancerType<U, (cachedResource: T) => T>;
}

export const apply: Apply = (...args: any) =>
  [
    Enhancer.APPLY,
    args[1] === undefined ? undefined : args[0],
    args[1] ?? args[0],
  ] as const;
