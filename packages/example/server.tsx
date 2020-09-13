import "isomorphic-fetch";
import React from "react";
import express from "express";
import path from "path";
import {
  createPluginStyledComponents,
  createStreamMiddleware,
} from "@pexo/core";
import App from "./app";
import createApi from "./server.api";

const expressApp = express();

expressApp.use("/favicon.ico", (req, res) => res.sendStatus(404));
expressApp.use(
  "/public",
  express.static(path.join(process.cwd(), "dist", "public"), {
    maxAge:
      process.env.NODE_ENV === "production" ? 1000 * 60 * 60 * 24 * 360 : 2500,
    setHeaders: function (res, filePath) {
      if (
        filePath.startsWith(path.join(process.cwd(), "dist", "public", "__"))
      ) {
        res.setHeader("service-worker-allowed", "/");
      }
    },
  })
);

if (process.env.NODE_ENV !== "production") {
  expressApp.use(
    "/__parcel_source_root",
    express.static(path.join(process.cwd(), "../.."), {
      maxAge: 2500,
    })
  );
  expressApp.use(
    "/node_modules",
    express.static(path.join(process.cwd(), "../../node_modules"), {
      maxAge: 2500,
    })
  );
  expressApp.use(
    "/packages",
    express.static(path.join(process.cwd(), "../../packages"), {
      maxAge: 2500,
    })
  );
}

createApi(expressApp);
expressApp.get(
  "*",
  createStreamMiddleware({
    createApp: () => <App />,
    plugins: [createPluginStyledComponents()],
  })
);

expressApp.listen(3000, () =>
  console.log(`Example app listening at http://localhost:${3000}`)
);
