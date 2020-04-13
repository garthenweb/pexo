import React, { FC } from "react";
import { Chunk, RedirectChunk } from "../../src/components";

const Page2: FC<{ location: Location }> = ({ location }) => {
  return (
    <>
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
