import React from "react";
import { Chunk } from "../src/components";

const App = () => {
  return (
    <>
      <Chunk loader={() => import("./chunks/chunk1")} />
      <Chunk loader={() => import("./chunks/chunk2")} />
    </>
  );
};

export default App;
