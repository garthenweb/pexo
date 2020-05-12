import React, { FC, useContext } from "react";
import { ChunkModule } from "../../packages/core/src/components/types";

export type StaticChunkModuleCache = Map<string, ChunkModule<any, any>>;

const StaticChunkModuleCacheContext = React.createContext<{
  cache: StaticChunkModuleCache;
}>({
  cache: new Map(),
});

export const useStaticChunkModuleMap = () =>
  useContext(StaticChunkModuleCacheContext).cache;

interface Props {
  cache: StaticChunkModuleCache;
  children: JSX.Element;
}

export const StaticChunkModuleProvider: FC<Props> = (props) => {
  return (
    <StaticChunkModuleCacheContext.Provider
      value={{ cache: props.cache }}
      children={props.children}
    />
  );
};
