import { toPacificTime } from './time.ts';
import { groupForecastByDayPart } from './groupForecastByDayPart.ts';
import { fetchSwellForecast } from '../parsers/fetchSwellForecast.ts';
import { fetchWindForecast } from '../parsers/fetchWindForecast.ts';
import { decomposeSwellSystems } from './decomposeSwellSystems.ts';
import { getDirectionTolerance } from './directionTolerance.ts';

interface SpotMeta {
  slug: string;
  lat: number;
  lng: number;
  buoy: string;
  tideStation: string;
  facingDirection: number;
  exposure: 'low' | 'medium' | 'high';
  bathymetry: 'shelf' | 'steep' | 'canyon' | 'point' | 'reef';
}

interface SwellEntry {
  hour: number;
  day: string;
  height: number;
  period?: number;
  direction?: number;
  timestamp: string;
  localTimeISO: string;
}

interface WindEntry {
  hour: number;
  day: string;
  speed: number;
  direction: number;
  timestamp: string;
  localTimeISO: string;
}

export async function generateSurfOutlook({ spot }: { spot: SpotMeta }) {
  const { lat, lng, slug, facingDirection, exposure, bathymetry } = spot;
  const now = new Date();
  const start = now.toISOString();
  const end = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  // 1. Fetch raw forecasts
  const swellData = await fetchSwellForecast({ lat, lng, start, end });
  console.log(`[${slug}] raw swellData length:`, swellData.length);

  const windRaw = await fetchWindForecast(lat, lng, start, end);
  console.log(`[${slug}] raw windData length:`, windRaw.length);

  // 2. Decompose into primary/secondary systems
  const systems = decomposeSwellSystems(swellData);
  console.log(`[${slug}] decomposed swell systems:`, systems);

  // 3. Determine directional tolerance
  const tol = getDirectionTolerance(exposure, bathymetry);
  console.log(`[${slug}] direction tolerance: ±${tol}°`);

  // 4. Filter systems by spot orientation
  const validSystems = systems.filter(sys => {
    const diff = Math.abs(sys.avgDirection - facingDirection) % 360;
    const angDist = diff > 180 ? 360 - diff : diff;
    return angDist <= tol;
  });
  console.log(`[${slug}] valid systems count:`, validSystems.length);

  // 5. Expand valid systems into hourly swell entries for grouping
  const swellByHour: SwellEntry[] = validSystems.flatMap(sys =>
    swellData
      .filter(e =>
        Math.abs(e.wave_period - sys.avgPeriod) <= 1 &&
        (Math.abs(e.wave_direction - sys.avgDirection) % 360) <= tol
      )
      .map(entry => {
        const local = toPacificTime(new Date(entry.timestamp));
        return {
          hour: local.getHours(),
          day: local.toISOString().split('T')[0],
          height: entry.wave_height!,  
          period: entry.wave_period ?? null,
          direction: entry.wave_direction ?? null,
          timestamp: entry.timestamp,
          localTimeISO: local.toISOString(),
        };
      })
  );

  // 6. Map wind entries to Pacific hourly
  const windByHour: WindEntry[] = windRaw.map(e => {
    const local = toPacificTime(new Date(e.timestamp));
    return {
      hour: local.getHours(),
      day: local.toISOString().split('T')[0],
      speed: e.wind_speed_mps,
      direction: e.wind_direction!,  
      timestamp: e.timestamp,
      localTimeISO: local.toISOString(),
    };
  });

  // 7. Group into AM/PM segments
  const outlook = groupForecastByDayPart({ swellByHour, windByHour });
  console.log(`[${slug}] grouped outlook blocks:`, outlook.length);

  // 8. Build final outlook objects
  const finalOutlook = outlook.map(block => {
    const match = swellByHour.find(sw =>
      sw.day === block.date && (sw.hour < 12 ? 'AM' : 'PM') === block.dayPart
    );
    return {
      segment: block.segment,
      avg_wave_height: block.swellHeight,
      avg_wave_period: block.wavePeriod ?? null,
      avg_tide_ft: null,
      avg_wind_speed: block.windSpeed ?? null,
      avg_wind_direction: block.windDirection ?? null,
      wind_quality: 'Offshore',
      rating: 'Fair',
      summary: '',
      timestamp_utc: match?.timestamp ?? null,
      timestamp_pacific: match?.localTimeISO ?? null,
    };
  });

  console.log(`[${slug}] finalOutlook segments:`, finalOutlook.length);
  return finalOutlook;
}
