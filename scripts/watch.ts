import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { loadBrowserProgram } from "../src/browser/load-browser-program";
import { observeProgramFile, type FileObserver } from "../src/watch/file-observer";
import {
  startLoopbackWatchServer,
  type LoopbackWatchServer,
} from "../src/watch/loopback-server";
import {
  formatWatchDiagnostic,
  WatchSession,
} from "../src/watch/watch-session";

interface WatchArguments {
  file: string;
  open: boolean;
}

const repoRoot = resolve(import.meta.dir, "..");

function usage(): string {
  return "Usage: mim watch <file.mim> [--open]";
}

export function parseWatchArguments(args: readonly string[]): WatchArguments {
  const open = args.includes("--open");
  const positional = args.filter((argument) => argument !== "--open");
  if (positional[0] === "watch") positional.shift();
  if (positional.length !== 1 || args.some((argument) => argument.startsWith("--") && argument !== "--open")) {
    throw new Error(usage());
  }
  return { file: resolve(positional[0]), open };
}

async function buildStandalone(): Promise<void> {
  const child = Bun.spawn([process.execPath, "run", "build"], {
    cwd: repoRoot,
    stderr: "inherit",
    stdout: "inherit",
  });
  const status = await child.exited;
  if (status !== 0) throw new Error(`standalone build failed with status ${status}`);
}

async function openBrowser(url: URL): Promise<void> {
  const command = process.platform === "darwin" ? "open" : "xdg-open";
  const child = Bun.spawn([command, url.href], {
    stderr: "inherit",
    stdout: "ignore",
  });
  const status = await child.exited;
  if (status !== 0) throw new Error(`${command} failed with status ${status}`);
}

interface ShutdownWaiter {
  readonly requested: boolean;
  readonly settled: Promise<void>;
  close(): void;
}

function createShutdownWaiter(): ShutdownWaiter {
  let requested = false;
  let resolveShutdown: () => void;
  const settled = new Promise<void>((resolve) => {
    resolveShutdown = resolve;
  });
  const stop = (): void => {
    requested = true;
    resolveShutdown();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  return {
    get requested(): boolean {
      return requested;
    },
    settled,
    close(): void {
      process.off("SIGINT", stop);
      process.off("SIGTERM", stop);
    },
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function runWatch(args: WatchArguments): Promise<number> {
  if (extname(args.file) !== ".mim") {
    console.error(`${args.file}: expected a .mim program`);
    return 2;
  }

  let initialSource: string;
  try {
    initialSource = await readFile(args.file, "utf8");
  } catch (error) {
    console.error(`${args.file}: ${errorMessage(error)}`);
    return 2;
  }

  const initial = loadBrowserProgram(initialSource);
  if (!initial.ok) {
    for (const diagnostic of initial.diagnostics) {
      console.error(formatWatchDiagnostic(args.file, diagnostic));
    }
    return 2;
  }

  let observer: FileObserver | null = null;
  let server: LoopbackWatchServer | null = null;
  const shutdown = createShutdownWaiter();
  try {
    await buildStandalone();
    if (shutdown.requested) return 0;
    const html = await readFile(resolve(repoRoot, "dist/mim.html"), "utf8");
    server = startLoopbackWatchServer({ html });
    const session = new WatchSession({
      file: args.file,
      publish: (update) => server?.publish(update),
      reportDiagnostic: console.error,
      reportUpdate: console.log,
    });
    session.accept(initialSource);
    observer = observeProgramFile(args.file, {
      initialSource,
      onError: (error) => console.error(`${args.file}: ${errorMessage(error)}`),
      onSource: (source) => {
        session.accept(source);
      },
    });

    console.log(`Watching ${args.file}`);
    console.log(server.url.href);
    if (args.open) await openBrowser(server.url);
    await shutdown.settled;
    return 0;
  } finally {
    shutdown.close();
    observer?.close();
    if (server) await server.close();
  }
}

if (import.meta.main) {
  try {
    const status = await runWatch(parseWatchArguments(process.argv.slice(2)));
    process.exitCode = status;
  } catch (error) {
    console.error(errorMessage(error));
    process.exitCode = 2;
  }
}
