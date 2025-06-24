// /* ----------  Types  ---------- */

// interface SwellEntry {
//   hour: number;
//   day: string;               // "YYYY-MM-DD" (local)
//   height: number;
//   period?: number;
//   direction?: number;
//   timestamp: string;         // "YYYY-MM-DDTHH:MM" (local)
//   localTimeISO?: string;     // same value; kept for legacy compatibility
// }

// interface WindEntry {
//   hour: number;
//   day: string;
//   speed: number;
//   direction: number;
//   timestamp: string;
//   localTimeISO?: string;
// }

// interface OutlookBlock {
//   swellHeight: number;
//   wavePeriod?: number;
//   waveDirection?: number;
//   windSpeed: number;
//   windDirection: number;
//   dayPart: 'AM' | 'PM';
//   date: string;
//   segment: string;
//   timestamp_utc: string;      // Pacific-local ISO string
//   timestamp_pacific: string;  // same string (legacy field)
// }

// /* ----------  Main helper  ---------- */

// export function groupForecastByDayPart({
//   swellByHour,
//   windByHour,
// }: {
//   swellByHour: SwellEntry[];
//   windByHour: WindEntry[];
// }): OutlookBlock[] {
//   const grouped: Record<string, Partial<OutlookBlock>> = {};
//   const swellGroups: Record<string, SwellEntry[]> = {};

//   const getDayPart = (hour: number): 'AM' | 'PM' => (hour < 12 ? 'AM' : 'PM');

//   /* ── 1. Bucket swell data ──────────────────────────────── */
//   for (const swell of swellByHour) {
//     const key = `${swell.day}_${getDayPart(swell.hour)}`;

//     swellGroups[key] ||= [];
//     swellGroups[key].push(swell);

//     if (!grouped[key]) {
//       const timeStr = swell.localTimeISO ?? swell.timestamp; // already local
//       grouped[key] = {
//         date: swell.day,
//         dayPart: getDayPart(swell.hour),
//         segment: `${swell.day} ${getDayPart(swell.hour)}`,
//         timestamp_utc: timeStr,
//         timestamp_pacific: timeStr,
//       };
//     }
//     /*  ⬆️  No more “last sample wins” swellHeight assignment  */
//   }

//   /* ── 2. Average height, period & direction per bucket ──── */
//   for (const key in swellGroups) {
//     const entries = swellGroups[key];

//     /* height */
//     const heights = entries.map(e => e.height);
//     grouped[key]!.swellHeight =
//       parseFloat((heights.reduce((a, b) => a + b, 0) / heights.length).toFixed(2));

//     /* period */
//     const periods = entries.map(e => e.period).filter((n): n is number => n != null);
//     if (periods.length) {
//       grouped[key]!.wavePeriod =
//         parseFloat((periods.reduce((a, b) => a + b, 0) / periods.length).toFixed(2));
//     }

//     /* direction */
//     const dirs = entries.map(e => e.direction).filter((n): n is number => n != null);
//     if (dirs.length) {
//       grouped[key]!.waveDirection =
//         Math.round(dirs.reduce((a, b) => a + b, 0) / dirs.length);
//     }
//   }

//   /* ── 3. Merge wind data ───────────────────────────────── */
//   for (const wind of windByHour) {
//     const key = `${wind.day}_${getDayPart(wind.hour)}`;

//     if (!grouped[key]) {
//       const timeStr = wind.localTimeISO ?? wind.timestamp;
//       grouped[key] = {
//         date: wind.day,
//         dayPart: getDayPart(wind.hour),
//         segment: `${wind.day} ${getDayPart(wind.hour)}`,
//         timestamp_utc: timeStr,
//         timestamp_pacific: timeStr,
//       };
//     }
//     grouped[key]!.windSpeed     = wind.speed;
//     grouped[key]!.windDirection = wind.direction;
//   }

