import React, { memo } from "react";
import shallowEqual from "shallowequal";
import ServerBaseChunk from "./ServerBaseChunk";
import ClientBaseChunk from "./ClientBaseChunk";
import { BaseProps } from "./types";

const BaseChunk = <InputProps extends {}, ViewState extends {}>({
  name = throwNameNotDefined(),
  loader,
  redirect,
  head,
  actions,
  ...delegateProps
}: InputProps & BaseProps<InputProps, ViewState>) => {
  if (!process.browser) {
    return (
      <ServerBaseChunk
        name={name}
        loader={loader}
        redirect={redirect}
        head={head}
        actions={actions}
        {...delegateProps}
      />
    );
  }
  return (
    <ClientBaseChunk
      name={name}
      loader={loader}
      redirect={redirect}
      head={head}
      actions={actions}
      {...delegateProps}
    />
  );
};

const throwNameNotDefined = () => {
  throw new Error(
    "Name property is missing on a chunk. This is a required property which should be injected by babel plugin poxy-babel. Most probably it is not present in the babel config."
  );
};

export default memo(
  BaseChunk,
  ({ loader: loaderPrev, ...prev }, { loader, ...next }) =>
    shallowEqual(prev, next)
);
