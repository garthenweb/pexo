import { ComponentType } from "react";
import { GenerateViewStateUtils } from "../types/GenerateViewStateUtils";

export interface ChunkModule<InputProps, ViewState> {
  View: ComponentType<ViewState>;
  Loading?: ComponentType<{}>;
  Error?: ComponentType<{ error: unknown }>;
  generateViewState?: (
    props: InputProps,
    utils: GenerateViewStateUtils
  ) => Promise<ViewState> | ViewState;
}

export type MaybeAsyncChunkModule<InputProps, ViewState> =
  | ChunkModule<InputProps, ViewState>
  | Promise<ChunkModule<InputProps, ViewState>>;

export type Loader<InputProps, ViewState> = (
  serverRegistrationProps?: InputProps
) => MaybeAsyncChunkModule<InputProps, ViewState>;

type BaseProps<InputProps, ViewState> = {
  name: string;
  loader: Loader<InputProps, ViewState>;
  redirect?: boolean;
  head?: boolean;
};
