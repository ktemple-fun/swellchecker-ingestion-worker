export function normalizeTimestampToHour(ts: string): string {
  const d = new Date(ts);
  d.setUTCMinutes(0, 0, 0); // round down to top of hour
  return d.toISOString();
}
