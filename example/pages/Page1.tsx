import React, { FC } from "react";
import { Chunk, HeadChunk } from "../../src/components";

const Page1: FC = () => {
  return (
    <>
      <HeadChunk
        title="page1"
        icon="🐈"
        loader={() => import("../chunks/head")}
      />
      <Chunk page="page1" loader={() => import("../chunks/chunk1")} />
    </>
  );
};

export default Page1;
