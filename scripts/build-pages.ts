import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { checkArtifact } from "./check-artifact";

export async function copyPagesIndex(dist: string): Promise<string> {
  const source = resolve(dist, "mim.html");
  const output = resolve(dist, "index.html");
  await mkdir(dist, { recursive: true });
  await copyFile(source, output);
  return output;
}

async function main(): Promise<void> {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const build = Bun.spawn([process.execPath, "run", "build"], {
    cwd: repoRoot,
    stderr: "inherit",
    stdout: "inherit",
  });
  const status = await build.exited;
  if (status !== 0) process.exit(status);

  const dist = resolve(repoRoot, "dist");
  await checkArtifact(resolve(dist, "mim.html"));
  const output = await copyPagesIndex(dist);
  console.log(`Pages artifact: ${output}`);
}

if (import.meta.main) await main();
