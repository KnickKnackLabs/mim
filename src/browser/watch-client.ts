import {
  CAPTURE_EVENT_NAME,
  decodeCaptureRequest,
  decodeWatchUpdate,
  WATCH_EVENT_NAME,
  WATCH_EVENT_PATH,
  type WatchCaptureRequest,
  type WatchUpdate,
} from "../watch/protocol";

export type WatchConnectionStatus = "connecting" | "connected" | "disconnected";

export interface WatchClientCallbacks {
  onCapture(request: WatchCaptureRequest): void;
  onStatus(status: WatchConnectionStatus): void;
  onUpdate(update: WatchUpdate): void;
}

export type WatchEventSourceFactory = (endpoint: URL) => EventSource;

export function watchEndpoint(href: string): URL | null {
  const page = new URL(href);
  if (page.searchParams.get("watch") !== "1") return null;
  return new URL(WATCH_EVENT_PATH, page);
}

export function connectWatchClient(
  endpoint: URL,
  callbacks: WatchClientCallbacks,
  createEventSource: WatchEventSourceFactory = (url) => new EventSource(url),
): () => void {
  let active = true;
  callbacks.onStatus("connecting");
  const events = createEventSource(endpoint);
  const handleUpdate = (event: Event): void => {
    if (!active) return;
    const update = decodeWatchUpdate((event as MessageEvent<string>).data);
    if (update) callbacks.onUpdate(update);
  };
  const handleCapture = (event: Event): void => {
    if (!active) return;
    const request = decodeCaptureRequest((event as MessageEvent<string>).data);
    if (request) callbacks.onCapture(request);
  };
  events.addEventListener(WATCH_EVENT_NAME, handleUpdate);
  events.addEventListener(CAPTURE_EVENT_NAME, handleCapture);
  events.onopen = () => {
    if (active) callbacks.onStatus("connected");
  };
  events.onerror = () => {
    if (active) callbacks.onStatus("disconnected");
  };
  return () => {
    active = false;
    events.removeEventListener(WATCH_EVENT_NAME, handleUpdate);
    events.removeEventListener(CAPTURE_EVENT_NAME, handleCapture);
    events.onopen = null;
    events.onerror = null;
    events.close();
  };
}
