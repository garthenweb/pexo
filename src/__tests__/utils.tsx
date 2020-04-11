import React from "react";
import { createStreamMiddleware } from "../server";
import express from "express";
import { act } from "react-dom/test-utils";
import { mount, unmount } from "../client";
import { ViewStateCache } from "../types/ViewStateCache";
import { Logger } from "../utils/logger";

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
  const requestManifest = () => {
    return Promise.resolve(
      new Proxy(
        {},
        {
          get: (_, prop: string) => {
            return {
              js: [`${prop}.1234.js`],
              css: [],
              isEntry: false,
            };
          },
        }
      )
    );
  };
  app.get(
    "*",
    createStreamMiddleware({
      createApp: () => <Component />,
      requestManifest,
      logger,
      viewStateCache,
    })
  );
  return { app, logger };
};

export const createRendererWithComponent = (
  Component: React.ComponentType,
  container: HTMLElement = document.createElement("div"),
  { viewStateCache }: { viewStateCache?: ViewStateCache } = {}
) =>
  new Promise<{
    clean: () => void;
    container: HTMLElement;
    logger: Logger;
  }>(async (resolve) => {
    let app: Element;
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    globalThis.__px = ["start"];
    const ReactApp = () => <Component />;
    await act(async () => {
      app = await mount({
        requestContainer: () => container,
        createApp: () => <ReactApp />,
        viewStateCache,
        logger,
      });
    });

    const clean = () => unmount(app);

    resolve({
      clean,
      container,
      logger,
    });
  });
