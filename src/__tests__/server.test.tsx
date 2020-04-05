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
        <TestingViewChunk loader={() => ({ View: () => " World" })} />
      </>
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

  it("should allow data fetching in chunks", async () => {
    const { app, logger } = createMiddlewareWithComponent(() => (
      <>
        <TestingViewChunk
          loader={() => ({
            View: ({ foo }: { foo: number }) => `Hello ${foo}`,
            generateViewState: () =>
              Promise.resolve({
                foo: 42,
              }),
          })}
        />
        <TestingViewChunk loader={() => ({ View: () => " World" })} />
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
          loader={() => ({
            View: ({ foo }: { foo: number }) => `Hello ${foo}`,
            generateViewState: () =>
              Promise.resolve({
                foo: 42,
              }),
          })}
        />
        <TestingViewChunk
          foo={2}
          loader={() => ({
            View: ({ bar }: { bar: number }) => ` World ${bar}`,
            generateViewState: ({ foo }: { foo: number }) =>
              Promise.resolve({
                bar: 42 * foo,
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
});
