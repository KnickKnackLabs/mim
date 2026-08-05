import { describe, expect, test } from "bun:test";

import { startLoopbackWatchServer } from "./loopback-server";
import { WATCH_EVENT_PATH } from "./protocol";

describe("loopback watch server", () => {
  test("serves only loopback content, streams revisions, and closes clients", async () => {
    const server = startLoopbackWatchServer({ html: "<main>mim</main>" });
    expect(server.url.hostname).toBe("127.0.0.1");

    const page = await fetch(server.url);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("<main>mim</main>");

    server.publish({ revision: 1, source: ":mim 1\n:field 1\n" });
    const response = await fetch(new URL(WATCH_EVENT_PATH, server.url));
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("watch response must have a body");
    const first = await reader.read();
    expect(new TextDecoder().decode(first.value)).toContain('"revision":1');

    await server.close();
    let clientClosed = false;
    try {
      clientClosed = (await reader.read()).done;
    } catch {
      clientClosed = true;
    }
    expect(clientClosed).toBe(true);
  });

  test("keeps quiet event streams alive", async () => {
    const server = startLoopbackWatchServer({
      html: "<main>mim</main>",
      idleTimeoutSeconds: 1,
    });

    try {
      server.publish({ revision: 1, source: ":mim 1\n:field 1\n" });
      const response = await fetch(new URL(WATCH_EVENT_PATH, server.url));
      const reader = response.body?.getReader();
      if (!reader) throw new Error("watch response must have a body");

      const first = await reader.read();
      expect(new TextDecoder().decode(first.value)).toContain('"revision":1');

      await Bun.sleep(1_100);
      server.publish({ revision: 2, source: ":mim 1\n:field 2\n" });
      const second = await reader.read();
      expect(new TextDecoder().decode(second.value)).toContain('"revision":2');
    } finally {
      await server.close();
    }
  });
});
