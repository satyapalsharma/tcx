/** Compatibility for maps saved by the earlier demo renderer, which allowed `end` as a node ID. */
export function normalizeLegacyDemoProcessMap(content: string): string {
  if (!content.includes('end[Resolve and close the case]')) return content;
  return content
    .replace(
      /\bend(?=\[Resolve and close the case\]|\s*(?:-->|---|-\.->|==>))/g,
      'finish',
    )
    .replace(/((?:-->|---|-\.->|==>)\s*)end\b/g, '$1finish');
}
