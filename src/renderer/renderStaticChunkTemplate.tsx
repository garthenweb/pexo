import React, { ReactNode, ComponentType } from "react";
import ReactDOMServer from "react-dom/server";
import { ServerChunkRegisterProvider } from "../context/ServerChunkRegisterContext";

interface Config {
  createApp: () => JSX.Element;
  createAppContext: (node: ReactNode) => JSX.Element;
}

export interface ChunkTemplate {
  View?: ComponentType;
  name?: string;
  nextTemplateChunk: string;
}

export const renderStaticChunkTemplate = ({
  createAppContext,
  createApp,
}: Config): ChunkTemplate[] => {
  const registry = new Map();
  const template = ReactDOMServer.renderToString(
    <ServerChunkRegisterProvider registry={registry}>
      {createAppContext(createApp())}
    </ServerChunkRegisterProvider>
  );
  return getOrderedChunkIdsFromTemplate(template).map((chunk) => {
    const chunkData = registry.get(chunk.id);
    return {
      View: chunkData?.View,
      name: chunkData?.name,
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
