import React from "react";
import express from "express";
import { act } from "react-dom/test-utils";
import request from "supertest";

import { createStreamMiddleware } from "../src/server";
import { mount, unmount } from "../src/client";
import { ViewStateCache } from "../src/types/ViewStateCache";
import { Logger } from "../src/utils/logger";
import { Plugin } from "../src/plugins";

export const createMiddlewareWithComponent = (
  Component: React.ComponentType,
  {
    viewStateCache,
    plugins,
  }: { viewStateCache?: ViewStateCache; plugins?: Plugin[] } = {}
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
      plugins,
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

export const createHybridWithComponent = (
  Application: React.ComponentType,
  {
    testClient,
    testServer,
  }: {
    testClient: (container: Element) => void;
    testServer?: (res: request.Response) => void;
  }
) => {
  const viewStateCache = new Map();
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
        await testServer?.(res);
        process.browser = true;
        let clean: () => void;
        try {
          const bodyStart = res.text.indexOf("<body>");
          const bodyEnd = res.text.indexOf("</body>");
          document.body.innerHTML = res.text.slice(bodyStart + 6, bodyEnd);
          const container = document.body.querySelector("main");
          ({ clean } = await createRendererWithComponent(
            Application,
            container!,
            { viewStateCache }
          ));

          await testClient(container!);
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
};

export const wait = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));

export const awaiter = () => {
  let resolve = (value?: unknown) => {};
  let reject = (value?: unknown) => {};
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    resolve,
    reject,
    promise,
  };
};

export const nextTick = () =>
  new Promise((resolve) => process.nextTick(resolve));
