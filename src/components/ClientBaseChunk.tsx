import React, { useEffect, useState, useRef } from "react";
import { generateChunkCacheKey } from "../utils/cacheKey";
import { ChunkModule, Loader, BaseProps } from "./types";
import { useViewStateCacheMap } from "../context/ViewStateCache";
import { useStaticChunkModuleMap } from "../context/StaticChunkModuleCacheContext";
import { isSyncValue } from "../utils/isSyncValue";
import { useIsVirtualEnvironment } from "../context/VirtualEnvironmentContext";
import { isGeneratorValue } from "../utils/isGeneratorValue";
import { fireAsAct } from "../utils/testing";
import Redirect from "./Redirect";
import { HeadConsumer } from "../context/ClientHeadContext";
import { ensureAsync } from "../utils/ensureAsync";
import { useRequest } from "../context/ClientRequestContext";
import { useResourceInvalidator } from "../request";

const ClientBaseChunk = <InputProps extends {}, ViewState extends {}>({
  name,
  loader,
  redirect,
  head,
  actions,
  ...delegateProps
}: InputProps & BaseProps<InputProps, ViewState>) => {
  const chunkModule = useChunkModule({ name, loader });
  const isVirtualEnvironment = useIsVirtualEnvironment();
  const { status, data } = useViewState({
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
  if (redirect) {
    if (status === useViewState.LOADING) {
      return null;
    }
    return <Redirect {...(data as any)} />;
  }

  if (head) {
    if (status === useViewState.LOADING) {
      return null;
    }
    return <HeadConsumer {...(data as any)} />;
  }

  if (status === useViewState.LOADING) {
    if (chunkModule.Loading) {
      return <chunkModule.Loading actions={actions} />;
    }
    return null;
  }

  if (status === useViewState.ERROR) {
    if (chunkModule.Error) {
      return <chunkModule.Error error={data} actions={actions} />;
    }
    return null;
  }

  return <chunkModule.View {...data} actions={actions} />;
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
      ensureAsync(chunkModuleFromLoader).then((result) => {
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
  const request = useRef(useRequest().clone());
  const viewStateCache = useViewStateCacheMap();
  const lastChunkCacheKey = useRef<string | undefined>();
  const chunkCacheKey = generateChunkCacheKey(name, delegateProps);
  const [data, setSyncViewState] = useState<{
    viewState: undefined | {};
    resourceIds: undefined | string[];
    isFinal: boolean;
    isFailure: boolean;
    error: unknown;
  }>(
    viewStateCache.has(chunkCacheKey)
      ? {
          viewState: viewStateCache.get(chunkCacheKey)!.viewState,
          resourceIds: viewStateCache.get(chunkCacheKey)!.resourceIds,
          isFinal: true,
          isFailure: false,
          error: undefined,
        }
      : {
          viewState: undefined,
          resourceIds: undefined,
          isFinal: false,
          isFailure: false,
          error: undefined,
        }
  );
  const resourcesMightBeInvalid = useResourceInvalidator(
    request.current,
    data.resourceIds
  );
  const cacheKeyChanged =
    lastChunkCacheKey.current && lastChunkCacheKey.current !== chunkCacheKey;
  const shouldFetchData =
    isReady &&
    (!data.viewState ||
      !data.isFinal ||
      cacheKeyChanged ||
      resourcesMightBeInvalid);
  lastChunkCacheKey.current = chunkCacheKey;

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
        resourceIds: [],
        isFinal: true,
        isFailure: false,
        error: undefined,
      });
      return () => {
        canceled = true;
      };
    }

    const saveValue = ({
      viewState,
      isFinal,
      resourceIds,
    }: {
      viewState: {};
      isFinal: boolean;
      resourceIds: string[];
    }) => {
      const nextState = viewState || {};
      if (isFinal) {
        viewStateCache.set(chunkCacheKey, {
          viewState: nextState,
          resourceIds,
        });
      }
      if (!canceled) {
        setSyncViewState({
          viewState: nextState,
          resourceIds,
          isFinal,
          isFailure: false,
          error: undefined,
        });
      }
    };

    request.current.reset();
    ensureAsync(generateViewState(delegateProps, { request: request.current }))
      .then(async (result) => {
        if (!isGeneratorValue(result)) {
          const resourceIds = request.current.retrieveUsedResourceIds();
          saveValue({ viewState: result, isFinal: true, resourceIds });
          return;
        }
        let finalValue = {};
        for await (const value of result) {
          const resourceIds = request.current.retrieveUsedResourceIds();
          fireAsAct(() =>
            saveValue({ viewState: value, isFinal: false, resourceIds })
          );
          finalValue = value;
        }
        const resourceIds = request.current.retrieveUsedResourceIds();
        fireAsAct(() =>
          saveValue({ viewState: finalValue, isFinal: true, resourceIds })
        );
      })
      .catch((error) => {
        if (!canceled) {
          setSyncViewState({
            viewState: undefined,
            resourceIds: [],
            error,
            isFailure: true,
            isFinal: true,
          });
        }
      });

    return () => {
      canceled = true;
    };
  }, [chunkCacheKey, generateViewState, shouldFetchData, request]);

  if (data?.isFailure) {
    return { status: useViewState.ERROR, data: data.error };
  }
  if (data?.viewState) {
    return { status: useViewState.DONE, data: data.viewState };
  }
  return { status: useViewState.LOADING, data: null };
};
useViewState.DONE = Symbol("useViewState.DONE");
useViewState.LOADING = Symbol("useViewState.LOADING");
useViewState.ERROR = Symbol("useViewState.ERROR");

export default ClientBaseChunk;
