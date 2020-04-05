import React from "react";
import { mount, unmount } from "../client";

test("poxi should render a simple application in the client", async () => {
  const container = document.createElement("div");
  const ReactApp = () => <div>Hello World</div>;
  const app = await mount({
    container,
    createApp: () => <ReactApp />
  });
  expect(container.innerHTML).toContain("Hello World");
  unmount(app);
});
