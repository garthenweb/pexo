import React, { FC, useState } from "react";
import { Chunk, RedirectChunk, HeadChunk } from "../../src/components";

const Page2: FC<{ location: Location }> = ({ location }) => {
  const [counter, setCount] = useState(0);
  return (
    <>
      <HeadChunk
        title="page2"
        icon="🐕"
        loader={() => import("../chunks/head")}
      />
      <Chunk
        page="page2"
        value={counter}
        actions={{ countUp: () => setCount(counter + 1) }}
        loader={() => import("../chunks/chunk2")}
      />
      <Chunk page="page2" loader={() => import("../chunks/chunk1")} />
      <RedirectChunk
        pathname={location.pathname}
        loader={() => import("../chunks/redirect")}
      />
    </>
  );
};

export default Page2;
