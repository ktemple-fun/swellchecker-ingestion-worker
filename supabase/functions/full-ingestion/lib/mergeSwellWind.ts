import { normalizeTimestampToHour } from './time.ts';
import { formatInTimeZone } from 'npm:date-fns-tz@2.0.0';

/* ---------- inbound row types ---------------------------------- */
export interface SwellRow {
  timestamp: string;  // "YYYY-MM-DDTHH:MM"
  timestamp_pacific?: string;
  timestampPacific?: string;
  timestamp_utc?: string;
  timestampUtc?: string;
  [k: string]: unknown;
}

export interface WindRow {
  timestamp: string;  // "YYYY-MM-DDTHH:MM"
  wind_speed_mps: number;
  wind_direction: number;
}

/* ---------- helpers -------------------------------------------- */
const offsetCache = new Map<number, string>();

function pacOffset(dateISO: string): string {
  const year = +dateISO.slice(0, 4);
  if (offsetCache.has(year)) return offsetCache.get(year)!;

  const dt = new Date(dateISO + ':00'); // treat as local
  const fmt = Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'short',
  }).format(dt);
  const off = fmt.endsWith('PDT') ? '-07:00' : '-08:00';
  offsetCache.set(year, off);
  return off;
}

function toPacificIso(localHH: string): string {
  const off = pacOffset(localHH);
  const [d, t] = localHH.split('T');
  const hh = t.slice(0, 2);
  return `${d}T${hh}:00:00${off}`;
}

/* ---------- main merge ----------------------------------------- */
export function mergeSwellWind(
  swell: SwellRow[],
  wind: WindRow[],
) {
  return swell.map((s) => {
    const localHour = normalizeTimestampToHour(s.timestamp);

    const pacRaw =
      s.timestamp_pacific ??
      s.timestampPacific ??
      toPacificIso(localHour);

    const utcIso = new Date(pacRaw).toISOString();

    const w = wind.find(
      (x) => normalizeTimestampToHour(x.timestamp) === localHour
    );
    

    return {
      ...s,
      timestamp: localHour,
      timestamp_pacific: pacRaw,
      timestamp_utc: utcIso,
      wind_speed_mps: w?.wind_speed_mps ?? null,
      wind_direction: w?.wind_direction ?? null,
    };
  });
}
