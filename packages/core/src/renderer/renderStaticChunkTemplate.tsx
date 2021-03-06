import React, { ReactNode } from "react";
import ReactDOMServer from "react-dom/server";
import { ServerStyleSheet } from "styled-components";
import {
  ServerChunkRegisterProvider,
  RegistryItem,
} from "../context/ServerChunkRegisterContext";
import { Plugin } from "../plugins";

type RenderPartial = "header" | "footer" | "routes";

interface Config {
  createApp: () => JSX.Element;
  createAppContext: (node: ReactNode) => JSX.Element;
  shouldRenderRoutesOnly?: RenderPartial;
  plugins: Plugin[];
}

export interface ChunkTemplate extends Partial<RegistryItem<any, any>> {
  nextTemplateChunk: string;
  viewState?: any;
  resourceIds?: string[];
  updatedAt?: number;
}

export const renderStaticChunkTemplate = ({
  createAppContext,
  createApp,
  shouldRenderRoutesOnly,
  plugins,
}: Config): ChunkTemplate[] => {
  const registry = new Map<string, RegistryItem<any, any>>();
  const appNode = (
    <ServerChunkRegisterProvider registry={registry}>
      {createAppContext(createApp())}
    </ServerChunkRegisterProvider>
  );
  let template = "";
  if (plugins.includes("styled-components")) {
    const sheet = new ServerStyleSheet();
    try {
      template = ReactDOMServer.renderToString(sheet.collectStyles(appNode));
      template = sheet.getStyleTags() + template;
    } finally {
      sheet.seal();
    }
  } else {
    template = ReactDOMServer.renderToString(appNode);
  }

  return getOrderedChunkIdsFromTemplate(
    deletePartial(template, shouldRenderRoutesOnly)
  ).map((chunk) => {
    const chunkData = registry.get(chunk.id!);
    return {
      ...chunkData,
      nextTemplateChunk: chunk.nextTemplateChunk,
    };
  });
};

const ROUTES_TEMPLATE_START =
  '<span data-px-server-template-routes="start"></span>';
const ROUTES_TEMPLATE_END =
  '<span data-px-server-template-routes="end"></span>';

const deletePartial = (
  template: string,
  shouldRenderRoutesOnly?: RenderPartial
): string => {
  if (!shouldRenderRoutesOnly) {
    return template
      .replace(ROUTES_TEMPLATE_START, "")
      .replace(ROUTES_TEMPLATE_END, "");
  }
  const indexOfRoutesStart = template.indexOf(ROUTES_TEMPLATE_START);
  const indexOfRoutesEnd = template.indexOf(ROUTES_TEMPLATE_END);
  if (indexOfRoutesStart === -1 || indexOfRoutesEnd === -1) {
    return template;
  }
  if (shouldRenderRoutesOnly === "routes") {
    return template.slice(
      indexOfRoutesStart + ROUTES_TEMPLATE_START.length,
      indexOfRoutesEnd
    );
  }
  if (shouldRenderRoutesOnly === "header") {
    return template.slice(0, indexOfRoutesStart);
  }
  if (shouldRenderRoutesOnly === "footer") {
    return template.slice(indexOfRoutesEnd + ROUTES_TEMPLATE_END.length);
  }
  throw new Error(
    `Unknown value for shouldRenderRoutesOnly \`${shouldRenderRoutesOnly}\``
  );
};

// a chunk in the template looks like the following:
// <div data-px-server-template-chunk-cache-key="root/filename">__PX_CHUNK/End__</div>
const CHUNK_TEMPLATE_START = '<div data-px-server-template-chunk-cache-key="';
const CHUNK_TEMPLATE_END = '">__PX_CHUNK/End__</div>';

const getOrderedChunkIdsFromTemplate = (template: string) => {
  const startSplits = template.split(CHUNK_TEMPLATE_START);
  return startSplits.map((part) => {
    const parts = part.split(CHUNK_TEMPLATE_END);
    if (parts.length === 1) {
      return {
        id: undefined,
        nextTemplateChunk: parts[0],
      };
    }
    return {
      id: parts[0],
      nextTemplateChunk: parts[1],
    };
  });
};
