// parsers/fetchSwellForecast.ts
import {
  zonedTimeToUtc,
  formatInTimeZone,
} from 'npm:date-fns-tz@2.0.0';

export interface SwellRow {
  /* time */
  timestamp: string;  // "YYYY-MM-DDTHH:MM"  (Pacific, no offset)
  timestamp_pacific: string;  // ISO 8601 with −07:00 / −08:00
  timestamp_utc: string;  // ISO 8601 Z

  /* data */
  wave_height: number | null;  // ft
  wave_period: number | null;  // s
  wave_direction: number | null;  // °
}

export async function fetchSwellForecast({
  lat,
  lng,
  start,   // YYYY-MM-DD
  end,     // YYYY-MM-DD
}: {
  lat: number;
  lng: number;
  start: string;
  end: string;
}): Promise<SwellRow[]> {

  const url =
    `https://marine-api.open-meteo.com/v1/marine` +
    `?latitude=${lat}&longitude=${lng}` +
    `&hourly=swell_wave_height,swell_wave_period,swell_wave_direction` +
    `&start_date=${start}&end_date=${end}` +
    `&timezone=America/Los_Angeles` +
    `&cell_selection=sea`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`❌ Open-Meteo swell fetch failed ${res.status}: ${await res.text()}`);
      return [];
    }

    const { hourly } = await res.json() as {
      hourly: {
        time: string[];
        swell_wave_height: (number | null)[];
        swell_wave_period: (number | null)[];
        swell_wave_direction: (number | null)[];
      };
    };

    if (!hourly?.time?.length) return [];

    const mToFt = (m: number) => m * 3.28084;

    return hourly.time.map((local, i) => {
      /* Treat “local” as Pacific clock time (no offset) */
      const utcDate = zonedTimeToUtc(local, 'America/Los_Angeles');

      const timestamp_utc = utcDate.toISOString();
      const timestamp_pacific = formatInTimeZone(
        utcDate,
        'America/Los_Angeles',
        "yyyy-MM-dd'T'HH:mm:ssXXX"      // → "2025-06-23T09:00:00-07:00"
      );

      return {
        /* time */
        timestamp: local,
        timestamp_pacific,
        timestamp_utc,
        timestampPacific: timestamp_pacific,

        /* data */
        wave_height: hourly.swell_wave_height[i] != null
          ? mToFt(hourly.swell_wave_height[i] as number)
          : null,
        wave_period: hourly.swell_wave_period[i] ?? null,
        wave_direction: hourly.swell_wave_direction[i] ?? null,
      } as SwellRow;
    });
  } catch (err) {
    console.error('❌ Error fetching swell forecast', err);
    return [];
  }
}
