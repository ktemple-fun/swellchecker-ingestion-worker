import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import fetchNdbcData from "./parsers/fetchNdbcData.ts";
import fetchTideData from "./parsers/fetchTideData.ts";
import fetchSwellForecast from "./parsers/fetchSwellForecast.ts";
import { surfSpots } from "./config/surfSpots.ts";
import { insertIngestionData } from "./lib/insertIngestionData.ts";
import { insertTideObservations } from "./lib/insertTideObservations.ts";
import { generateSurfOutlook } from './lib/generateSurfOutlook.ts';
import { cacheSurfOutlook } from './lib/cacheSurfOutlook.ts';
import fetchWindForecast from './parsers/fetchWindForecast.ts';

// Helper to format ISO window
function getForecastTimeWindow(hoursAhead = 240) {
  const now = new Date();
  const start = now.toISOString();
  const end = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000).toISOString();
  return { start, end };
}

serve(async () => {
  try {
    for (const spot of surfSpots) {
      console.log(`🌊 Starting ingestion for ${spot.slug}`);

      // 1. Real-time buoy data
      const ndbcData = await fetchNdbcData(spot.buoy);
      await insertIngestionData(spot.slug, ndbcData);

      // 2. Tide observations
      const tideData = await fetchTideData(spot.tideStation);
      await insertTideObservations(spot.slug, tideData);

      // 3. Forecast swell data
      const { start, end } = getForecastTimeWindow(240);
      const swellData = await fetchSwellForecast(spot.lat, spot.lng, start, end);
      const windData = await fetchWindForecast(spot.lat, spot.lng, start, end);

      // Merge by timestamp
      const merged = swellData.map(entry => {
        const windMatch = windData.find(w => w.timestamp === entry.timestamp);
        return {
          ...entry,
          wind_speed_mps: windMatch?.wind_speed_mps ?? null,
          wind_direction: windMatch?.wind_direction ?? null,
        };
      });

      await insertIngestionData(spot.slug, merged);


      // surf outlook 
      const outlook = await generateSurfOutlook(spot.slug);
      await cacheSurfOutlook(spot.slug, outlook);

      console.log(`✅ Ingestion complete for ${spot.slug}`);
    }

    return new Response("Ingestion complete");
  } catch (e) {
    console.error("❌ Ingestion error:", e);
    return new Response("Error", { status: 500 });
  }
});



