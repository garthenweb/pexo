import { Resource } from "./types";

export const Enhancer = {
  RETRIEVE: Symbol("RETRIEVE"),
  APPLY: Symbol("APPLY"),
};

export const retrieve = (resource: Resource<any, any>) => [
  Enhancer.RETRIEVE,
  resource,
];

export const apply = (
  resource: Resource<any, any>,
  transformer: (cachedResource: any) => any
) => [Enhancer.APPLY, resource, transformer];
