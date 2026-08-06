import { sourceLines } from "../language";

export function programDirectivePreview(source: string): string {
  return sourceLines(source)
    .map(({ text }) => text.trim().replace(/\s+/g, " "))
    .filter((line) => line.startsWith(":"))
    .join(" ");
}
