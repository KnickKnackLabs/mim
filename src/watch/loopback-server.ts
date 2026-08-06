import {
  parseBrowserCaptureMetadata,
  type CaptureRuntimeMetadata,
} from "./capture-artifact";
import {
  CaptureSession,
  CaptureSessionError,
} from "./capture-session";
import {
  CAPTURE_CONTROL_PATH,
  CAPTURE_RESULT_PATH_PREFIX,
  encodeCaptureEvent,
  parseBrowserCaptureFailure,
  encodeWatchEvent,
  WATCH_EVENT_PATH,
  type BrowserCaptureMetadata,
  type WatchUpdate,
} from "./protocol";

const LOOPBACK_HOST = "127.0.0.1";
const MAX_CAPTURE_UPLOAD_BYTES = 17 * 1024 * 1024;

export interface LoopbackWatchServer {
  readonly url: URL;
  close(): Promise<void>;
  publish(update: WatchUpdate, accepted?: boolean): void;
}

export interface LoopbackWatchServerOptions {
  captureTimeoutMs?: number;
  html: string;
  idleTimeoutSeconds?: number;
  port?: number;
  runtime: CaptureRuntimeMetadata;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function errorResponse(error: unknown, defaultStatus = 500): Response {
  const status = error instanceof CaptureSessionError ? error.status : defaultStatus;
  return Response.json({ error: errorMessage(error) }, { status });
}

async function captureUpload(
  request: Request,
): Promise<{ browser: BrowserCaptureMetadata; image: Uint8Array }> {
  const contentLengthSource = request.headers.get("content-length");
  if (!contentLengthSource) {
    throw new CaptureSessionError("capture result requires a content length", 411);
  }
  const contentLength = Number(contentLengthSource);
  if (!Number.isSafeInteger(contentLength) || contentLength < 1) {
    throw new CaptureSessionError("capture content length is invalid", 400);
  }
  if (contentLength > MAX_CAPTURE_UPLOAD_BYTES) {
    throw new CaptureSessionError("capture upload is too large", 413);
  }
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    throw new CaptureSessionError("capture result must be multipart form data", 415);
  }
  const form = await request.formData();
  const image = form.get("image");
  const metadataSource = form.get("metadata");
  if (!(image instanceof Blob) || typeof metadataSource !== "string") {
    throw new CaptureSessionError("capture result is missing image or metadata", 400);
  }
  if (image.type !== "image/png") {
    throw new CaptureSessionError("capture image must be image/png", 415);
  }
  let metadataValue: unknown;
  try {
    metadataValue = JSON.parse(metadataSource);
  } catch {
    throw new CaptureSessionError("capture metadata is not valid JSON", 400);
  }
  const browser = parseBrowserCaptureMetadata(metadataValue);
  if (!browser) throw new CaptureSessionError("capture metadata is invalid", 400);
  return {
    browser,
    image: new Uint8Array(await image.arrayBuffer()),
  };
}

export function startLoopbackWatchServer(
  options: LoopbackWatchServerOptions,
): LoopbackWatchServer {
  const encoder = new TextEncoder();
  const clients = new Map<
    ReadableStreamDefaultController<Uint8Array>,
    () => void
  >();
  const captures = new CaptureSession({
    runtime: options.runtime,
    timeoutMs: options.captureTimeoutMs,
  });
  let latest: WatchUpdate | null = null;
  let latestAccepted = false;

  function disconnect(
    controller: ReadableStreamDefaultController<Uint8Array>,
  ): void {
    clients.get(controller)?.();
    clients.delete(controller);
  }

  function send(
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: string,
  ): void {
    try {
      controller.enqueue(encoder.encode(event));
    } catch {
      disconnect(controller);
    }
  }

  const server = Bun.serve({
    hostname: LOOPBACK_HOST,
    idleTimeout: options.idleTimeoutSeconds,
    port: options.port ?? 0,
    async fetch(request, server): Promise<Response> {
      const url = new URL(request.url);
      const origin = request.headers.get("origin");
      if (origin && origin !== url.origin) {
        return new Response("Forbidden", { status: 403 });
      }

      if (url.pathname === WATCH_EVENT_PATH && request.method === "GET") {
        server.timeout(request, 0);
        let active: ReadableStreamDefaultController<Uint8Array> | null = null;
        const body = new ReadableStream<Uint8Array>({
          cancel(): void {
            if (active) disconnect(active);
          },
          start(controller): void {
            active = controller;
            clients.set(controller, captures.connect({
              send: (capture) => send(controller, encodeCaptureEvent(capture)),
            }));
            if (latest) send(controller, encodeWatchEvent(latest));
          },
        });
        return new Response(body, {
          headers: {
            "Cache-Control": "no-cache, no-transform",
            "Content-Type": "text/event-stream",
            Connection: "keep-alive",
          },
        });
      }

      if (url.pathname === CAPTURE_CONTROL_PATH && request.method === "POST") {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return errorResponse(new CaptureSessionError("capture request is not valid JSON", 400));
        }
        const output = (body as { output?: unknown } | null)?.output;
        if (typeof output !== "string" || output.length < 1 || output.length > 4_096) {
          return errorResponse(new CaptureSessionError("capture output path is invalid", 400));
        }
        if (latest && !latestAccepted) {
          return errorResponse(
            new CaptureSessionError("watched source is invalid", 409),
          );
        }
        try {
          return Response.json(await captures.request(output, latest));
        } catch (error) {
          return errorResponse(error);
        }
      }

      if (
        url.pathname.startsWith(CAPTURE_RESULT_PATH_PREFIX)
        && request.method === "POST"
      ) {
        let id: string;
        try {
          id = decodeURIComponent(url.pathname.slice(CAPTURE_RESULT_PATH_PREFIX.length));
        } catch {
          return errorResponse(new CaptureSessionError("capture result ID is invalid", 400));
        }
        try {
          if (request.headers.get("content-type")?.startsWith("application/json")) {
            const failure = parseBrowserCaptureFailure(await request.json());
            if (!failure) {
              throw new CaptureSessionError("capture failure is invalid", 400);
            }
            captures.fail(id, failure.revision, failure.error);
          } else {
            const result = await captureUpload(request);
            await captures.complete(id, result.image, result.browser);
          }
          return new Response(null, { status: 204 });
        } catch (error) {
          return errorResponse(error, 400);
        }
      }

      if ((url.pathname === "/" || url.pathname === "/index.html") && request.method === "GET") {
        return new Response(options.html, {
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/html; charset=utf-8",
          },
        });
      }
      return new Response("Not found", { status: 404 });
    },
  });

  return {
    url: new URL(`http://${LOOPBACK_HOST}:${server.port}/?watch=1`),
    async close(): Promise<void> {
      captures.close();
      for (const client of clients.keys()) {
        try {
          client.close();
        } catch {
          // A disconnected client already owns its closed stream.
        }
        disconnect(client);
      }
      clients.clear();
      await server.stop(true);
    },
    publish(update, accepted = true): void {
      captures.sourceAdvanced(update.revision);
      latest = update;
      latestAccepted = accepted;
      for (const client of clients.keys()) send(client, encodeWatchEvent(update));
    },
  };
}
