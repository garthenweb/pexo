import React, { FC } from "react";
import { Routes, Chunk, Route } from "@pexo/core";
import styled from "styled-components";
import Homepage from "./pages/Homepage";
import Page1 from "./pages/Page1";
import Page2 from "./pages/Page2";
import Bookmarks from "./pages/Bookmarks";

const Wrapper = styled.div`
  margin: 10px;
`;

const App: FC = () => {
  return (
    <Wrapper>
      <Chunk loader={() => import("./chunks/Header")} />
      <Routes>
        <Route path="/" component={Homepage} />
        <Route path="/page1" component={Page1} />
        <Route path="/page2" component={Page2} />
        <Route path="/bookmarks" component={Bookmarks} />
        <Route path="/redirect" component={Page2} />
      </Routes>
    </Wrapper>
  );
};

export default App;
