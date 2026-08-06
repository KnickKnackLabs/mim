import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { observeProgramFile, type FileObserver } from "./file-observer";

const cleanups: Array<() => void | Promise<void>> = [];
afterEach(async () => {
  while (cleanups.length > 0) await cleanups.pop()?.();
});

async function waitFor(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 2_000;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error("timed out waiting for file observation");
    await Bun.sleep(10);
  }
}

describe("program file observation", () => {
  test("rereads after watcher installation to close the initial-read gap", async () => {
    const directory = await mkdtemp(join(tmpdir(), "mim-watch-"));
    const path = join(directory, "experiment.mim");
    await writeFile(path, "changed during setup");
    cleanups.push(() => rm(directory, { force: true, recursive: true }));

    const sources: string[] = [];
    const observer = observeProgramFile(path, {
      debounceMs: 10,
      initialSource: "stale initial read",
      onError: (error) => {
        throw error;
      },
      onSource: (source) => {
        sources.push(source);
      },
    });
    cleanups.push(() => observer.close());

    await waitFor(() => sources.length === 1);
    expect(sources).toEqual(["changed during setup"]);
  });

  test("coalesces rapid writes, follows atomic replacement, and closes", async () => {
    const directory = await mkdtemp(join(tmpdir(), "mim-watch-"));
    const path = join(directory, "experiment.mim");
    await writeFile(path, "initial");
    cleanups.push(() => rm(directory, { force: true, recursive: true }));

    const sources: string[] = [];
    const errors: unknown[] = [];
    const observer: FileObserver = observeProgramFile(path, {
      debounceMs: 20,
      initialSource: "initial",
      onError: (error) => {
        errors.push(error);
      },
      onSource: (source) => {
        sources.push(source);
      },
    });
    cleanups.push(() => observer.close());

    await writeFile(path, "one");
    await writeFile(path, "two");
    await writeFile(path, "three");
    await waitFor(() => sources.length === 1);
    expect(sources).toEqual(["three"]);

    const replacement = join(directory, ".experiment.mim.tmp");
    await writeFile(replacement, "atomic");
    await rename(replacement, path);
    await waitFor(() => sources.length === 2);
    expect(sources).toEqual(["three", "atomic"]);
    expect(errors).toEqual([]);

    observer.close();
    await writeFile(path, "after close");
    await Bun.sleep(60);
    expect(sources).toHaveLength(2);
  });
});
