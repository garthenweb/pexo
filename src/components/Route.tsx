import React, { FC, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { Route as ReactRouterRoute, useLocation } from "react-router-dom";
import { createLocation } from "history";
import { useClientRouterContext } from "../context/ClientRouterContext";
import { useIdleCallback } from "../utils/useIdleCallback";
import { useSharedGlobalClientProvider } from "../context/GlobalContext";
import { VirtualEnvironmentProvider } from "../context/VirtualEnvironmentContext";
import { RouteProvider } from "../context/RouteContext";

const Route: FC<{
  path: string;
  component: React.ComponentType<any>;
}> = (props) => {
  usePreFetch(props.path, props.component);
  return (
    <RouteProvider>
      <ReactRouterRoute exact {...props} />
    </RouteProvider>
  );
};

const usePreFetch = (
  path: string = "/",
  Component: React.ComponentType<any>
) => {
  const routerContext = useClientRouterContext();
  const currentLocation = useLocation();
  const isAlreadyActive = currentLocation.pathname === path;
  const shouldPreFetch = routerContext.preloadUrl === path && !isAlreadyActive;
  const SharedGlobalClientProvider = useSharedGlobalClientProvider();
  const didPreFetch = useRef(isAlreadyActive);

  useIdleCallback(
    useCallback(() => {
      if (!shouldPreFetch || didPreFetch.current) {
        return;
      }
      let fragment = document.createDocumentFragment();
      const nextLocation = createLocation(path);
      ReactDOM.render(
        <VirtualEnvironmentProvider>
          <SharedGlobalClientProvider>
            <Component location={nextLocation} />
          </SharedGlobalClientProvider>
        </VirtualEnvironmentProvider>,
        fragment
      );
      didPreFetch.current = true;
      return () => {
        ReactDOM.unmountComponentAtNode(fragment);
        (fragment as any) = null;
      };
    }, [shouldPreFetch, path, Component, didPreFetch]),
    { timeout: 300 }
  );
};

export default Route;
