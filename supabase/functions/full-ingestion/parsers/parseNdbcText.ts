// lib/parsers/parseNdbcText.ts
import { toPacificTime } from './time.ts';

/* ----------  Types  ---------- */

export interface NdbcEntry {
  /* ISO timestamps */
  timestamp        : string;         // "YYYY-MM-DDTHH:MM" – Pacific, no offset (legacy)
  timestamp_pacific : string;         // full ISO with -07:00 / -08:00 offset
  timestamp_utc     : string;         // full ISO with Z suffix

  /* Buoy data */
  wave_height    : number | null;    // feet
  wave_period    : number | null;    // seconds
  wave_direction : number | null;    // degrees
  water_temp_c   : number | null;    // °C
  water_temp_f   : number | null;    // °F
}

/* ----------  Main parser  ---------- */

export default function parseNdbcText(rawText: string): NdbcEntry[] {
  const metersToFeet = (m: number) => m * 3.28084;

  const lines     = rawText.split('\n');
  const dataLines = lines.slice(2);         // skip the two header rows

  const parsed = dataLines
    .map(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 15) return null;

      // YY  MM DD hh mm  ... WVHT DPD ... MWD ... WTMP
      const [YY, MM, DD, hh, mm,
             , , ,
             WVHT, DPD,
             , MWD,
             , ,
             WTMP] = parts;

      // Skip rows with missing essential fields
      if ([YY, MM, DD, hh, mm, WVHT, DPD, MWD].includes('MM')) return null;

      /* ---- Timestamp ---- NDBC gives times in GMT */
      const year = parseInt(YY.length === 2 ? `20${YY}` : YY, 10);
      const utcDate = new Date(Date.UTC(
        year,
        Number(MM) - 1,
        Number(DD),
        Number(hh),
        Number(mm)
      ));
      if (isNaN(utcDate.getTime())) return null;

      const pacificDate = toPacificTime(utcDate);

      return {
        /* Time fields */
        timestamp        : pacificDate.toISOString().slice(0, 16), // "YYYY-MM-DDTHH:MM"
        timestamp_pacific : pacificDate.toISOString(),              // with offset
        timestamp_utc     : utcDate.toISOString(),

        /* Data fields */
        wave_height    : WVHT !== 'MM' ? metersToFeet(parseFloat(WVHT)) : null,
        wave_period    : DPD  !== 'MM' ? parseFloat(DPD)               : null,
        wave_direction : MWD  !== 'MM' ? parseInt(MWD, 10)             : null,

        water_temp_c   : WTMP !== 'MM' ? parseFloat(WTMP)              : null,
        water_temp_f   : WTMP !== 'MM'
                           ? parseFloat(WTMP) * 9/5 + 32
                           : null,
      };
    })
    // Type predicate: keep only the fully-formed objects
    .filter((e): e is NdbcEntry => e !== null);

  return parsed;
}
