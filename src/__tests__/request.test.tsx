import { wait, awaiter, nextTick } from "./utils";
import {
  createRequest,
  createRequestResource,
  CacheStrategies,
  createAsyncCache,
  retrieve,
  apply,
  request as requestEnhancer,
} from "../request";

describe("request", () => {
  let request: ReturnType<typeof createRequest>;
  beforeEach(() => {
    request = createRequest();
  });

  it("should handle a simple promise", async () => {
    const get = createRequestResource("test_resource_name", () =>
      Promise.resolve("yesyes")
    );
    const result = await request(get());
    expect(result).toBe("yesyes");
  });

  it("should allow to adjust promise result per request", async () => {
    const get = createRequestResource("test_resource_name", (a: string) =>
      Promise.resolve("yesyes" + a)
    );
    expect(await request(get("1"))).toBe("yesyes1");
    expect(await request(get("2"))).toBe("yesyes2");
  });

  it("should allow more than one argument", async () => {
    const get = createRequestResource(
      "test_resource_name",
      (a: string, b: string, c: string) => Promise.resolve("yesyes" + a + b + c)
    );
    expect(await request(get("1", "2", "3"))).toBe("yesyes123");
  });

  it("should handle a simple promise using read method", async () => {
    const get = createRequestResource("test_resource_name", () =>
      Promise.resolve("yesyes")
    );
    const result = await request(get.read());
    expect(result).toBe("yesyes");
  });

  it("should allow crud methods", async () => {
    const resource = createRequestResource("test_resource_name", {
      read: (id: number) => Promise.resolve({ id }),
      create: (id: number) => Promise.resolve({ id }),
      update: (id: number, next: { id: number }) => Promise.resolve(next),
      delete: (id: number) => Promise.resolve({ id }),
    });
    expect(await request(resource.read(42))).toEqual({ id: 42 });
    expect(await request(resource.create(43))).toEqual({ id: 43 });
    expect(await request(resource.update(44, { id: 44 }))).toEqual({ id: 44 });
    expect(await request(resource.delete(45))).toEqual({ id: 45 });
  });

  describe("for CacheFirst strategy", () => {
    it("should cache resources", async () => {
      const createPromise = jest.fn((a: string) =>
        Promise.resolve("yesyes" + a)
      );
      const get = createRequestResource("test_resource_name", createPromise, {
        cacheable: true,
      });
      const first = await request(get("1"));
      const second = await request(get("1"));
      expect(createPromise).toHaveBeenCalledTimes(1);
      expect(first).toBe(second);

      const third = await request(get("2"));
      expect(third).not.toBe(first);
      expect(createPromise).toHaveBeenCalledTimes(2);
    });

    it("should respect a time to life for cacheable resources", async () => {
      const createPromise = jest.fn((a: string) =>
        Promise.resolve("yesyes" + a)
      );
      const get = createRequestResource("test_resource_name", createPromise, {
        cacheable: true,
        ttl: 100,
      });
      const first = await request(get("1"));
      const second = await request(get("1"));
      expect(first).toBe(second);
      await wait(110);
      const third = await request(get("1"));
      expect(first).toBe(third);
      expect(createPromise).toHaveBeenCalledTimes(2);
    });

    it("should not share cache of different resources", async () => {
      const createPromise1 = jest.fn((a: string) =>
        Promise.resolve("yesyes" + a)
      );
      const createPromise2 = jest.fn((a: string) =>
        Promise.resolve("nono" + a)
      );
      const get1 = createRequestResource(
        "test_resource_name1",
        createPromise1,
        {
          cacheable: true,
        }
      );
      const get2 = createRequestResource(
        "test_resource_name2",
        createPromise2,
        {
          cacheable: true,
        }
      );

      const first = await request(get1("1"));
      const second = await request(get2("1"));
      expect(createPromise1).toHaveBeenCalledTimes(1);
      expect(createPromise2).toHaveBeenCalledTimes(1);
      expect(first).not.toBe(second);
    });

    it("should bundle resources that start in parallel", async () => {
      const controller = awaiter();
      const createPromise = jest.fn((a: string) => controller.promise);
      const get = createRequestResource("test_resource_name", createPromise, {
        cacheable: true,
      });
      const p = Promise.all([request(get("1")), request(get("1"))]);
      controller.resolve(42);
      await nextTick();
      const [first, second] = await p;
      expect(createPromise).toHaveBeenCalledTimes(1);
      expect(first).toBe(42);
      expect(second).toBe(42);
    });
  });

  describe("for CacheOnly strategy", () => {
    it("should use a cached resources", async () => {
      const cache = createAsyncCache();
      await cache.set("1", {
        createdAt: Date.now(),
        value: 42,
      });
      request = createRequest({
        cache,
      });
      const createPromise = jest.fn((a: string) => Promise.resolve(a));
      const get = createRequestResource("test_resource_name", createPromise, {
        cacheable: true,
        strategy: CacheStrategies.CacheOnly,
        generateCacheKey: () => "1",
      });
      expect(await request(get("1"))).toBe(42);
      expect(createPromise).toHaveBeenCalledTimes(0);
    });

    it("should fail if no cached resource was found", async () => {
      const createPromise = jest.fn((a: string) => Promise.resolve(a));
      const get = createRequestResource("test_resource_name", createPromise, {
        cacheable: true,
        strategy: CacheStrategies.CacheOnly,
        generateCacheKey: () => "1",
      });
      expect(createPromise).toHaveBeenCalledTimes(0);
      await expect(request(get("1"))).rejects.toBeDefined();
    });
  });

  describe("for NetworkOnly strategy", () => {
    it("should not use cached resources", async () => {
      const createPromise = jest.fn((a: string) => Promise.resolve(a));
      const get = createRequestResource("test_resource_name", createPromise, {
        cacheable: true,
        strategy: CacheStrategies.NetworkOnly,
      });
      const first = await request(get("1"));
      const second = await request(get("1"));
      expect(createPromise).toHaveBeenCalledTimes(2);
      expect(first).toBe(second);

      const third = await request(get("2"));
      expect(third).not.toBe(first);
      expect(createPromise).toHaveBeenCalledTimes(3);
    });
  });

  describe("for NetworkOnly strategy", () => {
    it("should not use cached resources", async () => {
      const createPromise = jest.fn((a: string) => Promise.resolve(a));
      const get = createRequestResource("test_resource_name", createPromise, {
        cacheable: true,
        strategy: CacheStrategies.NetworkOnly,
      });
      const first = await request(get("1"));
      const second = await request(get("1"));
      expect(createPromise).toHaveBeenCalledTimes(2);
      expect(first).toBe(second);

      const third = await request(get("2"));
      expect(third).not.toBe(first);
      expect(createPromise).toHaveBeenCalledTimes(3);
    });
  });

  describe("for NetworkFirst strategy", () => {
    it("should not use cached resources", async () => {
      const createPromise = jest.fn((a: string) => Promise.resolve(a));
      const get = createRequestResource("test_resource_name", createPromise, {
        cacheable: true,
        strategy: CacheStrategies.NetworkFirst,
      });
      const first = await request(get("1"));
      const second = await request(get("1"));
      expect(createPromise).toHaveBeenCalledTimes(2);
      expect(first).toBe("1");
      expect(second).toBe("1");
    });

    it("should fall back to cached resources if network fails", async () => {
      let callCount = 0;
      const createPromise = jest.fn((a: string) => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(a);
        } else {
          return Promise.reject("Can only handle the first call");
        }
      });
      const get = createRequestResource("test_resource_name", createPromise, {
        cacheable: true,
        strategy: CacheStrategies.NetworkFirst,
      });
      const first = await request(get("1"));
      const second = await request(get("1"));
      expect(createPromise).toHaveBeenCalledTimes(2);
      expect(first).toBe(second);

      await expect(request(get("2"))).rejects.toBe(
        "Can only handle the first call"
      );
      expect(createPromise).toHaveBeenCalledTimes(3);
    });
  });

  describe("for StaleWhileRevalidate strategy", () => {
    it("should used cached resource but update it in background if outdated", async () => {
      const read = jest.fn(() => wait(50).then(() => Date.now()));
      const get = createRequestResource("test_resource_name", read, {
        cacheable: true,
        ttl: 100,
        strategy: CacheStrategies.StaleWhileRevalidate,
      });

      const first = request(get());
      const second = request(get());
      expect(await first).toBeGreaterThan(0);
      expect(await second).toBeGreaterThan(0);
      expect(await first).toBe(await second);
      expect(read).toHaveBeenCalledTimes(1);

      await wait(150);

      const third = await request(get());
      expect(third).toBeGreaterThan(0);
      expect(third).toBe(await first);
      expect(read).toHaveBeenCalledTimes(2);

      await wait(150);

      const fourth = await request(get());
      expect(fourth).toBeGreaterThan(0);
      expect(fourth).not.toBe(await first);
    });
  });

  describe("nested promise getter", () => {
    it("should return getter which resolve with the value of the possible result", async () => {
      const obj = { id: 42, foo: { bar: { baz: 5 } } };
      const get = createRequestResource("test_resource_name", () =>
        Promise.resolve(obj)
      );

      const result = request(get());
      expect(await result).toEqual(obj);
      expect(result.then).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.foo).toBeDefined();
      expect(result.foo.bar).toBeDefined();
      expect(result.foo.bar.baz).toBeDefined();

      expect(await result.id).toEqual(42);
      expect(await result.foo).toEqual(obj.foo);
      expect(await result.foo.bar).toEqual(obj.foo.bar);
      expect(await result.foo.bar.baz).toEqual(5);
    });

    it("should should not be enumerable", async () => {
      const obj = { id: 42, foo: { bar: { baz: 5 } } };
      const get = createRequestResource("test_resource_name", () =>
        Promise.resolve(obj)
      );

      const result = request(get());
      expect(Object.keys(result)).toEqual([]);
    });

    it("should allow to parallelize requests by default if independent", async () => {
      const get1Await = awaiter();
      const get2Await = awaiter();

      const get1Call = jest.fn(() => get1Await.promise);
      const get2Call = jest.fn(() => get2Await.promise);
      const dependsCall = jest.fn((id: number) => Promise.resolve(id + 5));

      const get1 = createRequestResource("test_resource_name1", get1Call);
      const get2 = createRequestResource("test_resource_name2", get2Call);
      const getDependsOn1 = createRequestResource(
        "test_resource_name3",
        dependsCall
      );

      expect(get1Call).not.toHaveBeenCalled();
      expect(get2Call).not.toHaveBeenCalled();
      expect(dependsCall).not.toHaveBeenCalled();

      const pGet1 = request(get1());
      const pGetDependsOn1 = request(getDependsOn1(pGet1.id));
      const pGet2 = request(get2());

      await nextTick();

      expect(get1Call).toHaveBeenCalled();
      expect(get2Call).toHaveBeenCalled();
      expect(dependsCall).not.toHaveBeenCalled();

      get1Await.resolve({ id: 42 });
      get2Await.resolve({ id: 43 });
      await nextTick();
      expect(dependsCall).toHaveBeenCalledWith(42);

      expect(await pGet1).toEqual({ id: 42 });
      expect(await pGet2).toEqual({ id: 43 });
      expect(await pGetDependsOn1).toEqual(47);
    });
  });

  describe("advanced data manipulation", () => {
    describe("with retrieve", () => {
      it("should allow to reuse cached values to optimize data fetching", async () => {
        const productList = [
          { id: 1, name: "product1" },
          { id: 2, name: "product2" },
          { id: 3, name: "product3" },
        ];
        const resolveList = jest.fn(() => Promise.resolve([...productList]));
        const resolveOne = jest.fn((id: number) =>
          Promise.resolve({ id: id, name: `product${id}` })
        );
        const products = createRequestResource(
          "test_resource_name",
          async function* (id?: number) {
            if (typeof id === "number") {
              const list = yield retrieve(products());
              const item = list?.find((item) => item.id === id);
              return item ?? resolveOne(id);
            }
            return resolveList();
          },
          {
            ttl: 1000,
            cacheable: true,
          }
        );

        expect(await request(products(1))).toEqual({ id: 1, name: "product1" });
        expect(await request(products())).toEqual(productList);
        expect(resolveOne).toHaveBeenCalledTimes(1);
        expect(resolveList).toHaveBeenCalledTimes(1);

        expect(await request(products(1))).toEqual({ id: 1, name: "product1" });
        expect(await request(products(2))).toEqual({ id: 2, name: "product2" });
        expect(await request(products(3))).toEqual({ id: 3, name: "product3" });
        expect(resolveOne).toHaveBeenCalledTimes(1);
        expect(resolveList).toHaveBeenCalledTimes(1);

        expect(await request(products(4))).toEqual({ id: 4, name: "product4" });
        expect(resolveOne).toHaveBeenCalledTimes(2);
      });
      it("should use the same resource by default", async () => {
        const productList = [
          { id: 1, name: "product1" },
          { id: 2, name: "product2" },
          { id: 3, name: "product3" },
        ];
        const resolveList = jest.fn(() => Promise.resolve([...productList]));
        const resolveOne = jest.fn((id: number) =>
          Promise.resolve({ id: id, name: `product${id}` })
        );
        const products = createRequestResource(
          "test_resource_name",
          async function* (id?: number) {
            if (typeof id === "number") {
              const list = yield retrieve();
              const item = list?.find((item) => item.id === id);
              return item ?? resolveOne(id);
            }
            return resolveList();
          },
          {
            ttl: 1000,
            cacheable: true,
          }
        );
        await request(products());
        expect(await request(products(1))).toEqual({ id: 1, name: "product1" });
        expect(resolveOne).not.toHaveBeenCalled();
      });
      it("should allow to pass arguments for the default resource", async () => {
        const resolveOne = jest.fn((id: number) =>
          Promise.resolve({ id: id, name: `product${id}` })
        );
        const products = createRequestResource(
          "test_resource_name",
          async function* (id: number) {
            return (yield retrieve([id])) ?? resolveOne(id);
          },
          {
            ttl: 1000,
            cacheable: true,
          }
        );
        expect(await request(products(1))).toEqual({ id: 1, name: "product1" });
        expect(await request(products(1))).toEqual({ id: 1, name: "product1" });
        expect(resolveOne).toHaveBeenCalledTimes(1);
      });
    });

    describe("with apply", () => {
      it("should allow to update a resource reader cache to not trigger a new request", async () => {
        const productList = [
          { id: 1, name: "product1" },
          { id: 2, name: "product2" },
          { id: 3, name: "product3" },
        ];
        const resolveList = jest.fn(() => Promise.resolve([...productList]));
        const createOne = jest.fn((id: number) =>
          Promise.resolve({ id: id, name: `product${id}` })
        );
        const products = createRequestResource(
          "test_resource_name",
          {
            read: () => resolveList(),
            create: async function* (id: number) {
              const item = await createOne(id);
              yield apply(products(), (list) => [...list, item]);
              return item;
            },
          },
          {
            ttl: 1000,
            cacheable: true,
          }
        );

        expect(await request(products())).toEqual(productList);
        expect(resolveList).toHaveBeenCalledTimes(1);

        expect(await request(products.create(4))).toEqual({
          id: 4,
          name: "product4",
        });
        expect(await request(products())).toEqual([
          ...productList,
          { id: 4, name: "product4" },
        ]);
        expect(createOne).toHaveBeenCalledTimes(1);
        expect(resolveList).toHaveBeenCalledTimes(1);
      });
      it("should use the same resource by default", async () => {
        const productList = [
          { id: 1, name: "product1" },
          { id: 2, name: "product2" },
          { id: 3, name: "product3" },
        ];
        const resolveList = jest.fn(() => Promise.resolve([...productList]));
        const createOne = jest.fn((id: number) =>
          Promise.resolve({ id: id, name: `product${id}` })
        );
        const products = createRequestResource(
          "test_resource_name",
          {
            read: () => resolveList(),
            create: async function* (id: number) {
              const item = await createOne(id);
              yield apply((list) => [...list, item]);
              return item;
            },
          },
          {
            ttl: 1000,
            cacheable: true,
          }
        );

        expect(await request(products())).toEqual(productList);
        expect(resolveList).toHaveBeenCalledTimes(1);

        expect(await request(products.create(4))).toEqual({
          id: 4,
          name: "product4",
        });
        expect(await request(products())).toEqual([
          ...productList,
          { id: 4, name: "product4" },
        ]);
        expect(createOne).toHaveBeenCalledTimes(1);
        expect(resolveList).toHaveBeenCalledTimes(1);
      });
    });
    describe("with request", () => {
      it("should allow to request data from another resource", async () => {
        const createOne = jest.fn((id: number, token: string) =>
          Promise.resolve({ id: id, name: `product${id}` })
        );
        const authToken = createRequestResource(() =>
          Promise.resolve("token1234")
        );
        const basket = createRequestResource("test_resource_name", {
          create: async function* (id: number) {
            const token = yield requestEnhancer(authToken());
            const item = await createOne(id, token);
            return item;
          },
        });

        expect(await request(basket.create(6))).toEqual({
          id: 6,
          name: `product6`,
        });
        expect(createOne).toHaveBeenCalledWith(6, "token1234");
      });
    });

    it("should work with generators and second return function", async () => {
      const get = createRequestResource("test_resource_name", () =>
        Promise.resolve(1)
      );
      const getWrap1 = createRequestResource("test_resource_name_wrap1", {
        read: () => ({ request }) => request(get()),
      });
      const getWrap2 = createRequestResource("test_resource_name_wrap1", {
        read: async function* () {
          return (yield requestEnhancer(get())) as number;
        },
      });
      expect(await request(getWrap1())).toBe(1);
      expect(await request(getWrap2())).toBe(1);
    });
  });
});
