import React from "react";
import express from "express";
import { createStreamMiddleware } from "../src/server";
import App from "./app";

const expressApp = express();
expressApp.use(
  "*",
  createStreamMiddleware({
    createApp: () => <App />,
  })
);

expressApp.listen(3000, () =>
  console.log(`Example app listening at http://localhost:${3000}`)
);
