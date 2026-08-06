export interface ExampleMetadata {
  description: string;
  title: string;
}

export function parseExampleMetadata(file: string, source: string): ExampleMetadata {
  const [titleLine, descriptionLine] = source.split("\n");
  const title = titleLine?.match(/^# (.+)$/)?.[1];
  const description = descriptionLine?.match(/^# (.+)$/)?.[1];
  if (!title || !description) {
    throw new Error(`${file} must begin with title and description comments`);
  }
  return { description, title };
}
