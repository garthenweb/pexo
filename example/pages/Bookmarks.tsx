import React, { FC } from "react";
import { Chunk, HeadChunk } from "../../src/components";

const Bookmarks: FC = () => {
  return (
    <>
      <HeadChunk icon="📚" loader={() => import("../chunks/head")} />
      <Chunk loader={() => import("../chunks/BookmarkCreate.Chunk")} />
      <Chunk loader={() => import("../chunks/BookmarkList.Chunk")} />
    </>
  );
};

export default Bookmarks;
