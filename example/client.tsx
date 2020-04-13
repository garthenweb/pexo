import React from "react";
import { mount } from "../src/client";
import App from "./app";
import { createPluginStyledComponents } from "../src/plugins";

mount({
  createApp: () => <App />,
  requestContainer: () => document.querySelector("main")!,
  plugins: [createPluginStyledComponents()],
});
