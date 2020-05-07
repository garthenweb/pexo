import { CacheStrategies } from "./executeResource";
import { RequestCreatorConfig } from "./request.types";

export type ResourceId = string;

type ResourceSimpleTask<T = unknown> = (...args: any[]) => Promise<T>;

type ResourceEnhancedTask<T = unknown> = (
  ...args: any[]
) => (ctx: EnhancerObject<T>) => Promise<T>;

export type MaybeEnhancerResource<U extends ResourceTask> =
  | Promise<ResourceMethodConfig<U>>
  | any[]
  | undefined;

interface Apply<U> {
  <V extends ResourceTask, T = ResourceTaskReturnType<V>>(
    maybeResource: MaybeEnhancerResource<V>,
    transformer: (prev: T) => T
  ): ResourceTaskReturnType<V>;
}
interface Apply<U> {
  (transformer: (prev: U) => U): U;
}

interface Retrieve<U> {
  <V extends ResourceTask>(
    maybeResource: MaybeEnhancerResource<V>
  ): ResourceTaskReturnType<V>;
}
interface Retrieve<U> {
  (): U;
}
interface Request<U> {
  <V extends ResourceTask>(
    maybeResource: MaybeEnhancerResource<V>
  ): ResourceTaskReturnType<V>;
}
interface Request<U> {
  (): U;
}

export interface EnhancerObject<U> {
  request: Request<U>;
  retrieve: Retrieve<U>;
  apply: Apply<U>;
}

export type ResourceTaskReturnType<
  U extends ResourceTask,
  T = ReturnType<U>
> = Promise<
  T extends (...args: any) => any
    ? ReturnType<T>
    : T extends AsyncGenerator<any, infer V, any>
    ? V
    : T
>;

type ResourceEnhancedGeneratorTask<T = unknown> = (
  ...args: any[]
) => AsyncGenerator<unknown, T, unknown>;

export type ResourceTask =
  | ResourceSimpleTask
  | ResourceEnhancedTask
  | ResourceEnhancedGeneratorTask;

export type ResourceMethodConfig<U extends ResourceTask> = {
  __symbol: symbol;
  args: Parameters<U>;
  resourceId: ResourceId;
  runTask: U;
  readResource?:
    | Omit<ResourceMethodConfig<any>, "args" | "readResource">
    | undefined;
  strategy: CacheStrategies;
  generateCacheKey: (resourceId: ResourceId, args: any[]) => string;
  cacheable?: boolean;
  bundleable?: boolean;
  mutates: boolean;
  ttl?: number;
};

export type ResourceCreatorConfig = {
  strategy?: CacheStrategies;
  generateCacheKey?: (resourceId: ResourceId, args: any[]) => string;
  cacheable?: boolean;
  bundleable?: boolean;
  mutates?: boolean;
  ttl?: number;
};

export interface ResourceExecuteConfig extends RequestCreatorConfig {
  registerResourceUsage: (resourceId: ResourceId) => void;
}

type ResourceMethod<U extends ResourceTask> = (
  ...args: Parameters<U>
) => Promise<ResourceMethodConfig<U>>;

/* start create request resource overloads */
export interface CreateRequestResource {
  <R extends ResourceTask>(read: R, config?: ResourceCreatorConfig): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
  };
}

export interface CreateRequestResource {
  <R extends ResourceTask>(
    tasks: { read: R },
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
  };
}

export interface CreateRequestResource {
  <U extends ResourceTask>(
    tasks: { update: U },
    config?: ResourceCreatorConfig
  ): {
    update: ResourceMethod<U>;
  };
}

export interface CreateRequestResource {
  <C extends ResourceTask>(
    tasks: { create: C },
    config?: ResourceCreatorConfig
  ): {
    create: ResourceMethod<C>;
  };
}

export interface CreateRequestResource {
  <D extends ResourceTask>(
    tasks: { delete: D },
    config?: ResourceCreatorConfig
  ): {
    delete: ResourceMethod<D>;
  };
}

export interface CreateRequestResource {
  <R extends ResourceTask, C extends ResourceTask>(
    tasks: {
      read: R;
      create: C;
    },
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
    create: ResourceMethod<C>;
  };
}

export interface CreateRequestResource {
  <R extends ResourceTask, U extends ResourceTask>(
    tasks: {
      read: R;
      update: U;
    },
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
    update: ResourceMethod<U>;
  };
}

export interface CreateRequestResource {
  <R extends ResourceTask, D extends ResourceTask>(
    tasks: {
      read: R;
      delete: D;
    },
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
    delete: ResourceMethod<D>;
  };
}

export interface CreateRequestResource {
  <C extends ResourceTask, U extends ResourceTask>(
    tasks: {
      create: C;
      update: U;
    },
    config?: ResourceCreatorConfig
  ): {
    create: ResourceMethod<C>;
    update: ResourceMethod<U>;
  };
}

export interface CreateRequestResource {
  <C extends ResourceTask, D extends ResourceTask>(
    tasks: {
      create: C;
      delete: D;
    },
    config?: ResourceCreatorConfig
  ): {
    create: ResourceMethod<C>;
    delete: ResourceMethod<D>;
  };
}

export interface CreateRequestResource {
  <U extends ResourceTask, D extends ResourceTask>(
    tasks: {
      update: U;
      delete: D;
    },
    config?: ResourceCreatorConfig
  ): {
    update: ResourceMethod<U>;
    delete: ResourceMethod<D>;
  };
}

