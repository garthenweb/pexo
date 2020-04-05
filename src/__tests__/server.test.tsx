import React from "react";
import { createStreamMiddleware, Logger } from "../server";
import request from "supertest";
import express from "express";
import { TestingViewChunk } from "../components";

describe("The server", () => {
  const createMiddlewareWithComponent = (Component: React.ComponentType) => {
    const app = express();
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    app.get(
      "*",
      createStreamMiddleware({
        createApp: () => <Component />,
        logger,
      })
    );
    return { app, logger };
  };

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
        expect(res.text).toContain("data-px-chunk-view-state");
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
});
