import React, { createContext, FC } from "react";
import { BrowserRouter } from "react-router-dom";

const Context = createContext({});

export const ClientRouterProvider: FC = ({ children }) => {
  return (
    <BrowserRouter>
      <Context.Provider value={{}}>{children}</Context.Provider>
    </BrowserRouter>
  );
};
