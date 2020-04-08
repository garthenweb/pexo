import React, { FC, useContext } from "react";
import { ChunkModule } from "../components/types";

const StaticChunkModuleCacheContext = React.createContext({
  cache: new Map<string, ChunkModule<any, any>>(),
});

export const useStaticChunkModuleMap = () =>
  useContext(StaticChunkModuleCacheContext).cache;

interface Props {
  cache: Map<string, ChunkModule<any, any>>;
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
