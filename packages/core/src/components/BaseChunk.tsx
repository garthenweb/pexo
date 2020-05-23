import React, {
  memo,
  createContext,
  useRef,
  useContext,
  useState,
  FC,
  useReducer,
} from "react";
import shallowEqual from "shallowequal";
import ServerBaseChunk from "./ServerBaseChunk";
import ClientBaseChunk from "./ClientBaseChunk";
import ClientBaseChunkSuspense from "./ClientBaseChunk.next";
import { BaseProps, ChunkModule } from "./types";
import { generateChunkCacheKey } from "../utils/cacheKey";
import { useStaticChunkModuleMap } from "../context/StaticChunkModuleCacheContext";

const BaseChunk = <InputProps extends {}, ViewState extends {}>({
  $$name = throwNameNotDefined(),
  loader,
  redirect,
  head,
  actions,
  ...delegateProps
}: InputProps & BaseProps<InputProps, ViewState>) => {
  const Component = process.browser ? getClientComponent() : ServerBaseChunk;

  return (
    <ChunkContextProvider $$name={$$name} delegateProps={delegateProps}>
      <Component
        $$name={$$name}
        loader={loader}
        redirect={redirect}
        head={head}
        actions={actions}
        {...delegateProps}
      />
    </ChunkContextProvider>
  );
};

const throwNameNotDefined = () => {
  throw new Error(
    "$$name property is missing on a chunk. This is a required property which should be injected by babel plugin @pexo/babel-transform. Most probably it is not present in the babel config."
  );
};

const ChunkContext = createContext<{
  cacheKey: undefined | string;
  module: undefined | ChunkModule<any, any>;
  updateModule: (module: ChunkModule<any, any>) => void;
}>({
  cacheKey: undefined,
  module: undefined,
  updateModule: () => {},
});

const ChunkContextProvider: FC<{ $$name: string; delegateProps: any }> = ({
  $$name,
  delegateProps,
  children,
}) => {
  const cacheKey = generateChunkCacheKey($$name, delegateProps);
  const staticChunkModuleCache = useStaticChunkModuleMap();
  const [module, setModule] = useState(staticChunkModuleCache.get($$name));
  const updateModule = (module: ChunkModule<any, any>) => {
    staticChunkModuleCache.set($$name, module);
    setModule(module);
  };
  const ctxValue = {
    cacheKey,
    module,
    updateModule,
  };

  return (
    <ChunkContext.Provider value={ctxValue}>{children}</ChunkContext.Provider>
  );
};

export const useChunkContext = () => useContext(ChunkContext);

const getClientComponent = () => {
  if (process.env.PEXO_EXPERIMENTAL === "true") {
    return ClientBaseChunkSuspense;
  }
  return ClientBaseChunk;
};

export default memo(
  BaseChunk,
  ({ loader: loaderPrev, ...prev }, { loader, ...next }) =>
    shallowEqual(prev, next)
);
