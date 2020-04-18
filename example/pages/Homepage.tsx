import React, { FC } from "react";
import { Chunk, HeadChunk } from "../../src/components";

const Homepage: FC = () => {
  return (
    <>
      <HeadChunk icon="🦌" loader={() => import("../chunks/head")} />
      <Chunk loader={() => import("../chunks/chunk1")} />
    </>
  );
};

export default Homepage;
