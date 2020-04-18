import React, { createContext, FC, useContext } from "react";

const Context = createContext<boolean>(false);

export const useIsRenderedWithinRoute = () => useContext(Context);

export const RouteProvider: FC = ({ children }) => {
  return <Context.Provider value={true}>{children}</Context.Provider>;
};
