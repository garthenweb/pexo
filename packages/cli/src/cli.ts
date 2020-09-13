#!/usr/bin/env node
import { program } from "commander";
import path from "path";
import { spawn } from "child_process";

interface Options {
  clientEntry: string;
  serverEntry: string;
}

program.version("0.0.0");

program
  .command("develop")
  .description("start project for development")
  .requiredOption(
    "--server-entry <path>",
    "entry JavaScript file for the server"
  )
  .requiredOption(
    "--client-entry <path>",
    "entry JavaScript file for the client"
  )
  .action(({ clientEntry, serverEntry }: Options) => {
    const fullServerEntry = path.join(process.cwd(), serverEntry);
    const fullClientEntry = path.join(process.cwd(), clientEntry);
    console.log("");
    console.log("[PeXo] BUILD APPLICATION");
    console.log("");
    const parcelServerProcess = spawnServerBuildDev(fullServerEntry);
    const parcelClientProcess = spawnClientWatch(fullClientEntry);
    parcelClientProcess.on("exit", () => {
      process.exit(1);
    });
    parcelServerProcess.on("exit", () => {
      console.log("");
      console.log("[PeXo] START SERVER");
      console.log("");
      const serverProcess = spawnServerRun();
      serverProcess.on("exit", () => {
        process.exit(1);
      });
    });
  });

program
  .command("build")
  .description("build project for production")
  .requiredOption(
    "--server-entry <path>",
    "entry JavaScript file for the server"
  )
  .requiredOption(
    "--client-entry <path>",
    "entry JavaScript file for the client"
  )
  .action(async ({ clientEntry, serverEntry }: Options) => {
    const fullServerEntry = path.join(process.cwd(), serverEntry);
    const fullClientEntry = path.join(process.cwd(), clientEntry);
    console.log("");
    console.log("[PeXo] BUILD APPLICATION");
    console.log("");
    const parcelServerProcess = spawnServerBuildDev(
      fullServerEntry,
      "production"
    );
    const parcelClientProcess = spawnClientWatch(fullClientEntry, "production");
    const clientDone = new Promise((resolve, reject) =>
      parcelClientProcess.on("exit", (err) => (err ? reject(err) : resolve()))
    );
    const serverDone = new Promise((resolve, reject) =>
      parcelServerProcess.on("exit", (err) => (err ? reject(err) : resolve()))
    );
    await Promise.all([clientDone, serverDone]);
    console.log("");
    console.log("[PeXo] BUILD DONE");
    console.log("");
  });

const spawnClientWatch = (entry: string, mode = "development") => {
  const childProcess = spawn(
    parcelExecPath,
    [
      mode === "development" ? "watch" : "build",
      "--dist-dir",
      path.join(distDir, "public"),
      "--public-url",
      "/public",
      "--target",
      "client",
      mode === "development" ? "--watch-for-stdin" : "",
      "--cache-dir",
      ".parcel-cache/client",
      "--no-cache",
      entry,
    ],
    {
      shell: true,
      stdio: ["pipe", "inherit", "inherit"],
      env: Object.assign(
        {
          PEXO_CONTEXT: "client",
          VERSION: generateVersionHash(),
          NODE_ENV: mode,
        },
        process.env
      ),
    }
  );
  return childProcess;
};

const spawnServerBuildDev = (entry: string, mode = "development") => {
  const childProcess = spawn(
    parcelExecPath,
    [
      "build",
      "--dist-dir",
      distDir,
      "--target",
      "server",
      "--cache-dir",
      ".parcel-cache/server",
      mode === "development" ? "--no-minify" : "",
      "--no-cache",
      entry,
    ],
    {
      shell: true,
      stdio: ["pipe", "inherit", "inherit"],
      env: Object.assign(
        {
          PEXO_CONTEXT: "server",
          VERSION: generateVersionHash(),
          NODE_ENV: mode,
        },
        process.env
      ),
    }
  );
  return childProcess;
};

const spawnServerRun = () => {
  const childProcess = spawn("node", [path.join(distDir, "server", "server.js")], {
    shell: true,
    stdio: ["pipe", "inherit", "inherit"],
    env: process.env,
  });
  return childProcess;
};

const parcelExecPath = require.resolve("parcel");

const generateVersionHash = () => {
  if (process.env.VERSION) {
    return process.env.VERSION;
  }
  return require("child_process")
    .execSync("git rev-parse HEAD")
    .toString()
    .trim();
};

const distDir = path.join(process.cwd(), "dist");

program.parse(process.argv);
