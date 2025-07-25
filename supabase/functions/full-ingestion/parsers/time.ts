

// Converts a UTC date to Pacific Time, preserving exact local time including DST
export function toPacificTime(date: Date): Date {
  const pacificOffset = getPacificOffset(date);
  return new Date(date.getTime() + pacificOffset * 60 * 1000);
}

// Returns Pacific Time offset in minutes from UTC (handles DST)
export function getPacificOffset(date: Date): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });

  const localParts = fmt.formatToParts(date);
  const reconstructed = localParts.reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {} as Record<string, string>);

  const utcParts = {
    hour: String(date.getUTCHours()).padStart(2, '0'),
    minute: String(date.getUTCMinutes()).padStart(2, '0')
  };

  const localMinutes = parseInt(reconstructed.hour) * 60 + parseInt(reconstructed.minute);
  const utcMinutes = parseInt(utcParts.hour) * 60 + parseInt(utcParts.minute);

  let offset = localMinutes - utcMinutes;

  // Adjust for day wrap-around (e.g., UTC is next day)
  if (offset > 720) offset -= 1440;
  if (offset < -720) offset += 1440;

  return offset;
}


export function normalizeTimestampToHour(timestamp: string): string {
  const d = new Date(timestamp);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}