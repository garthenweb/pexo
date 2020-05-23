import React, { useContext } from "react";
import { isSyncValue } from "@pexo/utils";
import { ServerChunkRegisterContext } from "../context/ServerChunkRegisterContext";
import { BaseProps } from "./types";
import { useChunkContext } from "./BaseChunk";

const ServerBaseChunk = <InputProps extends {}, ViewState extends {}>({
  $$name,
  loader,
  redirect,
  head,
  actions,
  ...delegateProps
}: InputProps & BaseProps<InputProps, ViewState>) => {
  const { cacheKey } = useChunkContext();
  const chunkModule = loader();
  if (!isSyncValue(chunkModule)) {
    throw new Error(
      "loader cannot return a promise on the server. babel should transform a dynamic import into a static import on the server. Please make sure babel is configured properly."
    );
  }
  const { registry } = useContext(ServerChunkRegisterContext);
  registry.set(cacheKey, {
    ...chunkModule,
    chunkCacheKey: cacheKey,
    chunkName: $$name,
    isRedirect: Boolean(redirect),
    isHead: Boolean(head),
    actionKeys: actions ? Object.keys(actions) : [],
    props: delegateProps,
  });
  return (
    <div
      data-px-server-template-chunk-cache-key={cacheKey}
      children="__PX_CHUNK/End__"
    />
  );
};

export default ServerBaseChunk;
