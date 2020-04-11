import React from "react";
import BaseChunk from "../src/components/BaseChunk";

const App = () => {
  return (
    <>
      <BaseChunk name="test1" loader={() => require("./chunks/chunk1")} />
      <BaseChunk name="test2" loader={() => require("./chunks/chunk2")} />
    </>
  );
};

export default App;
