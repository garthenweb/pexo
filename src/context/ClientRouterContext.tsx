import React, { createContext, FC, useContext, useState } from "react";
import { BrowserRouter } from "react-router-dom";

interface RouterContext {
  preloadUrl: null | string;
  updatePreloadUrl: (path: string | null) => void;
  reloadOnNavigation: boolean;
}

const Context = createContext<RouterContext>({
  preloadUrl: null,
  updatePreloadUrl(path) {},
  reloadOnNavigation: false,
});

export const useClientRouterContext = () => useContext(Context);

export const ClientRouterProvider: FC<{
  reloadOnNavigation: boolean;
}> = ({ children, reloadOnNavigation }) => {
  const [preloadUrl, updatePreloadUrl] = useState<null | string>(null);
  return (
    <BrowserRouter>
      <Context.Provider
        value={{ preloadUrl, updatePreloadUrl, reloadOnNavigation }}
      >
        {children}
      </Context.Provider>
    </BrowserRouter>
  );
};
