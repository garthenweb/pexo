import { wait, awaiter, nextTick } from "./utils";
import {
  createRequest,
  createRequestResource,
  CacheStrategies,
} from "../request";

describe("request", () => {
  let request: ReturnType<typeof createRequest>;
  beforeEach(() => {
    request = createRequest();
  });

  it("should handle a simple promise", async () => {
    const get = createRequestResource(() => Promise.resolve("yesyes"));
    const result = await request(get());
    expect(result).toBe("yesyes");
  });

  it("should allow to adjust promise result per request", async () => {
    const get = createRequestResource((a: string) =>
      Promise.resolve("yesyes" + a)
    );
    expect(await request(get("1"))).toBe("yesyes1");
    expect(await request(get("2"))).toBe("yesyes2");
  });

  it("should allow more than one argument", async () => {
    const get = createRequestResource((a: string, b: string, c: string) =>
      Promise.resolve("yesyes" + a + b + c)
    );
    expect(await request(get("1", "2", "3"))).toBe("yesyes123");
  });

  describe("for CacheFirst strategy", () => {
    it("should cache resources", async () => {
      const createPromise = jest.fn((a: string) =>
        Promise.resolve("yesyes" + a)
      );
      const get = createRequestResource(createPromise, {
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
      const get = createRequestResource(createPromise, {
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
      const get1 = createRequestResource(createPromise1, {
        cacheable: true,
      });
      const get2 = createRequestResource(createPromise2, {
        cacheable: true,
      });

      const first = await request(get1("1"));
      const second = await request(get2("1"));
      expect(createPromise1).toHaveBeenCalledTimes(1);
      expect(createPromise2).toHaveBeenCalledTimes(1);
      expect(first).not.toBe(second);
    });

    it("should bundle resources that start in parallel", async () => {
      const controller = awaiter();
      const createPromise = jest.fn((a: string) => controller.promise);
      const get = createRequestResource(createPromise, {
        cacheable: true,
      });
      const p = Promise.all([request(get("1")), request(get("1"))]);
      controller.resolve();
      await nextTick();
      await p;
      expect(createPromise).toHaveBeenCalledTimes(1);
    });
  });

  describe("for NetworkOnly strategy", () => {
    it("should not use cached resources", async () => {
      const createPromise = jest.fn((a: string) => Promise.resolve(a));
      const get = createRequestResource(createPromise, {
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
      const get = createRequestResource(createPromise, {
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
      const get = createRequestResource(createPromise, {
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

  describe("nested promise getter", () => {
    it("should return getter which resolve with the value of the possible result", async () => {
      const obj = { id: 42, foo: { bar: { baz: 5 } } };
      const get = createRequestResource(() => Promise.resolve(obj));

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
      const get = createRequestResource(() => Promise.resolve(obj));

      const result = request(get());
      expect(Object.keys(result)).toEqual([]);
    });

    it("should allow to parallelize requests by default if independent", async () => {
      const get1Await = awaiter();
      const get2Await = awaiter();

      const get1Call = jest.fn(() => get1Await.promise);
      const get2Call = jest.fn(() => get2Await.promise);
      const dependsCall = jest.fn((id: number) => Promise.resolve(id + 5));

      const get1 = createRequestResource(get1Call);
      const get2 = createRequestResource(get2Call);
      const getDependsOn1 = createRequestResource(dependsCall);

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
});
