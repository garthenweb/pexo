import React, { FC } from "react";
import { ViewStateCache } from "../types/ViewStateCache";
import { ViewStateCacheProvider } from "./ViewStateCache";

export const PxGlobalServerProvider: FC = (props) => <>{props.children}</>;

interface ClientProps {
  viewStateCache: ViewStateCache;
  children: JSX.Element;
}
export const PxGlobalClientProvider: FC<ClientProps> = (props) => (
  <ViewStateCacheProvider cache={props.viewStateCache}>
    {props.children}
  </ViewStateCacheProvider>
);
