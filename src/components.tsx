import React from "react";
import BaseChunk from "./components/BaseChunk";
import { BaseProps } from "./components/types";

export const TestingViewChunk = <InputProps extends {}, ViewState extends {}>(
  props: InputProps & Omit<BaseProps<InputProps, ViewState>, "name">
) => <BaseChunk name={performance.now().toString()} {...props} />;
