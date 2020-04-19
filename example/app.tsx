import React, { FC } from "react";
import { Chunk, Route } from "../src/components";
import Homepage from "./pages/Homepage";
import Page1 from "./pages/Page1";
import Page2 from "./pages/Page2";
import Routes from "../src/components/Routes";

const App: FC = () => {
  return (
    <>
      <Chunk loader={() => import("./chunks/Header")} />
      <Routes>
        <Route path="/" component={Homepage} />
        <Route path="/page1" component={Page1} />
        <Route path="/page2" component={Page2} />
        <Route path="/redirect" component={Page2} />
      </Routes>
    </>
  );
};

export default App;
