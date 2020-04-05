import { ComponentType, FC } from "react";

export interface ChunkModule<InputProps extends {}, ViewState extends {}> {
  View: ComponentType<ViewState>;
  generateViewState?: (props: InputProps) => Promise<ViewState> | ViewState;
}

export type Loader<InputProps extends {}, ViewState extends {}> = (
  serverRegistrationProps?: InputProps
) =>
  | ChunkModule<InputProps, ViewState>
  | Promise<ChunkModule<InputProps, ViewState>>;

export type BaseProps<InputProps extends {}, ViewState extends {}> = {
  name: string;
  loader: Loader<InputProps, ViewState>;
};

export interface BaseChunkType<
  InputProps extends {} = {},
  ViewState extends {} = {},
  Props extends InputProps = BaseProps<InputProps, ViewState> & InputProps
> {
  (props: Props): ReturnType<FC>;
}
