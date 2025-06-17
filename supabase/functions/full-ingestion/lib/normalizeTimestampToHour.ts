export function normalizeTimestampToHour(isoString: string): string {
  const date = new Date(isoString);
  date.setMinutes(0, 0, 0); // round down to the start of the hour
  return date.toISOString();
}
