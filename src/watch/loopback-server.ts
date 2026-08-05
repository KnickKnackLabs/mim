import {
  encodeWatchEvent,
  WATCH_EVENT_PATH,
  type WatchUpdate,
} from "./protocol";

const LOOPBACK_HOST = "127.0.0.1";

export interface LoopbackWatchServer {
  readonly url: URL;
  close(): Promise<void>;
  publish(update: WatchUpdate): void;
}

export interface LoopbackWatchServerOptions {
  html: string;
  idleTimeoutSeconds?: number;
  port?: number;
}

export function startLoopbackWatchServer(
  options: LoopbackWatchServerOptions,
): LoopbackWatchServer {
  const encoder = new TextEncoder();
  const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();
  let latest: WatchUpdate | null = null;

  function send(
    controller: ReadableStreamDefaultController<Uint8Array>,
    update: WatchUpdate,
  ): void {
    try {
      controller.enqueue(encoder.encode(encodeWatchEvent(update)));
    } catch {
      clients.delete(controller);
    }
  }

  const server = Bun.serve({
    hostname: LOOPBACK_HOST,
    idleTimeout: options.idleTimeoutSeconds,
    port: options.port ?? 0,
    fetch(request, server): Response {
      const url = new URL(request.url);
      if (url.pathname === WATCH_EVENT_PATH) {
        server.timeout(request, 0);
        let active: ReadableStreamDefaultController<Uint8Array> | null = null;
        const body = new ReadableStream<Uint8Array>({
          cancel(): void {
            if (active) clients.delete(active);
          },
          start(controller): void {
            active = controller;
            clients.add(controller);
            if (latest) send(controller, latest);
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
      if (url.pathname === "/" || url.pathname === "/index.html") {
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
      for (const client of clients) {
        try {
          client.close();
        } catch {
          // A disconnected client already owns its closed stream.
        }
      }
      clients.clear();
      await server.stop(true);
    },
    publish(update): void {
      latest = update;
      for (const client of clients) send(client, update);
    },
  };
}
