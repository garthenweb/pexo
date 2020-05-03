import { CacheStrategies } from "./executeResource";
import { RequestCreatorConfig } from "./request.types";

export type ResourceId = string;

export type ResourceTask<T = any> = (
  ...args: any[]
) => Promise<T> | AsyncGenerator<T, any, any>;

export type ResourceMethodConfig<U extends ResourceTask> = {
  __symbol: symbol;
  args: Parameters<U>;
  resourceId: ResourceId;
  runTask: U;
  readTask: ResourceTask;
  strategy: CacheStrategies;
  generateCacheKey: (resourceId: ResourceId, inputs: any[]) => string;
  cacheable?: boolean;
  bundleable?: boolean;
  mutates: boolean;
  ttl?: number;
};

export type ResourceCreatorConfig = {
  strategy?: CacheStrategies;
  generateCacheKey?: (resourceId: ResourceId, inputs: any[]) => string;
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
  <C extends ResourceTask>(
    tasks: { create: C },
    config?: ResourceCreatorConfig
  ): {
    create: ResourceMethod<C>;
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
  <U extends ResourceTask>(
    tasks: { update: U },
    config?: ResourceCreatorConfig
  ): {
    update: ResourceMethod<U>;
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
  <D extends ResourceTask>(
    tasks: { delete: D },
    config?: ResourceCreatorConfig
  ): {
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
  <U extends ResourceTask>(
    resourceId: ResourceId,
    tasks: { update: U },
    config?: ResourceCreatorConfig
  ): {
    update: ResourceMethod<U>;
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
  <D extends ResourceTask>(
    resourceId: ResourceId,
    tasks: { delete: D },
    config?: ResourceCreatorConfig
  ): {
    delete: ResourceMethod<D>;
  };
}
