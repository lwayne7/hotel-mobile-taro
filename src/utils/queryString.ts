export type QueryValue = string | number | boolean | undefined | null;

export function toQueryString(params: Record<string, QueryValue>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const stringValue = String(value);
    if (!stringValue) continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(stringValue)}`);
  }
  return parts.join('&');
}

