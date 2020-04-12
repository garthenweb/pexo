import React, { FC } from "react";
import { Chunk } from "../../src/components";

const Homepage: FC = () => {
  return (
    <>
      <Chunk loader={() => import("../chunks/chunk1")} />
      <Chunk loader={() => import("../chunks/chunk2")} />
    </>
  );
};

export default Homepage;
