import React, { FC } from "react";
import { Chunk } from "../../src/components";

const Page2: FC = () => {
  return (
    <>
      <Chunk page="page2" loader={() => import("../chunks/chunk2")} />
      <Chunk page="page2" loader={() => import("../chunks/chunk1")} />
    </>
  );
};

export default Page2;
