import React from "react";
import { createStreamMiddleware } from "../server";
import express from "express";
import { act } from "react-dom/test-utils";
import { mount } from "../client";
import { ViewStateCache } from "../types/ViewStateCache";

export const createMiddlewareWithComponent = (
  Component: React.ComponentType,
  { viewStateCache }: { viewStateCache?: ViewStateCache } = {}
) => {
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
      viewStateCache,
    })
  );
  return { app, logger };
};

export const createRendererWithComponent = (
  Component: React.ComponentType,
  container: HTMLElement = document.createElement("div")
) =>
  new Promise<{ app: ReturnType<typeof mount>; container: HTMLElement }>(
    async (resolve) => {
      let app: ReturnType<typeof mount>;
      const ReactApp = () => <Component />;
      await act(async () => {
        app = await mount({
          container,
          createApp: () => <ReactApp />,
        });
      });

      resolve({
        // @ts-ignore
        app,
        container,
      });
    }
  );
