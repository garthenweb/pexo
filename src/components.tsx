import React from "react";
import BaseChunk from "./components/BaseChunk";
import { BaseProps } from "./components/types";

export const TestingViewChunk = <InputProps extends {}, ViewState extends {}>(
  props: InputProps & Omit<BaseProps<InputProps, ViewState>, "name">
) => <BaseChunk name={performance.now().toString()} {...props} />;

export const Chunk = <InputProps extends {}, ViewState extends {}>(
  props: InputProps & Omit<BaseProps<InputProps, ViewState>, "name">
) => {
  // name prop will always be passed in case babel is in place and therefore override the empty string, it is just here to make typescript happy
  return <BaseChunk name="" {...props} />;
};