//   /* ── 4. Final type-safe cast ──────────────────────────── */
//   return Object.values(grouped).filter(
//     (blk): blk is OutlookBlock =>
//       blk.segment           !== undefined &&
//       blk.swellHeight       !== undefined &&
//       blk.windSpeed         !== undefined &&
//       blk.windDirection     !== undefined &&
//       blk.dayPart           !== undefined &&
//       blk.date              !== undefined &&
//       blk.timestamp_utc     !== undefined &&
//       blk.timestamp_pacific !== undefined
//   );
// }


// lib/groupForecastByDayPart.ts
export type DayPart = 'AM' | 'PM';

export interface SwellEntry {
  hour: number;
  day: string;
  height: number;
  period?: number;
  direction?: number;
  timestamp           : string;
  timestamp_pacific?  : string;
  timestamp_utc?      : string;
}

export interface WindEntry {
  hour: number;
  day: string;
  speed: number;
  direction: number;
  timestamp           : string;
  timestamp_pacific?  : string;
  timestamp_utc?      : string;
}

export interface OutlookBlock {
  swellHeight   : number;
  wavePeriod?   : number;
  waveDirection?: number;
  windSpeed     : number;
  windDirection : number;
  dayPart       : DayPart;
  date          : string;
  segment       : string;
  timestamp_pacific: string;
  timestamp_utc    : string;
}

export function groupForecastByDayPart({
  swellByHour,
  windByHour,
}: {
  swellByHour: SwellEntry[];
  windByHour: WindEntry[];
}): OutlookBlock[] {
  const grouped: Record<string, Partial<OutlookBlock>> = {};
  const swellBuckets: Record<string, SwellEntry[]> = {};

  const part = (h: number): DayPart => (h < 12 ? 'AM' : 'PM');

  /* 1️⃣ bucket swell */
  for (const s of swellByHour) {
    const key = `${s.day}_${part(s.hour)}`;
    swellBuckets[key] ||= [];
    swellBuckets[key].push(s);

    if (!grouped[key]) {
      grouped[key] = {
        date: s.day,
        dayPart: part(s.hour),
        segment: `${s.day} ${part(s.hour)}`,
        timestamp_pacific: s.timestamp_pacific ?? s.timestamp,
        timestamp_utc    : s.timestamp_utc     ?? s.timestamp,
      };
    }
  }

  /* 2️⃣ averages */
  for (const key in swellBuckets) {
    const bucket = swellBuckets[key];
    const avg = <T extends number>(arr: (T|undefined)[]) =>
      +(
        arr.reduce((sum, x) => sum + (x ?? 0), 0) /
        arr.filter(x => x != null).length
      ).toFixed(2);

    grouped[key]!.swellHeight = avg(bucket.map(b => b.height));
    const periods = bucket.map(b => b.period).filter((n): n is number => n != null);
    if (periods.length) grouped[key]!.wavePeriod = avg(periods);
    const dirs = bucket.map(b => b.direction).filter((n): n is number => n != null);
    if (dirs.length) grouped[key]!.waveDirection = Math.round(avg(dirs));
  }

  /* 3️⃣ merge wind */
  for (const w of windByHour) {
    const key = `${w.day}_${part(w.hour)}`;
    grouped[key] ||= {
      date: w.day,
      dayPart: part(w.hour),
      segment: `${w.day} ${part(w.hour)}`,
      timestamp_pacific: w.timestamp_pacific ?? w.timestamp,
      timestamp_utc    : w.timestamp_utc     ?? w.timestamp,
    };
    grouped[key]!.windSpeed     = w.speed;
    grouped[key]!.windDirection = w.direction;
  }

  /* 4️⃣ type-safe return */
  return Object.values(grouped).filter(
    (b): b is OutlookBlock =>
      b.swellHeight   !== undefined &&
      b.windSpeed     !== undefined &&
      b.windDirection !== undefined &&
      b.date          !== undefined &&
      b.dayPart       !== undefined &&
      b.segment       !== undefined &&
      b.timestamp_pacific !== undefined &&
      b.timestamp_utc     !== undefined
  );
}
