import React, { FC } from "react";
import { ViewStateCache } from "../types/ViewStateCache";
import { ViewStateCacheProvider } from "./ViewStateCache";
import { StaticChunkModuleProvider, StaticChunkModuleCache } from "./StaticChunkModuleCacheContext";

export const PxGlobalServerProvider: FC = (props) => <>{props.children}</>;

interface ClientProps {
  viewStateCache: ViewStateCache;
  staticChunkModuleCache: StaticChunkModuleCache;
  children: JSX.Element;
}
export const PxGlobalClientProvider: FC<ClientProps> = (props) => (
  <ViewStateCacheProvider cache={props.viewStateCache}>
    <StaticChunkModuleProvider cache={props.staticChunkModuleCache}>{props.children}</StaticChunkModuleProvider>
  </ViewStateCacheProvider>
);
