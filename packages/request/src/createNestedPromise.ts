const nestedPromiseHandler = {
  get: (promise: Promise<any>, prop: string) => {
    if (prop === "then") {
      return promise.then.bind(promise);
    }
    return createNestedPromise(promise.then((res) => res[prop]));
  },
};

export const createNestedPromise = <T>(p: Promise<T>): DeepPromiseProps<T> => {
  return new Proxy(p, nestedPromiseHandler) as DeepPromiseProps<T>;
};

export type DeepPromiseProps<T> = Promise<T> &
  {
    [P in keyof T]: DeepPromiseProps<T[P]>;
  };