export interface CreateRequestResource {
  <R extends ResourceTask, C extends ResourceTask, U extends ResourceTask>(
    tasks: {
      read: R;
      update: U;
      create: C;
    },
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
    create: ResourceMethod<C>;
    update: ResourceMethod<U>;
  };
}

export interface CreateRequestResource {
  <R extends ResourceTask, U extends ResourceTask, D extends ResourceTask>(
    tasks: {
      read: R;
      update: U;
      delete: D;
    },
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
    update: ResourceMethod<U>;
    delete: ResourceMethod<D>;
  };
}

export interface CreateRequestResource {
  <C extends ResourceTask, U extends ResourceTask, D extends ResourceTask>(
    tasks: {
      create: C;
      update: U;
      delete: D;
    },
    config?: ResourceCreatorConfig
  ): {
    create: ResourceMethod<C>;
    update: ResourceMethod<U>;
    delete: ResourceMethod<D>;
  };
}

export interface CreateRequestResource {
  <
    R extends ResourceTask,
    C extends ResourceTask,
    U extends ResourceTask,
    D extends ResourceTask
  >(
    tasks: {
      read: R;
      create: C;
      update: U;
      delete: D;
    },
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
    create: ResourceMethod<C>;
    update: ResourceMethod<U>;
    delete: ResourceMethod<D>;
  };
}

export interface CreateRequestResource {
  <R extends ResourceTask>(
    resourceId: ResourceId,
    read: R,
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
  };
}

export interface CreateRequestResource {
  <R extends ResourceTask>(
    resourceId: ResourceId,
    tasks: { read: R },
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
  };
}

export interface CreateRequestResource {
  <U extends ResourceTask>(
    resourceId: ResourceId,
    tasks: { update: U },
    config?: ResourceCreatorConfig
  ): {
    update: ResourceMethod<U>;
  };
}

export interface CreateRequestResource {
  <C extends ResourceTask>(
    resourceId: ResourceId,
    tasks: { create: C },
    config?: ResourceCreatorConfig
  ): {
    create: ResourceMethod<C>;
  };
}

export interface CreateRequestResource {
  <D extends ResourceTask>(
    resourceId: ResourceId,
    tasks: { delete: D },
    config?: ResourceCreatorConfig
  ): {
    delete: ResourceMethod<D>;
  };
}

export interface CreateRequestResource {
  <R extends ResourceTask, C extends ResourceTask>(
    resourceId: ResourceId,
    tasks: {
      read: R;
      create: C;
    },
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
    create: ResourceMethod<C>;
  };
}

export interface CreateRequestResource {
  <R extends ResourceTask, U extends ResourceTask>(
    resourceId: ResourceId,
    tasks: {
      read: R;
      update: U;
    },
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
    update: ResourceMethod<U>;
  };
}

export interface CreateRequestResource {
  <R extends ResourceTask, D extends ResourceTask>(
    resourceId: ResourceId,
    tasks: {
      read: R;
      delete: D;
    },
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
    delete: ResourceMethod<D>;
  };
}

export interface CreateRequestResource {
  <C extends ResourceTask, U extends ResourceTask>(
    resourceId: ResourceId,
    tasks: {
      create: C;
      update: U;
    },
    config?: ResourceCreatorConfig
  ): {
    create: ResourceMethod<C>;
    update: ResourceMethod<U>;
  };
}

export interface CreateRequestResource {
  <C extends ResourceTask, D extends ResourceTask>(
    resourceId: ResourceId,
    tasks: {
      create: C;
      delete: D;
    },
    config?: ResourceCreatorConfig
  ): {
    create: ResourceMethod<C>;
    delete: ResourceMethod<D>;
  };
}

export interface CreateRequestResource {
  <U extends ResourceTask, D extends ResourceTask>(
    resourceId: ResourceId,
    tasks: {
      update: U;
      delete: D;
    },
    config?: ResourceCreatorConfig
  ): {
    update: ResourceMethod<U>;
    delete: ResourceMethod<D>;
  };
}

export interface CreateRequestResource {
  <R extends ResourceTask, C extends ResourceTask, U extends ResourceTask>(
    resourceId: ResourceId,
    tasks: {
      read: R;
      update: U;
      create: C;
    },
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
    create: ResourceMethod<C>;
    update: ResourceMethod<U>;
  };
}

export interface CreateRequestResource {
  <R extends ResourceTask, U extends ResourceTask, D extends ResourceTask>(
    resourceId: ResourceId,
    tasks: {
      read: R;
      update: U;
      delete: D;
    },
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
    update: ResourceMethod<U>;
    delete: ResourceMethod<D>;
  };
}

export interface CreateRequestResource {
  <C extends ResourceTask, U extends ResourceTask, D extends ResourceTask>(
    resourceId: ResourceId,
    tasks: {
      create: C;
      update: U;
      delete: D;
    },
    config?: ResourceCreatorConfig
  ): {
    create: ResourceMethod<C>;
    update: ResourceMethod<U>;
    delete: ResourceMethod<D>;
  };
}

export interface CreateRequestResource {
  <
    R extends ResourceTask,
    C extends ResourceTask,
    U extends ResourceTask,
    D extends ResourceTask
  >(
    resourceId: ResourceId,
    tasks: {
      read: R;
      create: C;
      update: U;
      delete: D;
    },
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
    create: ResourceMethod<C>;
    update: ResourceMethod<U>;
    delete: ResourceMethod<D>;
  };
}
