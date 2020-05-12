import React from "react";
import {
  mount,
  createPluginStyledComponents,
  createPluginServiceWorker,
} from "@pexo/core";
import App from "./app";

mount({
  createApp: () => <App />,
  requestContainer: () => document.querySelector("main")!,
  plugins: [
    createPluginStyledComponents(),
    createPluginServiceWorker({
      disable: process.env.NODE_ENV !== "production",
    }),
  ],
});
