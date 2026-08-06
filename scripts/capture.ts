import { extname, resolve } from "node:path";

import type { CaptureArtifactMetadata } from "../src/watch/capture-artifact";
import { CAPTURE_CONTROL_PATH } from "../src/watch/protocol";

export interface CaptureArguments {
  output: string;
  session: URL;
}

type CaptureFetcher = (
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
) => Promise<Response>;

function usage(): string {
  return "Usage: mim capture <watch-url> <output.png>";
}

export function parseCaptureArguments(args: readonly string[]): CaptureArguments {
  const positional = [...args];
  if (positional[0] === "capture") positional.shift();
  if (positional.length !== 2 || positional.some((argument) => argument.startsWith("--"))) {
    throw new Error(usage());
  }

  let session: URL;
  try {
    session = new URL(positional[0]);
  } catch {
    throw new Error(`${usage()}\nwatch URL is invalid`);
  }
  if (
    session.protocol !== "http:"
    || session.hostname !== "127.0.0.1"
    || session.username
    || session.password
  ) {
    throw new Error(`${usage()}\nwatch URL must use loopback HTTP`);
  }

  const output = resolve(positional[1]);
  if (extname(output).toLowerCase() !== ".png") {
    throw new Error(`${usage()}\noutput must end in .png`);
  }
  return { output, session };
}

function errorMessage(value: unknown): string {
  if (value && typeof value === "object" && "error" in value) {
    return String((value as { error: unknown }).error);
  }
  return String(value);
}

export async function requestLiveCapture(
  args: CaptureArguments,
  fetcher: CaptureFetcher = fetch,
): Promise<CaptureArtifactMetadata> {
  const endpoint = new URL(CAPTURE_CONTROL_PATH, args.session);
  const response = await fetcher(endpoint, {
    body: JSON.stringify({ output: args.output }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(15_000),
  });
  const body: unknown = await response.json().catch(() => response.statusText);
  if (!response.ok) throw new Error(errorMessage(body));
  if (
    !body
    || typeof body !== "object"
    || (body as { output?: unknown }).output !== args.output
    || (body as { schemaVersion?: unknown }).schemaVersion !== 1
  ) {
    throw new Error("watch server returned invalid capture metadata");
  }
  return body as CaptureArtifactMetadata;
}

if (import.meta.main) {
  try {
    const metadata = await requestLiveCapture(
      parseCaptureArguments(process.argv.slice(2)),
    );
    console.log(metadata.output);
    console.log(`${metadata.output}.json`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}
