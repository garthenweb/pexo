import React, { FC, useContext } from "react";
import { ClientViewStateCache } from "../types/ViewStateCache";

const ViewStateContext = React.createContext<{ cache: ClientViewStateCache }>({
  cache: new Map(),
});

export const useViewStateCacheMap = () => useContext(ViewStateContext).cache;

interface Props {
  cache: ClientViewStateCache;
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
