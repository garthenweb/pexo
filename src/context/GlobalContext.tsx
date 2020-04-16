import React, { FC } from "react";
import { ViewStateCache } from "../types/ViewStateCache";
import { ViewStateCacheProvider, useViewStateCacheMap } from "./ViewStateCache";
import {
  StaticChunkModuleProvider,
  StaticChunkModuleCache,
  useStaticChunkModuleMap,
} from "./StaticChunkModuleCacheContext";
import { ClientRouterProvider } from "./ClientRouterContext";
import { HeadContextProvider } from "./ClientHeadContext";

export const PxGlobalServerProvider: FC = (props) => <>{props.children}</>;

interface ClientProps {
  viewStateCache: ViewStateCache;
  staticChunkModuleCache: StaticChunkModuleCache;
  children: JSX.Element;
}

export const PxGlobalClientProvider: FC<ClientProps> = (props) => (
  <ViewStateCacheProvider cache={props.viewStateCache}>
    <StaticChunkModuleProvider cache={props.staticChunkModuleCache}>
      <ClientRouterProvider>
        <HeadContextProvider>{props.children}</HeadContextProvider>
      </ClientRouterProvider>
    </StaticChunkModuleProvider>
  </ViewStateCacheProvider>
);

export const useSharedGlobalClientProvider = () => {
  const viewStateCache = useViewStateCacheMap();
  const staticChunkModuleCache = useStaticChunkModuleMap();
  return ({ children }: { children: JSX.Element }) => (
    <PxGlobalClientProvider
      viewStateCache={viewStateCache}
      staticChunkModuleCache={staticChunkModuleCache}
    >
      {children}
    </PxGlobalClientProvider>
  );
};
