import { ComponentType, FC, ReactNode } from "react";

export interface ChunkModule<InputProps, ViewState> {
  View: ComponentType<ViewState>;
  generateViewState?: (props: InputProps) => Promise<ViewState> | ViewState;
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
};
