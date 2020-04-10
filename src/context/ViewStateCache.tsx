import React, { FC, useContext } from "react";
import { ViewStateCache } from "../types/ViewStateCache";

const ViewStateContext = React.createContext<{ cache: ViewStateCache }>({
  cache: new Map(),
});

export const useViewStateCacheMap = () => useContext(ViewStateContext).cache;

interface Props {
  cache: ViewStateCache;
  children: JSX.Element;
}

export const ViewStateCacheProvider: FC<Props> = (props) => {
  return (
    <ViewStateContext.Provider
      value={{ cache: props.cache }}
      children={props.children}
    />
  );
};
