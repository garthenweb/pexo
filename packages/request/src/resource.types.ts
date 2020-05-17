import { CacheStrategies } from "./executeResource";
import { RequestCreatorConfig } from "./request.types";
import { DeepPromiseProps } from "./createNestedPromise";

export type ResourceId = string;

type ResourceSimpleTask<T> = (...args: any[]) => Promise<T>;

type ResourceEnhancedTask<T, R extends ResourceTask> = (
  ...args: any[]
) => (ctx: EnhancerObject<R>) => Promise<T>;

export type MaybeEnhancerResource<U extends ResourceTask> =
  | Promise<ResourceMethodConfig<U>>
  | any[]
  | undefined;

export type PromiseValue<T> = T extends Promise<infer T> ? T : T;

export interface EnhancerApply<U> {
  <V extends ResourceTask, T = PromiseValue<ResourceTaskReturnType<V>>>(
    maybeResource: MaybeEnhancerResource<V>,
    transformer: (prev: T) => T
  ): DeepPromiseProps<T>;
}
export interface EnhancerApply<U> {
  <T = U>(transformer: (prev: T) => T): DeepPromiseProps<T>;
}

export interface EnhancerRetrieve<U> {
  <V extends ResourceTask>(
    maybeResource: MaybeEnhancerResource<V>
  ): DeepPromiseProps<PromiseValue<ResourceTaskReturnType<V>>>;
}
export interface EnhancerRetrieve<U> {
  <T = U>(): DeepPromiseProps<T>;
}
export interface EnhancerRequest<U> {
  <V extends ResourceTask>(
    maybeResource: MaybeEnhancerResource<V>
  ): DeepPromiseProps<PromiseValue<ResourceTaskReturnType<V>>>;
}
export interface EnhancerRequest<U> {
  <T = U>(): DeepPromiseProps<T>;
}

export interface EnhancerObject<U extends ResourceTask> {
  request: EnhancerRequest<U>;
  retrieve: EnhancerRetrieve<U>;
  apply: EnhancerApply<U>;
}

export type ResourceTaskReturnType<
  U extends ResourceTask,
  T = ReturnType<U>
> = T extends (...args: any) => any
  ? ReturnType<T>
  : T extends AsyncGenerator<any, infer V, any>
  ? V
  : T;

type ResourceEnhancedGeneratorTask<T> = (
  ...args: any[]
) => AsyncGenerator<unknown, T, unknown>;

export type ResourceTask<T = any, R = any> =
  | ResourceSimpleTask<T>
  | ResourceEnhancedTask<T, R>
  | ResourceEnhancedGeneratorTask<T>;

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

type ResourceMethod<
  ReadReturnType extends any = any,
  U extends ResourceTask = ResourceTask<any, ReadReturnType>
> = (...args: Parameters<U>) => Promise<ResourceMethodConfig<U>>;

/* start create request resource overloads */
export interface CreateRequestResource {
  <
    ReadReturnType extends any = any,
    R extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
    read: R,
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
  };
}

export interface CreateRequestResource {
  <
    ReadReturnType extends any = any,
    R extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
    tasks: { read: R },
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
  };
}

export interface CreateRequestResource {
  <
    ReadReturnType extends any = any,
    U extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
    tasks: { update: U },
    config?: ResourceCreatorConfig
  ): {
    update: ResourceMethod<U>;
  };
}

export interface CreateRequestResource {
  <
    ReadReturnType extends any = any,
    C extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
    tasks: { create: C },
    config?: ResourceCreatorConfig
  ): {
    create: ResourceMethod<C>;
  };
}

export interface CreateRequestResource {
  <
    ReadReturnType extends any = any,
    D extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
    tasks: { delete: D },
    config?: ResourceCreatorConfig
  ): {
    delete: ResourceMethod<D>;
  };
}

