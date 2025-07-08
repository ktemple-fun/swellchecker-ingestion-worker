import { groupForecastByDayPart } from '../../full-ingestion/lib/groupForecastByDayPart.ts';
import { fetchSwellForecast } from '../parsers/fetchSwellForecast.ts';
import { fetchWindForecast } from '../parsers/fetchWindForecast.ts';
import { fetchTideForecast } from '../parsers/fetchTideForecast.ts';
import {
  decomposeSwellSystems,
  RawSwellEntry,
} from '../../full-ingestion/lib/decomposeSwellSystems.ts';
import { getDirectionTolerance } from '../../full-ingestion/lib/directionTolerance.ts';
import { estimateSurfFaceFt } from '../../full-ingestion/lib/surfHeightUtils.ts';
import { rateAndSummarizeOutlook } from '../../full-ingestion/lib/rateAndSummarizeOutlook.ts';
import type { SwellRow } from './types.ts';


export type Exposure = 'low' | 'medium' | 'high';
export type Bathymetry = 'shelf' | 'steep' | 'canyon' | 'point' | 'reef';

export interface SpotMeta {
  slug: string;
  buoy: string;
  lat: number;
  lng: number;
  facingDirection: number;
  tideStation: string;
  exposure: Exposure;
  bathymetry: Bathymetry;
}

function isComplete(r: SwellRow): r is SwellRow & {
  wave_height: number;
  wave_period: number;
  wave_direction: number;
} {
  return r.wave_height !== null && r.wave_period !== null && r.wave_direction !== null;
}

export async function generateSurfOutlook({ spot }: { spot: SpotMeta }) {
  const { lat, lng, facingDirection, exposure, bathymetry, tideStation } = spot;

  const now = new Date();
  const startDate = now.toISOString().split('T')[0];

  // 7-day range
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1_000)
    .toISOString()
    .split('T')[0];

  const swellRaw = await fetchSwellForecast({ lat, lng, start: startDate, end: endDate });
  const windRaw = await fetchWindForecast(lat, lng, startDate, endDate);
  const tideRaw = await fetchTideForecast(tideStation, startDate, endDate);

  const swellRows = swellRaw.filter(isComplete);

  const systems = decomposeSwellSystems(
    swellRows.map<RawSwellEntry>((r) => ({
      timestamp: r.timestamp_utc,
      wave_height: r.wave_height,
      wave_period: r.wave_period,
      wave_direction: r.wave_direction,
    }))
  );

  const dirTol = getDirectionTolerance(exposure, bathymetry);

  const swellByHour = systems.flatMap((sys) =>
    swellRows
      .filter((r) =>
        Math.abs(r.wave_period - sys.avgPeriod) <= 1 &&
        (Math.abs(r.wave_direction - sys.avgDirection) % 360) <= dirTol
      )
      .map((r) => {
        const hour = new Date(r.timestamp_utc).getUTCHours();
        const day = r.timestamp_utc.split('T')[0];
        return {
          hour,
          day,
          height: r.wave_height,
          period: r.wave_period,
          direction: r.wave_direction,
          timestamp_pacific: r.timestamp_pacific,
          timestamp_utc: r.timestamp_utc,
          timestamp: r.timestamp_utc, // Add this line to satisfy SwellEntry
        };
      })
  );

  console.log('[generateSurfOutlook] sample swellByHour:', swellByHour.slice(0, 3));


  const windByHour = windRaw.map((w: Awaited<ReturnType<typeof fetchWindForecast>>[number]) => {
    const hour = new Date(w.timestamp_utc).getUTCHours();
    const day = w.timestamp_utc.split('T')[0];
    return {
      hour,
      day,
      speed: w.wind_speed_mps,
      direction: w.wind_direction,
      timestamp_pacific: w.timestamp_pacific,
      timestamp_utc: w.timestamp_utc,
    };
  });

  const tideByHour = tideRaw.map((t) => {
    const [day, hhmm] = t.timestamp_pacific.split('T');
    return {
      hour: +hhmm.slice(0, 2),
      day,
      height: t.tide_ft,
      timestamp_pacific: t.timestamp_pacific,
      timestamp_utc: t.timestamp_utc,
    };
  });

  const buckets = groupForecastByDayPart({ swellByHour, windByHour, tideByHour });

  const rated = rateAndSummarizeOutlook(
    buckets.map((b) => {
      const faceFt = estimateSurfFaceFt(
        b.swellHeight,
        b.wavePeriod ?? null,
        exposure,
        bathymetry
      );
      const windKt = +(b.windSpeed * 1.94384).toFixed(2);
      return {
        swellHeight: faceFt,
        wavePeriod: b.wavePeriod ?? undefined,
        windSpeed: windKt,
        windDirection: b.windDirection,
        avg_wave_direction: b.waveDirection,
        avg_tide_ft: b.avg_tide_ft ?? undefined,
        date: b.date,
        dayPart: b.dayPart,
        segment: b.segment,
        timestamp_pacific: b.timestamp_pacific,
        timestamp_utc: b.timestamp_utc,
      };
    }),
    facingDirection
  );

  for (const row of swellRows) {
    if (!row.timestamp_pacific || !row.timestamp_utc) {
      console.warn('[generateSurfOutlook] missing timestamp ISO values:', row);
    }
  }

  return rated.map((r) => ({
    segment: r.segment,
    avg_wave_height: r.avg_wave_height,
    avg_wave_period: r.avg_wave_period,
    avg_wave_direction: r.avg_wave_direction,
    avg_tide_ft: r.avg_tide_ft,
    avg_wind_speed: r.avg_wind_speed,
    avg_wind_direction: r.avg_wind_direction,
    wind_quality: r.windQuality,
    rating: r.rating,
    summary: r.summary,
    timestamp_pacific: r.timestamp_pacific,
    timestamp_utc: r.timestamp_utc,
  }));
}
