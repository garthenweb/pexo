import { ComponentType, FC } from "react";

export interface ChunkModule<InputProps, ViewState> {
  View: ComponentType<ViewState>;
  generateViewState?: (props: InputProps) => Promise<ViewState> | ViewState;
}

export type Loader<InputProps, ViewState> = (
  serverRegistrationProps?: InputProps
) =>
  | ChunkModule<InputProps, ViewState>
  | Promise<ChunkModule<InputProps, ViewState>>;

export type BaseProps<InputProps, ViewState> = {
  name: string;
  loader: Loader<InputProps, ViewState>;
  redirect?: boolean;
};

export interface BaseChunkType<
  InputProps = {},
  ViewState = {},
  Props extends InputProps = BaseProps<InputProps, ViewState> & InputProps
> {
  (props: Props): ReturnType<FC>;
}
