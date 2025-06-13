
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import fetchNdbcData from "./parsers/fetchNdbcData.ts";
import fetchTideData from "./parsers/fetchTideData.ts";
import fetchSwellForecast from "./parsers/fetchSwellForecast.ts";
import fetchWindForecast from "./parsers/fetchWindForecast.ts";
import { surfSpots } from "./config/surfSpots.ts";
import { insertIngestionData } from "./lib/insertIngestionData.ts";
import { insertTideObservations } from "./lib/insertTideObservations.ts";
import { generateSurfOutlook } from './lib/generateSurfOutlook.ts';
import { cacheSurfOutlook } from './lib/cacheSurfOutlook.ts';
import { normalizeTimestampToHour } from './utils/time.ts'; // <-- Timestamp sync utility


// Helper to format ISO time window
function getForecastTimeWindow(hoursAhead = 240) {
  const now = new Date();
  const start = now.toISOString();
  const end = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000).toISOString();
  return { start, end };
}

serve(async () => {
  try {
    for (const spot of surfSpots) {
      try {
        console.log(`🌊 Starting ingestion for ${spot.slug}`);

        // 1. Real-time buoy data
        const ndbcData = await fetchNdbcData(spot.buoy);
        await insertIngestionData(spot.slug, ndbcData, 'buoy');

        // 2. Tide observations
        const tideData = await fetchTideData(spot.tideStation);
        await insertTideObservations(spot.slug, tideData);

        // 3. Forecast data
        const { start, end } = getForecastTimeWindow(240);
        const swellData = await fetchSwellForecast(spot.lat, spot.lng, start, end);
        const windData = await fetchWindForecast(spot.lat, spot.lng, start, end);

        // 4. Merge wind + swell forecast by hour
        const merged = swellData.map(entry => {
          const hourTimestamp = normalizeTimestampToHour(entry.timestamp);
          const windMatch = windData.find(w => normalizeTimestampToHour(w.timestamp) === hourTimestamp);

          return {
            ...entry,
            timestamp: hourTimestamp, // ensure consistent timestamp
            wind_speed_mps: windMatch?.wind_speed_mps ?? null,
            wind_direction: windMatch?.wind_direction ?? null,
          };
        });

        // 5. Save merged forecast data
        await insertIngestionData(spot.slug, merged, 'forecast');

        // 6. Generate and cache outlook
        const outlook = await generateSurfOutlook(spot.slug);
        await cacheSurfOutlook(spot.slug, outlook);

        console.log(`✅ Ingestion complete for ${spot.slug}`);
      } catch (spotErr) {
        console.error(`❌ ----------Ingestion failed for ${spot.slug}:`, spotErr);
      }
    }

    return new Response("Ingestion complete");
  } catch (e) {
    console.error("❌ Global ingestion error:", e);
    return new Response("Error", { status: 500 });
  }
});

