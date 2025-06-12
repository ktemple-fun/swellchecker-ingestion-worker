// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// import fetchNdbcData from "./parsers/fetchNdbcData.ts";
// import fetchTideData from "./parsers/fetchTideData.ts";
// import fetchSwellForecast from "./parsers/fetchSwellForecast.ts";
// import { surfSpots } from "./config/surfSpots.ts";
// import { insertIngestionData } from "./lib/insertIngestionData.ts";
// import { insertTideObservations } from "./lib/insertTideObservations.ts";
// import { generateSurfOutlook } from './lib/generateSurfOutlook.ts';
// import { cacheSurfOutlook } from './lib/cacheSurfOutlook.ts';
// import fetchWindForecast from './parsers/fetchWindForecast.ts';
// import { normalizeTimestampToHour } from './utils/time.ts';

// // Helper to format ISO window
// function getForecastTimeWindow(hoursAhead = 240) {
//   const now = new Date();
//   const start = now.toISOString();
//   const end = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000).toISOString();
//   return { start, end };
// }

// serve(async () => {
//   try {
//     for (const spot of surfSpots) {
//       console.log(`🌊 Starting ingestion for ${spot.slug}`);

//       // 1. Real-time buoy data
//       const ndbcData = await fetchNdbcData(spot.buoy);
//       await insertIngestionData(spot.slug, ndbcData);

//       // 2. Tide observations
//       const tideData = await fetchTideData(spot.tideStation);
//       await insertTideObservations(spot.slug, tideData);

//       // 3. Forecast swell data
//       const { start, end } = getForecastTimeWindow(240);
//       const swellData = await fetchSwellForecast(spot.lat, spot.lng, start, end);
//       const windData = await fetchWindForecast(spot.lat, spot.lng, start, end);

//       // Merge by timestamp
//       // const merged = swellData.map(entry => {
//       //   const windMatch = windData.find(w => w.timestamp === entry.timestamp);
//       //   return {
//       //     ...entry,
//       //     wind_speed_mps: windMatch?.wind_speed_mps ?? null,
//       //     wind_direction: windMatch?.wind_direction ?? null,
//       //   };
//       // });

//       const merged = swellData.map(entry => {
//         const hourTimestamp = normalizeTimestampToHour(entry.timestamp);
//         const windMatch = windData.find(w => normalizeTimestampToHour(w.timestamp) === hourTimestamp);
//         return {
//           ...entry,
//           timestamp: hourTimestamp, // normalized
//           wind_speed_mps: windMatch?.wind_speed_mps ?? null,
//           wind_direction: windMatch?.wind_direction ?? null,
//         };
//       });

//       const unmatched = swellData.filter(s => {
//         const normalizedS = normalizeTimestampToHour(s.timestamp);
//         return !windData.some(w => normalizeTimestampToHour(w.timestamp) === normalizedS);
//       });

//       console.log(`🧩 Total swell records: ${swellData.length}`);
//       console.log(`💨 Total wind records: ${windData.length}`);
//       console.log(`❓ Unmatched swell records after normalization: ${unmatched.length}`);


//       await insertIngestionData(spot.slug, merged);


//       // surf outlook 
//       const outlook = await generateSurfOutlook(spot.slug);
//       await cacheSurfOutlook(spot.slug, outlook);

//       console.log(`✅ Ingestion complete for ${spot.slug}`);
//     }

//     return new Response("Ingestion complete");
//   } catch (e) {
//     console.error("❌ Ingestion error:", e);
//     return new Response("Error", { status: 500 });
//   }
// });



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
        console.log(`🌊 Starting ingestion for testing testing ${spot.slug}`);

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

        // Optional log: check how many swell records didn’t match wind
        const unmatched = swellData.filter(s => {
          const t = normalizeTimestampToHour(s.timestamp);
          return !windData.some(w => normalizeTimestampToHour(w.timestamp) === t);
        });

        await supabase.from('forecast_debug_log').insert({
          spot_slug: spot.slug,
          message: `🔎 ${unmatched.length} unmatched wind records out of ${swellData.length} swell entries`,
          timestamp: new Date().toISOString(), // if needed
        });

        await supabase.from("surf_ingestion_data").insert({
          spot_slug: "manual-test",
          timestamp: new Date().toISOString(),
          wave_height: 1.23,
          wave_period: 9,
          source: "forecast"
        });


        // 5. Save merged forecast data
        await insertIngestionData(spot.slug, merged, 'forecast');

        // 6. Generate and cache outlook
        const outlook = await generateSurfOutlook(spot.slug);
        await cacheSurfOutlook(spot.slug, outlook);

        console.log(`✅ Ingestion complete for ${spot.slug}`);
      } catch (spotErr) {
        console.error(`❌ Ingestion failed for ${spot.slug}:`, spotErr);
      }
    }

    return new Response("Ingestion complete");
  } catch (e) {
    console.error("❌ Global ingestion error:", e);
    return new Response("Error", { status: 500 });
  }
});

