#!/usr/bin/env node
import { program } from "commander";
import path from "path";
import { spawn, SpawnOptionsWithoutStdio } from "child_process";

interface Options {
  clientEntry: string;
  serverEntry: string;
}

program
  .version("0.0.0")
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
    console.log("[PoXi] BUILD APPLICATION");
    console.log("");
    const parcelServerProcess = spawnServerBuildDev(fullServerEntry);
    const parcelClientProcess = spawnClientWatch(fullClientEntry);
    parcelClientProcess.on("exit", () => {
      process.exit(1);
    });
    parcelServerProcess.on("exit", () => {
      console.log("");
      console.log("[PoXi] START SERVER");
      console.log("");
      const serverProcess = spawnServerRun();
      serverProcess.on("exit", () => {
        process.exit(1);
      });
    });
  });

const spawnClientWatch = (entry: string) => {
  const childProcess = spawn(
    parcelExecPath,
    [
      "watch",
      "--dist-dir",
      path.join(distDir, "public"),
      "--target",
      "client",
      "--watch-for-stdin",
      "--cache-dir",
      ".parcel-cache/client",
      "--no-cache",
      entry,
    ],
    {
      shell: true,
      stdio: ["pipe", "inherit", "inherit"],
      env: Object.assign({ POXI_CONTEXT: "client" }, process.env),
    }
  );
  return childProcess;
};

const spawnServerBuildDev = (entry: string) => {
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
      "--no-minify",
      "--no-cache",
      entry,
    ],
    {
      shell: true,
      stdio: ["pipe", "inherit", "inherit"],
      env: Object.assign({ POXI_CONTEXT: "server" }, process.env),
    }
  );
  return childProcess;
};

const spawnServerRun = () => {
  const childProcess = spawn("node", [path.join(distDir, "server.js")], {
    shell: true,
    stdio: ["pipe", "inherit", "inherit"],
    env: process.env,
  });
  return childProcess;
};

const parcelExecPath = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  "parcel"
);

const distDir = path.join(process.cwd(), "dist");

program.parse(process.argv);
