export const WATCH_EVENT_NAME = "mim-source";
export const WATCH_EVENT_PATH = "/__mim/watch";

export interface WatchUpdate {
  revision: number;
  source: string;
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
