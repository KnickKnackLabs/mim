import { watch, type FSWatcher } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname } from "node:path";

export interface FileObserverOptions {
  debounceMs?: number;
  initialSource: string;
  onError(error: unknown): void;
  onSource(source: string): void | Promise<void>;
}

export interface FileObserver {
  close(): void;
}

export function observeProgramFile(
  path: string,
  options: FileObserverOptions,
): FileObserver {
  const debounceMs = options.debounceMs ?? 40;
  let closed = false;
  let lastSource = options.initialSource;
  let pending = false;
  let reading = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function schedule(): void {
    if (closed) return;
    pending = true;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, debounceMs);
  }

  async function flush(): Promise<void> {
    if (closed || reading || !pending) return;
    pending = false;
    reading = true;
    try {
      const source = await readFile(path, "utf8");
      if (!closed && source !== lastSource) {
        lastSource = source;
        await options.onSource(source);
      }
    } catch (error) {
      if (!closed) options.onError(error);
    } finally {
      reading = false;
      if (pending) schedule();
    }
  }

  const watcher: FSWatcher = watch(dirname(path), () => schedule());
  watcher.on("error", options.onError);

  return {
    close(): void {
      if (closed) return;
      closed = true;
      if (timer !== null) clearTimeout(timer);
      watcher.close();
    },
  };
}
