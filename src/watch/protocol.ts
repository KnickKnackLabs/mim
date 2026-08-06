export const WATCH_EVENT_NAME = "mim-source";
export const WATCH_EVENT_PATH = "/__mim/watch";
export const CAPTURE_CONTROL_PATH = "/__mim/capture";
export const CAPTURE_EVENT_NAME = "mim-capture";
export const CAPTURE_RESULT_PATH_PREFIX = "/__mim/capture/";

export interface WatchUpdate {
  revision: number;
  source: string;
}

export interface WatchCaptureRequest {
  id: string;
  revision: number;
}

export interface BrowserCaptureFailure {
  error: string;
  revision: number;
}

export interface BrowserCaptureMetadata {
  cssHeight: number;
  cssWidth: number;
  devicePixelRatio: number;
  locale: string;
  parameters: Readonly<Record<string, number>>;
  pixelHeight: number;
  pixelWidth: number;
  revision: number;
  timelineElapsedSeconds: number;
  userAgent: string;
  viewX: number;
  viewY: number;
  zoomDenominator: number;
}

export function decodeWatchUpdate(data: string): WatchUpdate | null {
  let value: unknown;
  try {
    value = JSON.parse(data);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (
    !Number.isSafeInteger(candidate.revision)
    || (candidate.revision as number) < 1
    || typeof candidate.source !== "string"
  ) {
    return null;
  }
  return {
    revision: candidate.revision as number,
    source: candidate.source,
  };
}

export function encodeWatchEvent(update: WatchUpdate): string {
  return `event: ${WATCH_EVENT_NAME}\ndata: ${JSON.stringify(update)}\n\n`;
}

export function decodeCaptureRequest(data: string): WatchCaptureRequest | null {
  let value: unknown;
  try {
    value = JSON.parse(data);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== "string"
    || candidate.id.length < 1
    || candidate.id.length > 128
    || !Number.isSafeInteger(candidate.revision)
    || (candidate.revision as number) < 1
  ) {
    return null;
  }
  return {
    id: candidate.id,
    revision: candidate.revision as number,
  };
}

export function encodeCaptureEvent(request: WatchCaptureRequest): string {
  return `event: ${CAPTURE_EVENT_NAME}\ndata: ${JSON.stringify(request)}\n\n`;
}

export function parseBrowserCaptureFailure(
  value: unknown,
): BrowserCaptureFailure | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.error !== "string"
    || candidate.error.length < 1
    || candidate.error.length > 1_024
    || !Number.isSafeInteger(candidate.revision)
    || (candidate.revision as number) < 1
  ) {
    return null;
  }
  return {
    error: candidate.error,
    revision: candidate.revision as number,
  };
}

export function captureResultPath(id: string): string {
  return `${CAPTURE_RESULT_PATH_PREFIX}${encodeURIComponent(id)}`;
}
