import React, { FC, useContext } from "react";

const ViewStateContext = React.createContext({
  cache: new Map<string, {}>(),
});

export const useViewStateCacheMap = () => useContext(ViewStateContext).cache;

interface Props {
  cache: Map<string, {}>;
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
