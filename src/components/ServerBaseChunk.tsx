import React, { useContext, FC } from "react";
import { generateChunkCacheKey } from "../utils/cacheKey";
import { ServerChunkRegisterContext } from "../context/ServerChunkRegisterContext";
import { BaseChunkType } from "./types";

const isSyncModule = <T extends {}>(val: T | Promise<T>): val is T => {
  return typeof (val as any).then !== "function";
};

const ServerBaseChunk: BaseChunkType = ({ name, loader, ...delegateProps }) => {
  const chunkCacheKey = generateChunkCacheKey(name, delegateProps);
  const chunkModule = loader();
  if (!isSyncModule(chunkModule)) {
    throw new Error(
      "loader cannot return a promise on the server. babel should transform a dynamic import into a static import on the server. Please make sure babel is configured properly."
    );
  }
  const { registry } = useContext(ServerChunkRegisterContext);
  registry.set(chunkCacheKey, {
    ...chunkModule,
    chunkCacheKey,
    chunkName: name,
    props: delegateProps,
  });
  return (
    <div data-px-chunk-cache-key={chunkCacheKey} children="__PX_CHUNK/End__" />
  );
};

export default ServerBaseChunk;
