import {
  decodeWatchUpdate,
  WATCH_EVENT_NAME,
  WATCH_EVENT_PATH,
  type WatchUpdate,
} from "../watch/protocol";

export type WatchConnectionStatus = "connecting" | "connected" | "disconnected";

export interface WatchClientCallbacks {
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
  events.addEventListener(WATCH_EVENT_NAME, handleUpdate);
  events.onopen = () => {
    if (active) callbacks.onStatus("connected");
  };
  events.onerror = () => {
    if (active) callbacks.onStatus("disconnected");
  };
  return () => {
    active = false;
    events.removeEventListener(WATCH_EVENT_NAME, handleUpdate);
    events.onopen = null;
    events.onerror = null;
    events.close();
  };
}
