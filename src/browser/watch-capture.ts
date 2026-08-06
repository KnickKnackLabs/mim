import {
  captureResultPath,
  type BrowserCaptureMetadata,
  type WatchCaptureRequest,
} from "../watch/protocol";

export type CaptureFetcher = (
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
) => Promise<Response>;

export function captureResultEndpoint(pageHref: string, id: string): URL {
  return new URL(captureResultPath(id), pageHref);
}

async function requireSuccessfulCaptureResponse(
  response: Response,
): Promise<void> {
  if (response.ok) return;
  const body: unknown = await response.json().catch(() => response.statusText);
  const message = body && typeof body === "object" && "error" in body
    ? String((body as { error: unknown }).error)
    : String(body);
  throw new Error(message);
}

export async function uploadWatchCapture(
  pageHref: string,
  request: WatchCaptureRequest,
  image: Blob,
  metadata: BrowserCaptureMetadata,
  fetcher: CaptureFetcher = fetch,
): Promise<void> {
  if (metadata.revision !== request.revision) {
    throw new Error("refusing to upload a stale canvas capture");
  }
  const form = new FormData();
  form.append("image", image, "capture.png");
  form.append("metadata", JSON.stringify(metadata));
  const response = await fetcher(captureResultEndpoint(pageHref, request.id), {
    body: form,
    method: "POST",
  });
  await requireSuccessfulCaptureResponse(response);
}

export async function uploadWatchCaptureFailure(
  pageHref: string,
  request: WatchCaptureRequest,
  error: unknown,
  fetcher: CaptureFetcher = fetch,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const response = await fetcher(captureResultEndpoint(pageHref, request.id), {
    body: JSON.stringify({
      error: (message || "capture failed").slice(0, 1_024),
      revision: request.revision,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  await requireSuccessfulCaptureResponse(response);
}
