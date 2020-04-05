import React from "react";
import BaseChunk, { BaseChunkType, ChunkModule } from "./components/BaseChunk";

export const TestingViewChunk: BaseChunkType<
  {},
  {},
  {
    loader: () => ChunkModule<{}, {}>;
  }
> = (props) => <BaseChunk name={performance.now().toString()} {...props} />;
