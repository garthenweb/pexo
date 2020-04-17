import { wait } from "./utils";
import { createRequest, createRequestResource } from "../request";

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

  it("should cache resources", async () => {
    const createPromise = jest.fn((a: string) => Promise.resolve("yesyes" + a));
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
    const createPromise = jest.fn((a: string) => Promise.resolve("yesyes" + a));
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
    const createPromise2 = jest.fn((a: string) => Promise.resolve("nono" + a));
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
});
