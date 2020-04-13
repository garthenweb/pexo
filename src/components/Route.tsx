import React, { FC, useCallback } from "react";
import ReactDOM from "react-dom";
import { Route as ReactRouterRoute, useLocation } from "react-router-dom";
import { createLocation } from "history";
import { useClientRouterContext } from "../context/ClientRouterContext";
import { useIdleCallback } from "../utils/useIdleCallback";
import { useSharedGlobalClientProvider } from "../context/GlobalContext";

const Route: FC<{
  path: string;
  component: React.ComponentType<any>;
}> = (props) => {
  usePreFetch(props.path, props.component);
  return <ReactRouterRoute exact {...props} />;
};

const usePreFetch = (
  path: string = "/",
  Component: React.ComponentType<any>
) => {
  const routerContext = useClientRouterContext();
  const currentLocation = useLocation();
  const shouldPreFetch =
    routerContext.preloadUrl === path && currentLocation.pathname !== path;
  const SharedGlobalClientProvider = useSharedGlobalClientProvider();

  useIdleCallback(
    useCallback(() => {
      if (!shouldPreFetch) {
        return;
      }
      let fragment = document.createDocumentFragment();
      const nextLocation = createLocation(path);
      ReactDOM.render(
        <SharedGlobalClientProvider>
          <Component location={nextLocation} />
        </SharedGlobalClientProvider>,
        fragment
      );
      return () => {
        ReactDOM.unmountComponentAtNode(fragment);
        (fragment as any) = null;
      };
    }, [shouldPreFetch, path, Component]),
    { timeout: 300 }
  );
};

export default Route;
