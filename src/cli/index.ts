#!/usr/bin/env node
import { program } from "commander";
import path from "path";
import { spawn } from "child_process";

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

    const parcelServerProcess = spawnServerBuildDev(fullServerEntry);
    const parcelClientProcess = spawnClientWatch(fullClientEntry);
    parcelClientProcess.on("exit", () => {
      process.exit(1);
    });
    parcelServerProcess.on("exit", () => {
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
      distDir,
      "--watch-for-stdin",
      "--cache-dir",
      ".parcel-cache/client",
      entry,
      // "--port 9898",
    ],
    { env: Object.assign({ POXI_CONTEXT: "client" }, process.env) }
  );
  childProcess.stdout.pipe(process.stdout);
  childProcess.stderr.pipe(process.stderr);
  process.stdin.pipe(childProcess.stdin);
  return childProcess;
};

const spawnServerBuildDev = (entry: string) => {
  const childProcess = spawn(
    parcelExecPath,
    [
      "build",
      "--dist-dir",
      distDir,
      "--cache-dir",
      ".parcel-cache/server",
      "--no-minify",
      entry,
      // "--port 9898",
    ],
    { env: Object.assign({ POXI_CONTEXT: "server" }, process.env) }
  );
  childProcess.stdout.pipe(process.stdout);
  childProcess.stderr.pipe(process.stderr);
  process.stdin.pipe(childProcess.stdin);
  return childProcess;
};

const spawnServerRun = () => {
  const childProcess = spawn("node", [path.join(distDir, "server.js")], {
    env: process.env,
  });
  childProcess.stdout.pipe(process.stdout);
  childProcess.stderr.pipe(process.stderr);
  process.stdin.pipe(childProcess.stdin);
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
