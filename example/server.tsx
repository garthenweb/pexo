import React from "react";
import express from "express";
import path from "path";
import { createStreamMiddleware } from "../src/server";
import App from "./app";

const expressApp = express();
expressApp.use(
  "/public",
  express.static(path.join(process.cwd(), "dist", "public"), {
    maxAge: 1000 * 60 * 60 * 24 * 360,
  })
);
expressApp.use(
  "*",
  createStreamMiddleware({
    createApp: () => <App />,
  })
);

expressApp.listen(3000, () =>
  console.log(`Example app listening at http://localhost:${3000}`)
);
