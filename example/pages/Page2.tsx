import React, { FC } from "react";
import { Chunk, RedirectChunk, HeadChunk } from "../../src/components";

const Page2: FC<{ location: Location }> = ({ location }) => {
  return (
    <>
      <HeadChunk
        title="page1"
        icon="🐕"
        loader={() => import("../chunks/head")}
      />
      <Chunk page="page2" loader={() => import("../chunks/chunk2")} />
      <Chunk page="page2" loader={() => import("../chunks/chunk1")} />
      <RedirectChunk
        pathname={location.pathname}
        loader={() => import("../chunks/redirect")}
      />
    </>
  );
};

export default Page2;
