import { normalizeTimestampToHour } from './time.ts';

import type { SwellRow } from './types.ts';

/* ---------- Inbound row types ---------- */

export interface WindRow {
  timestamp: string; // "YYYY-MM-DDTHH:MM"
  wind_speed_mps: number;
  wind_direction: number;
}

/* ---------- Output row type (extends SwellRow) ---------- */

export interface MergedRow extends SwellRow {
  timestamp: string;           // "YYYY-MM-DDTHH:00"
  timestamp_pacific: string;   // full ISO with -07:00 / -08:00 offset
  timestamp_utc: string;       // full UTC ISO
  wind_speed_mps: number | null;
  wind_direction: number | null;
}

/* ---------- helpers ---------- */

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

/* ---------- main merge ---------- */

export function mergeSwellWind(
  swell: SwellRow[],
  wind: WindRow[]
): MergedRow[] {
  return swell.map((s) => {
    const localHour = normalizeTimestampToHour(s.timestamp);

    const pacRaw =
      s.timestamp_pacific ??
      // deno-lint-ignore no-explicit-any
      (s as any).timestampPacific ?? // legacy fallback
      toPacificIso(localHour);

    const utcIso = new Date(pacRaw).toISOString();

    const matchedWind = wind.find(
      (w) => normalizeTimestampToHour(w.timestamp) === localHour
    );

    return {
      ...s,
      timestamp: localHour,
      timestamp_pacific: pacRaw,
      timestamp_utc: utcIso,
      wind_speed_mps: matchedWind?.wind_speed_mps ?? null,
      wind_direction: matchedWind?.wind_direction ?? null,
    };
  });
}
