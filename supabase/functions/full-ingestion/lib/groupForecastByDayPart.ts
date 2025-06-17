// // groupForecastByDayPart.ts (audit and ensure grouping uses Pacific time hours)

// interface SwellEntry {
//   hour: number;
//   day: string;
//   height: number;
//   timestamp: string;
//   localTimeISO?: string;
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
//   windSpeed: number;
//   windDirection: number;
//   dayPart: 'AM' | 'PM';
//   date: string;
// }

// export function groupForecastByDayPart({
//   swellByHour,
//   windByHour
// }: {
//   swellByHour: SwellEntry[];
//   windByHour: WindEntry[];
// }): OutlookBlock[] {
//   const grouped: Record<string, Partial<OutlookBlock>> = {};

//   const getDayPart = (hour: number): 'AM' | 'PM' => (hour < 12 ? 'AM' : 'PM');

//   for (const swell of swellByHour) {
//     const key = `${swell.day}_${getDayPart(swell.hour)}`;
//     if (!grouped[key]) grouped[key] = {};
//     grouped[key].swellHeight = swell.height;
//     grouped[key].dayPart = getDayPart(swell.hour);
//     grouped[key].date = swell.day;
//   }

//   for (const wind of windByHour) {
//     const key = `${wind.day}_${getDayPart(wind.hour)}`;
//     if (!grouped[key]) grouped[key] = {};
//     grouped[key].windSpeed = wind.speed;
//     grouped[key].windDirection = wind.direction;
//     grouped[key].dayPart = getDayPart(wind.hour);
//     grouped[key].date = wind.day;
//   }

//   return Object.values(grouped).filter(
//     (block): block is OutlookBlock =>
//       block.swellHeight !== undefined &&
//       block.windSpeed !== undefined &&
//       block.windDirection !== undefined &&
//       block.dayPart !== undefined &&
//       block.date !== undefined
//   );
// }


import { toPacificTime } from './time.ts';

interface SwellEntry {
  hour: number;
  day: string;
  height: number;
  timestamp: string;
  localTimeISO?: string;
}

interface WindEntry {
  hour: number;
  day: string;
  speed: number;
  direction: number;
  timestamp: string;
  localTimeISO?: string;
}

interface OutlookBlock {
  swellHeight: number;
  windSpeed: number;
  windDirection: number;
  dayPart: 'AM' | 'PM';
  date: string;
  segment: string;
  timestamp_utc?: string;
  timestamp_pacific?: string;
}

export function groupForecastByDayPart({
  swellByHour,
  windByHour,
}: {
  swellByHour: SwellEntry[];
  windByHour: WindEntry[];
}): OutlookBlock[] {
  const grouped: Record<string, Partial<OutlookBlock>> = {};
  const getDayPart = (hour: number): 'AM' | 'PM' => (hour < 12 ? 'AM' : 'PM');

  for (const swell of swellByHour) {
    const key = `${swell.day}_${getDayPart(swell.hour)}`;
   if (!grouped[key]) {
  grouped[key] = {
    date: swell.day,
    dayPart: getDayPart(swell.hour),
    segment: `${swell.day} ${getDayPart(swell.hour)}`,
    timestamp_utc: swell.timestamp,
    timestamp_pacific: swell.localTimeISO ?? toPacificTime(new Date(swell.timestamp)).toISOString(),
  };
}

    grouped[key]!.swellHeight = swell.height;
  }

  for (const wind of windByHour) {
    const key = `${wind.day}_${getDayPart(wind.hour)}`;
    if (!grouped[key]) {
      grouped[key] = {
        date: wind.day,
        dayPart: getDayPart(wind.hour),
        segment: `${wind.day} ${getDayPart(wind.hour)}`,
        timestamp_utc: wind.timestamp,
        timestamp_pacific: wind.localTimeISO ?? toPacificTime(new Date(wind.timestamp)).toISOString(),
      };
    }
    grouped[key]!.windSpeed = wind.speed;
    grouped[key]!.windDirection = wind.direction;
  }

  return Object.values(grouped).filter(
    (block): block is OutlookBlock =>
      !!block.segment &&
      block.swellHeight !== undefined &&
      block.windSpeed !== undefined &&
      block.windDirection !== undefined &&
      block.dayPart !== undefined &&
      block.date !== undefined &&
      block.timestamp_utc !== undefined &&
      block.timestamp_pacific !== undefined
  );
}
