export type ExampleCommand =
  | { type: "open-example-picker" }
  | { name: string; type: "load-example" }
  | { message: string; type: "invalid-example-command" };

export function exampleCommandDraft(source: string): boolean {
  return source.trimStart().startsWith(":example");
}

export function parseExampleCommand(source: string): ExampleCommand | null {
  const trimmed = source.trim();
  if (trimmed === ":example") return { type: "open-example-picker" };
  if (!trimmed.startsWith(":example")) return null;

  const match = trimmed.match(/^:example\s+([a-z0-9][a-z0-9-]*)$/);
  if (!match) {
    return {
      message: "expected :example <name>",
      type: "invalid-example-command",
    };
  }
  return { name: match[1], type: "load-example" };
}

export function exampleNameFromUrl(url: string): string | null {
  return new URL(url).searchParams.get("example");
}

export function urlForExample(url: string, name: string): string {
  const next = new URL(url);
  next.searchParams.delete("watch");
  next.searchParams.set("example", name);
  return next.toString();
}
