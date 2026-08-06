import { randomUUID } from "node:crypto";

import {
  type CaptureArtifactMetadata,
  type CaptureRuntimeMetadata,
  writeCaptureArtifact,
} from "./capture-artifact";
import type {
  BrowserCaptureMetadata,
  WatchCaptureRequest,
  WatchUpdate,
} from "./protocol";

export class CaptureSessionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface CaptureClient {
  send(request: WatchCaptureRequest): void;
}

export interface CaptureSessionOptions {
  runtime: CaptureRuntimeMetadata;
  timeoutMs?: number;
  writeArtifact?: typeof writeCaptureArtifact;
}

interface PendingCapture {
  client: CaptureClient;
  completing: boolean;
  id: string;
  output: string;
  reject(error: Error): void;
  resolve(metadata: CaptureArtifactMetadata): void;
  source: WatchUpdate;
  timer: ReturnType<typeof setTimeout>;
}

export class CaptureSession {
  readonly #clients = new Set<CaptureClient>();
  readonly #options: Required<Pick<CaptureSessionOptions, "timeoutMs" | "writeArtifact">>
    & Pick<CaptureSessionOptions, "runtime">;
  #pending: PendingCapture | null = null;

  constructor(options: CaptureSessionOptions) {
    this.#options = {
      runtime: options.runtime,
      timeoutMs: options.timeoutMs ?? 10_000,
      writeArtifact: options.writeArtifact ?? writeCaptureArtifact,
    };
  }

  connect(client: CaptureClient): () => void {
    this.#clients.add(client);
    return () => {
      this.#clients.delete(client);
      if (this.#pending?.client === client && !this.#pending.completing) {
        this.#rejectPending(new CaptureSessionError("capture browser disconnected", 409));
      }
    };
  }

  request(output: string, source: WatchUpdate | null): Promise<CaptureArtifactMetadata> {
    if (!source) {
      return Promise.reject(new CaptureSessionError("no watched revision is available", 409));
    }
    if (this.#clients.size !== 1) {
      return Promise.reject(new CaptureSessionError(
        `capture requires exactly one connected browser; found ${this.#clients.size}`,
        409,
      ));
    }
    if (this.#pending) {
      return Promise.reject(new CaptureSessionError("another capture is already pending", 409));
    }

    const client = [...this.#clients][0];
    const id = randomUUID();
    return new Promise<CaptureArtifactMetadata>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#rejectPending(new CaptureSessionError("capture timed out", 504));
      }, this.#options.timeoutMs);
      this.#pending = {
        client,
        completing: false,
        id,
        output,
        reject,
        resolve,
        source,
        timer,
      };
      try {
        client.send({ id, revision: source.revision });
      } catch (error) {
        this.#rejectPending(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  sourceAdvanced(revision: number): void {
    if (
      this.#pending
      && !this.#pending.completing
      && revision > this.#pending.source.revision
    ) {
      this.#rejectPending(new CaptureSessionError(
        "watched source changed before capture completed",
        409,
      ));
    }
  }

  async complete(
    id: string,
    image: Uint8Array,
    browser: BrowserCaptureMetadata,
  ): Promise<CaptureArtifactMetadata> {
    const pending = this.#pending;
    if (!pending || pending.id !== id) {
      throw new CaptureSessionError("unknown or expired capture request", 404);
    }
    if (pending.completing) {
      throw new CaptureSessionError("capture result was already received", 409);
    }
    if (browser.revision !== pending.source.revision) {
      const error = new CaptureSessionError("browser captured a stale revision", 409);
      this.#rejectPending(error);
      throw error;
    }

    pending.completing = true;
    this.#clearPendingTriggers(pending);
    try {
      const metadata = await this.#options.writeArtifact({
        browser,
        image,
        output: pending.output,
        runtime: this.#options.runtime,
        source: pending.source,
      });
      this.#settlePending(() => pending.resolve(metadata));
      return metadata;
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error(String(error));
      this.#rejectPending(normalized);
      throw normalized;
    }
  }

  fail(id: string, revision: number, message: string): void {
    const pending = this.#pending;
    if (!pending || pending.id !== id) {
      throw new CaptureSessionError("unknown or expired capture request", 404);
    }
    if (pending.completing) {
      throw new CaptureSessionError("capture result was already received", 409);
    }
    if (revision !== pending.source.revision) {
      throw new CaptureSessionError("browser failed a stale capture request", 409);
    }
    this.#rejectPending(new CaptureSessionError(`browser capture failed: ${message}`, 422));
  }

  cancel(id: string): void {
    if (this.#pending?.id === id && !this.#pending.completing) {
      this.#rejectPending(new CaptureSessionError("capture requester disconnected", 499));
    }
  }

  close(): void {
    this.#rejectPending(new CaptureSessionError("watch server closed", 503));
    this.#clients.clear();
  }

  #rejectPending(error: Error): void {
    const pending = this.#pending;
    if (!pending) return;
    this.#settlePending(() => pending.reject(error));
  }

  #settlePending(settle: () => void): void {
    const pending = this.#pending;
    if (!pending) return;
    this.#clearPendingTriggers(pending);
    this.#pending = null;
    settle();
  }

  #clearPendingTriggers(pending: PendingCapture): void {
    clearTimeout(pending.timer);
  }
}
