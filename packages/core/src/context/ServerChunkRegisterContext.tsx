import React, { FC } from "react";
import { ChunkModule } from "../../packages/core/src/components/types";

export const ServerChunkRegisterContext = React.createContext({
  registry: new Map(),
});

export interface RegistryItem<InputProps, ViewState>
  extends ChunkModule<InputProps, ViewState> {
  chunkCacheKey: string;
  chunkName: string;
  isRedirect: boolean;
  isHead: boolean;
  actionKeys: string[];
  props: InputProps;
}

interface Props {
  registry: Map<string, RegistryItem<any, any>>;
  children: JSX.Element;
}

export const ServerChunkRegisterProvider: FC<Props> = (props) => {
  return (
    <ServerChunkRegisterContext.Provider
      value={{ registry: props.registry }}
      children={props.children}
    />
  );
};
