import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { createRequestResource } from "@pexo/request";
import { createHybridWithComponent } from "./utils";
import BaseChunk from "../src/components/BaseChunk";
import { useRequest } from "../src/core";

jest.mock("scheduler", () => require("scheduler/unstable_mock"));

describe("A hybrid app", () => {
  let consoleErrorSpy: jest.SpyInstance<any, any>;
  let reactHydrateSpy: jest.SpyInstance<any, any>;
  let reactCreateRootSpy: jest.SpyInstance<any, any>;
  let reactRenderSpy: jest.SpyInstance<any, any>;
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    reactHydrateSpy = jest.spyOn(ReactDOM, "hydrate");
    reactCreateRootSpy = jest.spyOn(ReactDOM, "unstable_createRoot");
    reactRenderSpy = jest.spyOn(ReactDOM, "render");
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
    reactHydrateSpy.mockRestore();
    reactCreateRootSpy.mockRestore();
    reactRenderSpy.mockRestore();
  });

  it("should hydrate without hydration errors", async () => {
    await createHybridWithComponent(
      () => (
        <>
          <BaseChunk
            multiplicate={3}
            $$name="test"
            loader={() => ({
              View: ({ bar, foo }: { bar: number; foo: number }) => (
                <section>
                  Hello {foo} World {bar}
                </section>
              ),
              generateViewState: ({ multiplicate }: { multiplicate: number }) =>
                Promise.resolve({
                  foo: 42,
                  bar: 42 * multiplicate,
                }),
            })}
          />
        </>
      ),
      {
        testClient: (container: Element) => {
          expect(container.querySelector("script")).toBeNull();
          if (process.env.PEXO_EXPERIMENTAL === "true") {
            expect(reactCreateRootSpy).toHaveBeenCalledTimes(1);
            expect(reactHydrateSpy).not.toHaveBeenCalled();
          } else {
            expect(reactHydrateSpy).toHaveBeenCalledTimes(1);
            expect(reactCreateRootSpy).not.toHaveBeenCalled();
          }
          expect(reactRenderSpy).not.toHaveBeenCalled();
          expect(console.error).not.toHaveBeenCalledWith(
            "Warning: Did not expect server HTML to contain a <%s> in <%s>.",
            expect.anything(),
            expect.anything()
          );
          expect(console.error).not.toHaveBeenCalled();
        },
      }
    );
  });

  it("should hydrate resources", async () => {
    const read = jest.fn(() => Promise.resolve(1));
    const resource = createRequestResource(
      "test_resource",
      {
        read,
        update: () => async ({ apply }) => {
          return apply((prev) => prev + 1);
        },
      },
      { cacheable: true, ttl: 1000 }
    );
    await createHybridWithComponent(
      () => (
        <>
          <BaseChunk
            multiplicate={3}
            $$name="test"
            loader={() => ({
              View: ({ value }: { value: number }) => {
                const request = useRequest();
                const [val, setVal] = React.useState(value);
                useEffect(() => {
                  request(resource.update()).then((val) => setVal(val));
                }, []);
                return <div data-testid="value">{val}</div>;
              },
              generateViewState: async (_, { request }) =>
                Promise.resolve({
                  value: await request(resource()),
                }),
            })}
          />
        </>
      ),
      {
        testServer: (res) => {
          expect(res.text).toContain("data-px-hydration-resource-key");
        },
        testClient: async (container: Element) => {
          expect(read).toHaveBeenCalledTimes(1);
          if (process.env.PEXO_EXPERIMENTAL === "true") {
            expect(reactCreateRootSpy).toHaveBeenCalledTimes(1);
            expect(reactHydrateSpy).not.toHaveBeenCalled();
          } else {
            expect(reactHydrateSpy).toHaveBeenCalledTimes(1);
            expect(reactCreateRootSpy).not.toHaveBeenCalled();
          }
          expect(read).toHaveBeenCalledTimes(1);
          expect(
            container.querySelector('[data-testid="value"]')!.innerHTML
          ).toBe("2");
        },
      }
    );
  });
});
