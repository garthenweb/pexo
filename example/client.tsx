import React from "react";
import { mount } from "../src/client";
import App from "./app";

mount({
  createApp: () => <App />,
  requestContainer: () => document.querySelector("main")!,
});
