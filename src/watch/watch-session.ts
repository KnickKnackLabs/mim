import type { BrowserProgramDiagnostic } from "../browser/browser-program";
import { loadBrowserProgram } from "../browser/load-browser-program";
import type { WatchUpdate } from "./protocol";

export interface WatchSessionResult {
  diagnostics: readonly BrowserProgramDiagnostic[];
  update: WatchUpdate;
  valid: boolean;
}

export interface WatchSessionOptions {
  file: string;
  publish(update: WatchUpdate): void;
  reportDiagnostic(line: string): void;
  reportUpdate(line: string): void;
}

export function formatWatchDiagnostic(
  file: string,
  diagnostic: BrowserProgramDiagnostic,
): string {
  const { line, column } = diagnostic.span.start;
  return `${file}:${line}:${column}: ${diagnostic.message}`;
}

export class WatchSession {
  readonly #options: WatchSessionOptions;
  #revision = 0;

  constructor(options: WatchSessionOptions) {
    this.#options = options;
  }

  accept(source: string): WatchSessionResult {
    const loaded = loadBrowserProgram(source);
    const update = { revision: ++this.#revision, source };
    if (loaded.ok) {
      this.#options.reportUpdate(`${this.#options.file}: updated (revision ${update.revision})`);
    } else {
      for (const diagnostic of loaded.diagnostics) {
        this.#options.reportDiagnostic(formatWatchDiagnostic(this.#options.file, diagnostic));
      }
    }
    this.#options.publish(update);
    return {
      diagnostics: loaded.diagnostics,
      update,
      valid: loaded.ok,
    };
  }
}
