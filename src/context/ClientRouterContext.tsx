import React, { createContext, FC, useContext, useState } from "react";
import { BrowserRouter } from "react-router-dom";

interface RouterContext {
  preloadUrl: null | string;
  updatePreloadUrl: (path: string | null) => void;
}

const Context = createContext<RouterContext>({
  preloadUrl: null,
  updatePreloadUrl(path) {},
});

export const useClientRouterContext = () => useContext(Context);

export const ClientRouterProvider: FC = ({ children }) => {
  const [preloadUrl, updatePreloadUrl] = useState<null | string>(null);
  return (
    <BrowserRouter>
      <Context.Provider value={{ preloadUrl, updatePreloadUrl }}>
        {children}
      </Context.Provider>
    </BrowserRouter>
  );
};
