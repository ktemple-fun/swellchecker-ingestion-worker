export type DayPart = 'AM' | 'PM';

export interface SwellEntry {
  hour: number;
  day: string;
  height: number;
  period?: number;
  direction?: number;
  timestamp_pacific: string;
  timestamp_utc: string;
}

export interface WindEntry {
  hour: number;
  day: string;
  speed: number;
  direction: number;
  timestamp_pacific: string;
  timestamp_utc: string;
}

export interface TideEntry {
  hour: number;
  day: string;
  height: number;
  timestamp_pacific: string;
  timestamp_utc: string;
}

export interface OutlookBlock {
  swellHeight: number;
  wavePeriod?: number;
  waveDirection?: number;
  windSpeed: number;
  windDirection: number;
  avg_tide_ft?: number;
  dayPart: DayPart;
  date: string;
  segment: string;
  timestamp_pacific: string;
  timestamp_utc: string;
}

export function groupForecastByDayPart({
  swellByHour,
  windByHour,
  tideByHour,
}: {
  swellByHour: SwellEntry[];
  windByHour: WindEntry[];
  tideByHour: TideEntry[];
}): OutlookBlock[] {
  const grouped: Record<string, Partial<OutlookBlock>> = {};
  const swellBuckets: Record<string, SwellEntry[]> = {};
  const tideBuckets: Record<string, number[]> = {};

  const part = (h: number): DayPart => (h < 12 ? 'AM' : 'PM');

  /* 1️⃣ Group swell rows */
  for (const s of swellByHour) {
    const key = `${s.day}_${part(s.hour)}`;
    swellBuckets[key] ||= [];
    swellBuckets[key].push(s);

    if (!grouped[key]) {
      grouped[key] = {
        date: s.day,
        dayPart: part(s.hour),
        segment: `${s.day} ${part(s.hour)}`,
        timestamp_pacific: s.timestamp_pacific,
        timestamp_utc: s.timestamp_utc,
      };
    }
  }

  /* 2️⃣ Average swell metrics */
  for (const key in swellBuckets) {
    const bucket = swellBuckets[key];
    const avg = <T extends number>(arr: (T | undefined)[]) =>
      +(
        arr.reduce((sum, x) => sum + (x ?? 0), 0) /
        arr.filter(x => x != null).length
      ).toFixed(2);

    grouped[key]!.swellHeight = avg(bucket.map(b => b.height));

    const periods = bucket.map(b => b.period).filter((n): n is number => n != null);
    if (periods.length) grouped[key]!.wavePeriod = avg(periods);

    const dirs = bucket.map(b => b.direction).filter((n): n is number => n != null);
    if (dirs.length) {

      const sinSum = dirs.reduce((sum, d) => sum + Math.sin((d * Math.PI) / 180), 0);
      const cosSum = dirs.reduce((sum, d) => sum + Math.cos((d * Math.PI) / 180), 0);
      const angle = Math.atan2(sinSum, cosSum) * (180 / Math.PI);
      grouped[key]!.waveDirection = Math.round((angle + 360) % 360);
    }
    if (!dirs.length) {
      console.warn('[groupForecastByDayPart] no wave directions in bucket:', key, bucket);
    }
  }

  /* 3️⃣ Merge wind rows */
  for (const w of windByHour) {
    const key = `${w.day}_${part(w.hour)}`;

    grouped[key] ||= {
      date: w.day,
      dayPart: part(w.hour),
      segment: `${w.day} ${part(w.hour)}`,
      timestamp_pacific: w.timestamp_pacific,
      timestamp_utc: w.timestamp_utc,
    };

    grouped[key]!.windSpeed = w.speed;
    grouped[key]!.windDirection = w.direction;
  }

  /* 4️⃣ Bucket tide heights */
  for (const t of tideByHour) {
    const key = `${t.day}_${part(t.hour)}`;
    tideBuckets[key] ||= [];
    tideBuckets[key].push(t.height);
  }

  /* 5️⃣ Compute avg tide height per block */
  for (const key in tideBuckets) {
    const heights = tideBuckets[key];
    const avgTide = +(heights.reduce((a, b) => a + b, 0) / heights.length).toFixed(2);
    if (!grouped[key]) continue; // optional tide-only block — skip
    grouped[key]!.avg_tide_ft = avgTide;
  }

  /* 6️⃣ Final type-safe cast */
 const dates = Array.from(new Set(swellByHour.map(s => s.day))).sort()


  const parts: DayPart[] = ['AM', 'PM']
  const finalBlocks: OutlookBlock[] = []

  for (const date of dates) {
    for (const part of parts) {
      const key = `${date}_${part}`
      const exact = grouped[key]

      if (exact && exact.swellHeight !== undefined) {
        finalBlocks.push(exact as OutlookBlock)
      } else {
        // Fallback from other days
        const fallbackKey = Object.keys(grouped)
          .filter(k => k.endsWith(`_${part}`) && grouped[k]!.swellHeight !== undefined)
          .sort()
          .reverse()[0]

        if (fallbackKey) {
          const fallback = { ...grouped[fallbackKey]! } as OutlookBlock
          fallback.date = date
          fallback.segment = `${date} ${part}`
          fallback.timestamp_pacific = new Date().toISOString()
          fallback.timestamp_utc = new Date().toISOString()
          console.warn(`[groupForecastByDayPart] fallback used for ${key}`, fallback)
          finalBlocks.push(fallback)
        } else {
          console.warn(`[groupForecastByDayPart] NO fallback available for ${key}`)
        }
      }
    }
  }


  return finalBlocks

}
