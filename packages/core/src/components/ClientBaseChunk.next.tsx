import React, {
  useRef,
  Suspense,
  FC,
  ComponentType,
  useReducer,
  useEffect,
} from "react";
import { isGeneratorValue } from "@pexo/utils";
import { useResourceOutdated } from "@pexo/request";

import { useViewStateCacheMap } from "../context/ViewStateCache";
import { useRequest } from "../context/ClientRequestContext";
import { useChunkContext } from "./BaseChunk";
import { BaseProps, ViewActions } from "./types";
import { useIsVirtualEnvironment } from "../context/VirtualEnvironmentContext";
import Redirect from "./Redirect";
import { HeadConsumer } from "../context/ClientHeadContext";
import { ensureAsync } from "../utils/ensureAsync";
import { ClientViewStateCacheItem } from "../types/ViewStateCache";
import { fireAsAct } from "../utils/testing";

const ClientBaseChunk = <InputProps extends {}, ViewState extends {}>(
  props: InputProps & BaseProps<InputProps, ViewState>
) => {
  const hasVisualLoadingState = !props.head && !props.redirect;
  const { module } = useChunkContext();

  return (
    <ErrorBoundary View={module?.ErrorView} actions={props.actions}>
      <Suspense fallback={hasVisualLoadingState ? <Fallback /> : null}>
        <ChunkViewRenderer {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

const ChunkViewRenderer = <InputProps extends {}, ViewState extends {}>({
  $$name,
  loader,
  redirect,
  head,
  actions,
  ...delegateProps
}: InputProps & BaseProps<InputProps, ViewState>) => {
  const View = useModuleLoader(loader, { redirect, head });
  const data = useViewState(delegateProps);
  const isVirtualEnvironment = useIsVirtualEnvironment();
  if (isVirtualEnvironment) {
    return null;
  }
  if (!View) {
    return null;
  }
  return <View actions={actions} {...data?.viewState} />;
};

const Fallback: FC = () => {
  const { module } = useChunkContext();

  if (module && module.LoadingView) {
    return <module.LoadingView />;
  }

  return null;
};

interface ErrorBoundaryProps {
  View?: ComponentType<{ error: unknown; actions?: ViewActions }>;
  actions?: ViewActions;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { error?: unknown }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {};
  }

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  render() {
    if (this.state.error) {
      if (!this.props.View) {
        return null;
      }
      return (
        <this.props.View
          error={this.state.error}
          actions={this.props.actions}
        />
      );
    }

    return this.props.children;
  }
}

const useModuleLoader = (
  loader: any,
  { redirect, head }: { redirect?: boolean; head?: boolean }
) => {
  const { module, updateModule } = useChunkContext();
  if (!module) {
    throw ensureAsync(loader()).then((m) => updateModule(m));
  }
  const View = module.View;

  if (!View && redirect) {
    return Redirect;
  }

  if (!View && head) {
    return HeadConsumer;
  }

  return View;
};

interface UpdateViewStateArgs {
  result?: {};
  error?: unknown;
  generator?: AsyncGenerator;
}

const useViewState = (
  delegateProps: any
): ClientViewStateCacheItem | undefined => {
  const { module, cacheKey } = useChunkContext();
  const request = useRef(useRequest().clone()).current;
  const utils = { request };
  const viewStateCache = useViewStateCacheMap();

  if (!cacheKey) {
    throw new Error("A chunk should always have a cache key.");
  }

  const updateViewState = ({
    result,
    error,
    generator,
  }: UpdateViewStateArgs) => {
    viewStateCache.set(cacheKey, {
      viewState: result || {},
      resourceIds: request.retrieveUsedResourceIds(),
      updatedAt: Date.now(),
      error,
      generator,
    });
  };

  const data = viewStateCache.get(cacheKey);
  useGenerator(data?.generator, {
    updateViewState,
    cacheKey,
  });

  const resourcesAreOutdated = useResourceOutdated(
    request,
    data?.resourceIds ?? [],
    data?.updatedAt
  );

  if (data && !resourcesAreOutdated) {
    if (data.error) {
      throw data.error;
    }
    return data;
  }

  if (!module) {
    return;
  }

  if (!module.generateViewState) {
    return {
      viewState: {},
      resourceIds: [],
      updatedAt: Date.now(),
    };
  }

  throw executeGenerateViewState({
    asyncResult: module.generateViewState(delegateProps, utils),
    updateViewState,
  });
};

const executeGenerateViewState = async ({
  asyncResult,
  updateViewState,
}: {
  asyncResult: Promise<any>;
  updateViewState: (config: UpdateViewStateArgs) => void;
}) => {
  try {
    const result = (await asyncResult) ?? {};

    if (isGeneratorValue(result)) {
      const generator = result;
      const { value, done } = await generator.next();
      updateViewState({
        result: value,
        generator: !done ? generator : undefined,
      });
      return;
    }
    updateViewState({ result });
  } catch (error) {
    updateViewState({
      error: error ?? new Error("Failed to execute generateViewState"),
    });
  }
};

const useGenerator = (
  generator: AsyncGenerator | undefined,
  {
    updateViewState,
    cacheKey,
  }: {
    cacheKey: string;
    updateViewState: (config: UpdateViewStateArgs) => void;
  }
) => {
  const [, forceUpdate] = useReducer((state) => {
    return state + 1;
  }, 0);
  useEffect(() => {
    if (!generator) {
      return;
    }
    (async () => {
      try {
        let lastResult;
        for await (const viewState of generator) {
          lastResult = viewState;
          updateViewState({ result: viewState as {}, generator });
          fireAsAct(forceUpdate);
        }
        updateViewState({ result: lastResult as {}, generator: undefined });
      } catch (error) {
        updateViewState({
          error: error ?? new Error("Failed to execute generateViewState"),
        });
        fireAsAct(forceUpdate);
      }
    })();
  }, [cacheKey, generator]);
};

export default ClientBaseChunk;
