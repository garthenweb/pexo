import React from "react";
import express from "express";
import path from "path";
import { createStreamMiddleware } from "../src/server";
import App from "./app";
import { createPluginStyledComponents } from "../src/plugins";

const expressApp = express();

expressApp.use("/favicon.ico", (req, res) => res.sendStatus(404));
expressApp.use(
  "/public",
  express.static(path.join(process.cwd(), "dist", "public"), {
    maxAge:
      process.env.NODE_ENV === "production" ? 1000 * 60 * 60 * 24 * 360 : 2500,
  })
);
if (process.env.NODE_ENV !== "production") {
  expressApp.use(
    "/__parcel_source_root",
    express.static(path.join(process.cwd()), {
      maxAge: 2500,
    })
  );
}

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
