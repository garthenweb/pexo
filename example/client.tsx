import React from "react";
import { mount } from "../src/client";
import App from './app'

mount({
  createApp: () => <App />,
  container: document.createElement("div"),
});
