import React, { useEffect, useState } from "react";
import { generateChunkCacheKey } from "../utils/cacheKey";
import { ChunkModule, Loader, BaseProps } from "./types";
import { useViewStateCacheMap } from "../context/ViewStateCache";
import { useStaticChunkModuleMap } from "../context/StaticChunkModuleCacheContext";
import { isSyncValue } from "../utils/isSyncValue";
import { useIsVirtualEnvironment } from "../context/VirtualEnvironmentContext";
import { isGeneratorValue } from "../utils/isGeneratorValue";
import { fireAsAct } from "../utils/testing";

const ClientBaseChunk = <InputProps extends {}, ViewState extends {}>({
  name,
  loader,
  redirect,
  ...delegateProps
}: InputProps & BaseProps<InputProps, ViewState>) => {
  const chunkModule = useChunkModule({ name, loader });
  const isVirtualEnvironment = useIsVirtualEnvironment();
  const viewState = useViewState({
    name,
    delegateProps,
    generateViewState:
      typeof chunkModule !== "symbol"
        ? chunkModule.generateViewState
        : undefined,
    isReady: chunkModule !== useChunkModule.LOADING,
  });

  if (isVirtualEnvironment) {
    return null;
  }

  if (typeof chunkModule === "symbol") {
    return null;
  }

  if (viewState === useViewState.LOADING) {
    return null;
  }

  return <chunkModule.View {...viewState} />;
};

const useChunkModule = ({
  loader,
  name,
}: {
  loader: Loader<any, any>;
  name: string;
}) => {
  const staticChunkModuleCache = useStaticChunkModuleMap();
  const chunkModuleFromLoader = loader();
  if (isSyncValue(chunkModuleFromLoader)) {
    staticChunkModuleCache.set(name, chunkModuleFromLoader);
  }
  const [syncChunkModule, setSyncChunkModule] = useState(
    staticChunkModuleCache.get(name)
  );
  useEffect(() => {
    let canceled = false;
    if (!syncChunkModule) {
      Promise.resolve(chunkModuleFromLoader).then((result) => {
        if (!canceled) {
          setSyncChunkModule(result);
          staticChunkModuleCache.set(name, result);
        }
      });
    }
    return () => {
      canceled = true;
    };
  }, [loader, name, syncChunkModule, setSyncChunkModule]);
  return syncChunkModule ?? useChunkModule.LOADING;
};
useChunkModule.LOADING = Symbol("useChunkModule.LOADING");

const useViewState = ({
  delegateProps,
  generateViewState,
  name,
  isReady,
}: {
  delegateProps: {};
  generateViewState: ChunkModule<{}, {}>["generateViewState"];
  name: string;
  isReady: boolean;
}) => {
  const viewStateCache = useViewStateCacheMap();
  const chunkCacheKey = generateChunkCacheKey(name, delegateProps);
  const [data, setSyncViewState] = useState(
    viewStateCache.has(chunkCacheKey)
      ? {
          viewState: viewStateCache.get(chunkCacheKey),
          isFinal: true,
        }
      : undefined
  );
  const shouldFetchData = isReady && (!data || !data.isFinal);

  useEffect(() => {
    let canceled = false;
    if (!shouldFetchData) {
      return () => {
        canceled = true;
      };
    }

    // does not have data fetching function
    if (!generateViewState) {
      setSyncViewState({
        viewState: {},
        isFinal: true,
      });
      return () => {
        canceled = true;
      };
    }

    const saveValue = ({
      viewState,
      isFinal,
    }: {
      viewState: {};
      isFinal: boolean;
    }) => {
      const nextState = viewState || {};
      if (isFinal) {
        viewStateCache.set(chunkCacheKey, nextState);
      }
      if (!canceled) {
        setSyncViewState({
          viewState: nextState,
          isFinal,
        });
      }
    };

    Promise.resolve(generateViewState(delegateProps)).then(async (result) => {
      if (!isGeneratorValue(result)) {
        saveValue({ viewState: result, isFinal: true });
        return;
      }
      let finalValue = {};
      for await (const value of result) {
        fireAsAct(() => saveValue({ viewState: value, isFinal: false }));
        finalValue = value;
      }
      fireAsAct(() => saveValue({ viewState: finalValue, isFinal: true }));
    });

    return () => {
      canceled = true;
    };
  }, [chunkCacheKey, generateViewState, shouldFetchData]);

  return data?.viewState ?? useViewState.LOADING;
};
useViewState.LOADING = Symbol("useViewState.LOADING");

export default ClientBaseChunk;
