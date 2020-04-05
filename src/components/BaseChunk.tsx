import React from "react";
import ServerBaseChunk from "./ServerBaseChunk";
import { BaseChunkType } from "./types";

const BaseChunk: BaseChunkType = ({
  name = throwNameNotDefined(),
  loader,
  ...delegateProps
}) => {
  if (!process.browser) {
    return <ServerBaseChunk name={name} loader={loader} {...delegateProps} />;
  }
  return null;
};

const throwNameNotDefined = () => {
  throw new Error(
    "Name property is missing on a chunk. This is a required property which should be injected by babel plugin poxy-babel. Most probably it is not present in the babel config."
  );
};

export default BaseChunk;
