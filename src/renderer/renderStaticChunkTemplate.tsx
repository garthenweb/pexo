import React, { ReactNode } from "react";
import ReactDOMServer from "react-dom/server";
import {
  ServerChunkRegisterProvider,
  RegistryItem,
} from "../context/ServerChunkRegisterContext";

interface Config {
  createApp: () => JSX.Element;
  createAppContext: (node: ReactNode) => JSX.Element;
}

export interface ChunkTemplate extends Partial<RegistryItem<any, any>> {
  nextTemplateChunk: string;
}

export const renderStaticChunkTemplate = ({
  createAppContext,
  createApp,
}: Config): ChunkTemplate[] => {
  const registry = new Map<string, RegistryItem<any, any>>();
  const template = ReactDOMServer.renderToString(
    <ServerChunkRegisterProvider registry={registry}>
      {createAppContext(createApp())}
    </ServerChunkRegisterProvider>
  );
  return getOrderedChunkIdsFromTemplate(template).map((chunk) => {
    const chunkData = registry.get(chunk.id!);
    return {
      ...chunkData,
      nextTemplateChunk: chunk.nextTemplateChunk,
    };
  });
};

// a chunk in the template looks like the following:
// <div data-px-chunk-cache-key="root/filename">__PX_CHUNK/End__</div>
const CHUNK_TEMPLATE_START = '<div data-px-chunk-cache-key="';
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
