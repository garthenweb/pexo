import React from "react";
import request from "supertest";
import { TestingViewChunk } from "../components";
import { createMiddlewareWithComponent } from "./utils";
import BaseChunk from "../components/BaseChunk";

describe("The server", () => {
  it("should serve a simple application on the server", async () => {
    const { app, logger } = createMiddlewareWithComponent(() => (
      <>Hello World</>
    ));

    await request(app)
      .get("/")
      .expect("Content-Type", "text/html")
      .expect(200)
      .expect((res) => {
        expect(logger.error).not.toHaveBeenCalled();
        expect(res.text).toContain("Hello World");
      });
  });

  it("should serve chunks", async () => {
    const { app, logger } = createMiddlewareWithComponent(() => (
      <>
        <TestingViewChunk loader={() => ({ View: () => "Hello" })} />
        <TestingViewChunk loader={() => ({ View: () => "World" })} />
      </>
    ));

    await request(app)
      .get("/")
      .expect("Content-Type", "text/html")
      .expect(200)
      .expect((res) => {
        expect(logger.error).not.toHaveBeenCalled();
        expect(res.text).toContain("Hello");
        expect(res.text).toContain("World");
      });
  });

  it("should allow data fetching in chunks", async () => {
    const { app, logger } = createMiddlewareWithComponent(() => (
      <>
        <TestingViewChunk
          loader={() => ({
            View: ({ foo }: { foo: number }) => `Hello ${foo} World`,
            generateViewState: () =>
              Promise.resolve({
                foo: 42,
              }),
          })}
        />
      </>
    ));

    await request(app)
      .get("/")
      .expect("Content-Type", "text/html")
      .expect(200)
      .expect((res) => {
        expect(logger.error).not.toHaveBeenCalled();
        expect(res.text).toContain("Hello 42 World");
      });
  });

  it("should allow data fetching with props in chunks", async () => {
    const { app, logger } = createMiddlewareWithComponent(() => (
      <>
        <TestingViewChunk
          multiplicate={2}
          loader={() => ({
            View: ({ bar, foo }: { bar: number; foo: number }) =>
              `Hello ${foo} World ${bar}`,
            generateViewState: ({ multiplicate }: { multiplicate: number }) =>
              Promise.resolve({
                foo: 42,
                bar: 42 * multiplicate,
              }),
          })}
        />
      </>
    ));

    await request(app)
      .get("/")
      .expect("Content-Type", "text/html")
      .expect(200)
      .expect((res) => {
        expect(logger.error).not.toHaveBeenCalled();
        expect(res.text).toContain("Hello 42 World 84");
      });
  });

  it("should expose the view state", async () => {
    const { app, logger } = createMiddlewareWithComponent(() => (
      <>
        <TestingViewChunk
          multiplicate={2}
          loader={() => ({
            View: ({ bar, foo }: { bar: number; foo: number }) =>
              `Hello ${foo} World ${bar}`,
            generateViewState: ({ multiplicate }: { multiplicate: number }) =>
              Promise.resolve({
                foo: 42,
                bar: 42 * multiplicate,
              }),
          })}
        />
      </>
    ));

    await request(app)
      .get("/")
      .expect("Content-Type", "text/html")
      .expect(200)
      .expect((res) => {
        expect(logger.error).not.toHaveBeenCalled();
        expect(res.text).toContain("data-px-chunk-view-state-cache-key");
        expect(res.text).toContain('{"foo":42,"bar":84}');
      });
  });

  describe("for a redirect chunk", () => {
    it("should redirect", async () => {
      const { app, logger } = createMiddlewareWithComponent(() => (
        <>
          <TestingViewChunk
            redirect
            loader={() => ({
              generateViewState: () =>
                Promise.resolve({
                  pathname: "/myRedirectTarget",
                  status: 301,
                }),
            })}
          />
        </>
      ));

      await request(app)
        .get("/")
        .expect(301)
        .expect((res) => {
          expect(logger.error).not.toHaveBeenCalled();
          expect(res.header.location).toBe("/myRedirectTarget");
        });
    });

    it("should ignore redirect if it does not config", async () => {
      const { app, logger } = createMiddlewareWithComponent(() => (
        <>
          <TestingViewChunk
            redirect
            loader={() => ({
              generateViewState: () => Promise.resolve(),
            })}
          />
        </>
      ));

      await request(app)
        .get("/")
        .expect(200)
        .expect((res) => {
          expect(logger.error).not.toHaveBeenCalled();
          expect(res.text).toContain("</html>");
        });
    });
  });

  describe("view state cache", () => {
    it("should fill and use the cache", async (done) => {
      const viewStateCache = new Map();
      const generateViewState = jest.fn(
        ({ multiplicate }: { multiplicate: number }) =>
          Promise.resolve({
            foo: 42,
            bar: 42 * multiplicate,
          })
      );
      const { app, logger } = createMiddlewareWithComponent(
        () => (
          <>
            <BaseChunk
              name="test"
              multiplicate={2}
              loader={() => ({
                View: ({ bar, foo }: { bar: number; foo: number }) =>
                  `Hello ${foo} World ${bar}`,
                generateViewState,
              })}
            />
          </>
        ),
        { viewStateCache }
      );

      request(app)
        .get("/")
        .expect("Content-Type", "text/html")
        .expect(200)
        .end((err, res1) => {
          expect(err).toBeFalsy();
          request(app)
            .get("/")
            .expect("Content-Type", "text/html")
            .expect(200)
            .end((err, res2) => {
              expect(err).toBeFalsy();
              expect(logger.error).not.toHaveBeenCalled();
              expect(viewStateCache.size).toBe(1);
              expect(generateViewState).toHaveBeenCalledTimes(1);
              expect(viewStateCache.values().next().value).toEqual({
                foo: 42,
                bar: 84,
              });
              expect(res1.text).toBe(res2.text);
              done();
            });
        });
    });
  });

  describe("assets", () => {
    it("should be included based on the loaded chunks", async () => {
      const { app, logger } = createMiddlewareWithComponent(() => (
        <>
          <BaseChunk
            redirect
            name="chunkname-1.tsx"
            loader={() => ({
              generateViewState: () => Promise.resolve(),
            })}
          />
        </>
      ));

      await request(app)
        .get("/")
        .expect(200)
        .expect("Link", /<chunkname\-1\.tsx\.1234\.js>; rel=preload; as=script/)
        .expect((res) => {
          expect(logger.error).not.toHaveBeenCalled();
          expect(res.text).toContain(
            '<script src="chunkname-1.tsx.1234.js" defer></script>'
          );
        });
    });
  });
});
