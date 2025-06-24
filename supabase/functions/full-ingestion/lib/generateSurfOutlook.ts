/* ------------------------------------------------------------------
 *  generateSurfOutlook.ts
 * ----------------------------------------------------------------- */
/* ------------------------------------------------------------------
 *  generateSurfOutlook.ts
 *  Builds AM/PM outlook blocks for a single surf spot
 * ----------------------------------------------------------------- */

import { groupForecastByDayPart }     from './groupForecastByDayPart.ts';
import { fetchSwellForecast, SwellRow } from '../parsers/fetchSwellForecast.ts';
import { fetchWindForecast }          from '../parsers/fetchWindForecast.ts';
import {
  decomposeSwellSystems,
  RawSwellEntry,
} from './decomposeSwellSystems.ts';
import { getDirectionTolerance }      from './directionTolerance.ts';
import { estimateSurfFaceFt }         from './surfHeightUtils.ts';
import { rateAndSummarizeOutlook }    from './rateAndSummarizeOutlook.ts';

/* ---------- union types ------------------------------------------ */
export type Exposure   = 'low' | 'medium' | 'high';
export type Bathymetry = 'shelf' | 'steep' | 'canyon' | 'point' | 'reef';

/* ---------- metadata passed from the entry-point ----------------- */
export interface SpotMeta {
  slug            : string;
  buoy            : string;      // 🆕 needed for completeness in entry-point
  lat             : number;
  lng             : number;
  facingDirection : number;
  tideStation     : string;
  exposure        : Exposure;
  bathymetry      : Bathymetry;
}

/* ---------- helper to keep only numeric swell rows -------------- */
function isComplete(r: SwellRow): r is SwellRow & {
  wave_height   : number;
  wave_period   : number;
  wave_direction: number;
} {
  return r.wave_height !== null && r.wave_period !== null && r.wave_direction !== null;
}

/* ---------------------------------------------------------------- */
export async function generateSurfOutlook({ spot }: { spot: SpotMeta }) {
  const { lat, lng, slug, facingDirection, exposure, bathymetry } = spot;

  /* 0. 48-hour window as YYYY-MM-DD */
  const now       = new Date();
  const startDate = now.toISOString().split('T')[0];
  const endDate   = new Date(now.getTime() + 48 * 60 * 60 * 1_000)
                      .toISOString().split('T')[0];

  /* 1. fetch source data */
  const swellRaw = await fetchSwellForecast({ lat, lng, start: startDate, end: endDate });
  const windRaw  = await fetchWindForecast(lat, lng, startDate, endDate);

  /* 2. keep complete numeric swell rows */
  const swellRows = swellRaw.filter(isComplete);

  /* 3. dominant systems (need only numeric + timestamp) */
  const systems = decomposeSwellSystems(
    swellRows.map<RawSwellEntry>((r) => ({
      timestamp      : r.timestamp,
      wave_height    : r.wave_height,
      wave_period    : r.wave_period,
      wave_direction : r.wave_direction,
    }))
  );
  const dirTol = getDirectionTolerance(exposure, bathymetry);

  /* 4. swell → hourly */
  const swellByHour = systems.flatMap((sys) =>


    swellRows
      .filter((r) =>
        Math.abs(r.wave_period - sys.avgPeriod) <= 1 &&
        (Math.abs(r.wave_direction - sys.avgDirection) % 360) <= dirTol
      )
      .map((r) => {
        const [day, hhmm] = r.timestamp.split('T');
        return {
          hour              : +hhmm.slice(0, 2),
          day,
          height            : r.wave_height,
          period            : r.wave_period,
          direction         : r.wave_direction,
          timestamp         : r.timestamp,
          timestamp_pacific : r.timestamp_pacific,
          timestamp_utc     : r.timestamp_utc,
        };
      })
  );

  /* 5. wind → hourly */
  const windByHour = windRaw.map((w: {
    timestamp: string;
    wind_speed_mps: number;
    wind_direction: number;
    timestamp_pacific: string;
    timestamp_utc: string;
  }) => {
    const [day, hhmm] = w.timestamp.split('T');
    return {
      hour              : +hhmm.slice(0, 2),
      day,
      speed             : w.wind_speed_mps,
      direction         : w.wind_direction,
      timestamp         : w.timestamp,
      timestamp_pacific : w.timestamp_pacific,
      timestamp_utc     : w.timestamp_utc,
    };
  });

  /* 6. bucket AM/PM */
  const buckets = groupForecastByDayPart({ swellByHour, windByHour });

  /* 7. enrich & rate */
  const rated = rateAndSummarizeOutlook(
    buckets.map((b) => {
      const faceFt = estimateSurfFaceFt(
        b.swellHeight, b.wavePeriod ?? null, exposure, bathymetry,
      );
      const windKt = +(b.windSpeed * 1.94384).toFixed(2);

      return {
        swellHeight       : faceFt,
        windSpeed         : windKt,
        windDirection     : b.windDirection,
        date              : b.date,
        dayPart           : b.dayPart,
        segment           : b.segment,
        timestamp_pacific : b.timestamp_pacific,
        timestamp_utc     : b.timestamp_utc,
      };
    }),
    facingDirection,
  );

  for (const row of swellRows) {
  if (!row.timestamp_pacific || !row.timestamp_utc) {
    console.warn('[generateSurfOutlook] missing timestamp ISO values:', row);
  }
}

  /* 8. shape expected by DB / FE */
  return rated.map((r) => ({
    segment            : r.segment,
    avg_wave_height    : r.swellHeight,
    avg_wave_period    : null,
    avg_tide_ft        : null,
    avg_wind_speed     : r.windSpeed,
    avg_wind_direction : r.windDirection,
    wind_quality       : r.windQuality,
    rating             : r.rating,
    summary            : r.summary,
    timestamp_pacific  : r.timestamp_pacific,
    timestamp_utc      : r.timestamp_utc,
  }));
}