export interface CreateRequestResource {
  <
    ReadReturnType extends any = any,
    R extends ResourceTask = ResourceTask<any, ReadReturnType>,
    C extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
  <
    ReadReturnType extends any = any,
    R extends ResourceTask = ResourceTask<any, ReadReturnType>,
    U extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
  <
    ReadReturnType extends any = any,
    R extends ResourceTask = ResourceTask<any, ReadReturnType>,
    D extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
  <
    ReadReturnType extends any = any,
    C extends ResourceTask = ResourceTask<any, ReadReturnType>,
    U extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
  <
    ReadReturnType extends any = any,
    C extends ResourceTask = ResourceTask<any, ReadReturnType>,
    D extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
  <
    ReadReturnType extends any = any,
    U extends ResourceTask = ResourceTask<any, ReadReturnType>,
    D extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
  <
    ReadReturnType extends any = any,
    R extends ResourceTask = ResourceTask<any, ReadReturnType>,
    C extends ResourceTask = ResourceTask<any, ReadReturnType>,
    U extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
  <
    ReadReturnType extends any = any,
    R extends ResourceTask = ResourceTask<any, ReadReturnType>,
    U extends ResourceTask = ResourceTask<any, ReadReturnType>,
    D extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
  <
    ReadReturnType extends any = any,
    C extends ResourceTask = ResourceTask<any, ReadReturnType>,
    U extends ResourceTask = ResourceTask<any, ReadReturnType>,
    D extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
    ReadReturnType extends any = any,
    R extends ResourceTask = ResourceTask<any, ReadReturnType>,
    C extends ResourceTask = ResourceTask<any, ReadReturnType>,
    U extends ResourceTask = ResourceTask<any, ReadReturnType>,
    D extends ResourceTask = ResourceTask<any, ReadReturnType>
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
  <
    ReadReturnType extends any = any,
    R extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
    resourceId: ResourceId,
    read: R,
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
  };
}

export interface CreateRequestResource {
  <
    ReadReturnType extends any = any,
    R extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
    resourceId: ResourceId,
    tasks: { read: R },
    config?: ResourceCreatorConfig
  ): {
    (...args: Parameters<R>): Promise<ResourceMethodConfig<R>>;
    read: ResourceMethod<R>;
  };
}

export interface CreateRequestResource {
  <
    ReadReturnType extends any = any,
    U extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
    resourceId: ResourceId,
    tasks: { update: U },
    config?: ResourceCreatorConfig
  ): {
    update: ResourceMethod<U>;
  };
}

export interface CreateRequestResource {
  <
    ReadReturnType extends any = any,
    C extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
    resourceId: ResourceId,
    tasks: { create: C },
    config?: ResourceCreatorConfig
  ): {
    create: ResourceMethod<C>;
  };
}

export interface CreateRequestResource {
  <
    ReadReturnType extends any = any,
    D extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
    resourceId: ResourceId,
    tasks: { delete: D },
    config?: ResourceCreatorConfig
  ): {
    delete: ResourceMethod<D>;
  };
}

export interface CreateRequestResource {
  <
    ReadReturnType extends any = any,
    R extends ResourceTask = ResourceTask<any, ReadReturnType>,
    C extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
  <
    ReadReturnType extends any = any,
    R extends ResourceTask = ResourceTask<any, ReadReturnType>,
    U extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
  <
    ReadReturnType extends any = any,
    R extends ResourceTask = ResourceTask<any, ReadReturnType>,
    D extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
  <
    ReadReturnType extends any = any,
    C extends ResourceTask = ResourceTask<any, ReadReturnType>,
    U extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
  <
    ReadReturnType extends any = any,
    C extends ResourceTask = ResourceTask<any, ReadReturnType>,
    D extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
  <
    ReadReturnType extends any = any,
    U extends ResourceTask = ResourceTask<any, ReadReturnType>,
    D extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
  <
    ReadReturnType extends any = any,
    R extends ResourceTask = ResourceTask<any, ReadReturnType>,
    C extends ResourceTask = ResourceTask<any, ReadReturnType>,
    U extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
  <
    ReadReturnType extends any = any,
    R extends ResourceTask = ResourceTask<any, ReadReturnType>,
    U extends ResourceTask = ResourceTask<any, ReadReturnType>,
    D extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
  <
    ReadReturnType extends any = any,
    C extends ResourceTask = ResourceTask<any, ReadReturnType>,
    U extends ResourceTask = ResourceTask<any, ReadReturnType>,
    D extends ResourceTask = ResourceTask<any, ReadReturnType>
  >(
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
    ReadReturnType extends any = any,
    R extends ResourceTask = ResourceTask<any, ReadReturnType>,
    C extends ResourceTask = ResourceTask<any, ReadReturnType>,
    U extends ResourceTask = ResourceTask<any, ReadReturnType>,
    D extends ResourceTask = ResourceTask<any, ReadReturnType>
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
