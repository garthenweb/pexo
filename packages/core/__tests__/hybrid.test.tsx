import React from "react";
import ReactDOM from "react-dom";
import request from "supertest";
import {
  createMiddlewareWithComponent,
  createRendererWithComponent,
} from "./utils";
import BaseChunk from "../src/components/BaseChunk";

describe("A hybride app", () => {
  let consoleErrorSpy: jest.SpyInstance<any, any>;
  let reactHydrateSpy: jest.SpyInstance<any, any>;
  let reactRenderSpy: jest.SpyInstance<any, any>;
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    reactHydrateSpy = jest.spyOn(ReactDOM, "hydrate");
    reactRenderSpy = jest.spyOn(ReactDOM, "render");
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
    reactHydrateSpy.mockRestore();
    reactRenderSpy.mockRestore();
  });
  it("should hydrate without hydration errors", async () => {
    const viewStateCache = new Map();
    const Application = () => (
      <>
        <BaseChunk
          multiplicate={3}
          name="test"
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
    );
    const { app, logger } = createMiddlewareWithComponent(Application, {
      viewStateCache,
    });

    return new Promise(async (resolve, reject) => {
      await request(app)
        .get("/")
        .expect("Content-Type", "text/html")
        .expect(200)
        .expect(async (res) => {
          expect(logger.error).not.toHaveBeenCalled();
          process.browser = true;
          let clean: () => void;
          try {
            const mainStart = res.text.indexOf("<main");
            const mainEnd = res.text.indexOf("</main>");
            const div = document.createElement("div");
            div.innerHTML = res.text.slice(mainStart, mainEnd + 7);
            const container = div.querySelector("main");
            expect(container).toBeDefined();

            ({ clean } = await createRendererWithComponent(
              Application,
              container!,
              { viewStateCache }
            ));

            expect(container?.querySelector("script")).toBeNull();
            expect(reactHydrateSpy).toHaveBeenCalledTimes(1);
            expect(reactRenderSpy).not.toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalledWith(
              'Warning: Did not expect server HTML to contain the text node "%s" in <%s>.',
              expect.anything(),
              expect.anything()
            );
            resolve();
          } catch (error) {
            reject(error);
          } finally {
            process.browser = void 0;
            if (clean!) {
              clean!();
            }
          }
        });
    });
  });
});
