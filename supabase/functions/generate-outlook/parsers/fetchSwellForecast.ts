// parsers/fetchSwellForecast.ts

import type { SwellRow } from '../lib/types.ts';

function formatPacificOffset(date: Date): string {
  // returns -07:00 or -08:00 depending on DST
  const offset = -date.getTimezoneOffset(); // in minutes
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
  const minutes = String(absOffset % 60).padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
}

function formatPacificISO(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  const second = `${date.getSeconds()}`.padStart(2, '0');
  const offset = formatPacificOffset(date);
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`;
}

export async function fetchSwellForecast({
  lat,
  lng,
  start,
  end,
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
      const pacific = new Date(`${local}:00`); // interpreted as local
      const utc = new Date(pacific.getTime() - pacific.getTimezoneOffset() * 60000);

      return {
        timestamp: utc.toISOString(),
        timestamp_utc: utc.toISOString(),
        timestamp_pacific: formatPacificISO(pacific),
        wave_height: hourly.swell_wave_height[i] != null
          ? mToFt(hourly.swell_wave_height[i]!)
          : null,
        wave_period: hourly.swell_wave_period[i] ?? null,
        wave_direction: hourly.swell_wave_direction[i] ?? null,
      };
    });

  } catch (err) {
    console.error('❌ Error fetching swell forecast', err);
    return [];
  }
}
