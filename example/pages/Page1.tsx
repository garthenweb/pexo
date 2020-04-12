import React, { FC } from "react";
import { Chunk } from "../../src/components";

const Page1: FC = () => {
  return (
    <>
      <Chunk page="page1" loader={() => import("../chunks/chunk1")} />
      <Chunk page="page1" loader={() => import("../chunks/chunk2")} />
    </>
  );
};

export default Page1;
