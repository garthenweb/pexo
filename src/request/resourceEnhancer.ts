import { Resource } from "./types";

export enum Enhancer {
  RETRIEVE,
}

export const retrieve = (resource: Resource<any, any>) => [
  resource,
  Enhancer.RETRIEVE,
];
