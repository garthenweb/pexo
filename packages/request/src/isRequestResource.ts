import { ResourceMethodConfig, ResourceTask } from "./resource.types";

export const REQUEST_RESOURCE = Symbol("REQUEST_RESOURCE");

export const isRequestResource = <U extends ResourceTask>(
  obj: any
): obj is ResourceMethodConfig<U> => obj && obj.__symbol === REQUEST_RESOURCE;
