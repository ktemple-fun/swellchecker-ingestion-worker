
// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// import fetchNdbcData from "./parsers/fetchNdbcData.ts";
// import { fetchTideData } from "./parsers/fetchTideData.ts";
// import { fetchSwellForecast } from "./parsers/fetchSwellForecast.ts";
// import { fetchWindForecast } from "./parsers/fetchWindForecast.ts";
// import { surfSpots } from "./config/surfSpots.ts";
// import { insertIngestionData } from "./lib/insertIngestionData.ts";
// import { insertTideObservations } from "./lib/insertTideObservations.ts";
// import { generateSurfOutlook } from './lib/generateSurfOutlook.ts';
// import { cacheSurfOutlook } from './lib/cacheSurfOutlook.ts';
// import { normalizeTimestampToHour } from './lib/time.ts';

// function getForecastTimeWindow() {
//   const today = new Date();
//   today.setUTCHours(0, 0, 0, 0); // force start of today in UTC
//   const start = today.toISOString();
//   const end = new Date(today.getTime() + 240 * 60 * 60 * 1000).toISOString(); // next 10 days
//   return { start, end };
// }

// // serve(async () => {
// //   try {
// //     for (const spot of surfSpots) {
// //       try {
// //         console.log(`🌊 Starting ingestion for ${spot.slug}`);

// //         // 1. Real-time buoy data
// //         const ndbcData = await fetchNdbcData(spot.buoy);
// //         await insertIngestionData(spot.slug, ndbcData, 'buoy');

// //         // 2. Tide observations
// //         const tideData = await fetchTideData(spot.tideStation);

// //         if (!tideData.length) {
// //           console.warn(`⚠️ Skipping tide insertion for ${spot.slug}: No valid tide data`);
// //         } else {
// //           await insertTideObservations(spot.slug, tideData);
// //         }


// //         // 3. Forecast data
// //         const { start, end } = getForecastTimeWindow(240);
// //         const swellData = await fetchSwellForecast(spot.lat, spot.lng, start, end);
// //         const windData = await fetchWindForecast(spot.lat, spot.lng, start, end);

// //         // 4. Merge wind + swell forecast by hour
// //         const merged = swellData.map(entry => {
// //           const hourTimestamp = normalizeTimestampToHour(entry.timestamp);
// //           const windMatch = windData.find(w => normalizeTimestampToHour(w.timestamp) === hourTimestamp);

// //           return {
// //             ...entry,
// //             timestamp: hourTimestamp, // ensure consistent timestamp
// //             wind_speed_mps: windMatch?.wind_speed_mps ?? null,
// //             wind_direction: windMatch?.wind_direction ?? null,
// //           };
// //         });

// //         // 5. Save merged forecast data
// //         await insertIngestionData(spot.slug, merged, 'forecast');

// //         // 6. Generate and cache outlook
// //         const outlook = await generateSurfOutlook(spot.slug);
// //         await cacheSurfOutlook(spot.slug, outlook);

// //         console.log(`✅ Ingestion complete for ${spot.slug}`);
// //       } catch (spotErr) {
// //         console.error(`❌ ----------Ingestion failed for ${spot.slug}:`, spotErr);
// //       }
// //     }

// //     return new Response("Ingestion complete");
// //   } catch (e) {
// //     console.error("❌ Global ingestion error:", e);
// //     return new Response("Error", { status: 500 });
// //   }
// // });

// serve(async () => {
//   try {
//     for (const spot of surfSpots) {
//       try {
//         console.log(`🌊 Starting ingestion for ${spot.slug}`);

//         // 1. Real-time buoy data
//         const ndbcData = await fetchNdbcData(spot.buoy);
//         await insertIngestionData(spot.slug, ndbcData, 'buoy');

//         // 2. Tide observations
//         const tideData = await fetchTideData(spot.tideStation);
//         if (!Array.isArray(tideData) || tideData.length === 0) {
//           console.warn(`⚠️ Skipping tide insertion for ${spot.slug}: No valid tide data`);
//         } else {
//           await insertTideObservations({
//             station_id: spot.tideStation,
//             observations: tideData
//           });

//         }

//         // 3. Skip forecast if lat/lng are missing
//         if (spot.lat == null || spot.lng == null) {
//           console.warn(`⚠️ Skipping forecast ingestion for ${spot.slug}: Missing lat/lng`);
//           continue;
//         }

//         const { start, end } = getForecastTimeWindow();
//         const swellData = await fetchSwellForecast(spot.lat, spot.lng, start, end);
//         const windData = await fetchWindForecast(spot.lat, spot.lng, start, end);

//         // 4. Merge wind + swell forecast by hour
//         const merged = swellData.map(entry => {
//           const hourTimestamp = normalizeTimestampToHour(entry.timestamp);
//           const windMatch = windData.find(w => normalizeTimestampToHour(w.timestamp) === hourTimestamp);

//           return {
//             ...entry,
//             timestamp: hourTimestamp,
//             wind_speed_mps: windMatch?.wind_speed_mps ?? null,
//             wind_direction: windMatch?.wind_direction ?? null,
//           };
//         });

//         // 5. Save merged forecast data
//         await insertIngestionData(spot.slug, merged, 'forecast');

//         // 6. Generate and cache outlook
//         const outlook = await generateSurfOutlook(spot.slug);
//         await cacheSurfOutlook(spot.slug, outlook);

//         console.log(`✅ Ingestion complete for ${spot.slug}`);
//       } catch (spotErr) {
//         console.error(`❌ ----------Ingestion failed for ${spot.slug}:`, spotErr);
//       }
//     }

//     return new Response("Ingestion complete");
//   } catch (e) {
//     console.error("❌ Global ingestion error:", e);
//     return new Response("Error", { status: 500 });
//   }
// });



// index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import fetchNdbcData from "./parsers/fetchNdbcData.ts";
import { fetchTideData } from "./parsers/fetchTideData.ts";
import { fetchSwellForecast } from "./parsers/fetchSwellForecast.ts";
import { fetchWindForecast } from "./parsers/fetchWindForecast.ts";
import { surfSpots } from "./config/surfSpots.ts";
import { insertIngestionData } from "./lib/insertIngestionData.ts";
import { insertTideObservations } from "./lib/insertTideObservations.ts";
import { generateSurfOutlook } from './lib/generateSurfOutlook.ts';
import { cacheSurfOutlook } from './lib/cacheSurfOutlook.ts';
import { normalizeTimestampToHour } from './lib/time.ts';

function getForecastTimeWindow() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = today.toISOString();
  const end = new Date(today.getTime() + 240 * 60 * 60 * 1000).toISOString();
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
        // 2. Tide observations
        const tideData = await fetchTideData(spot.tideStation);

        if (!tideData.length) {
          console.warn(`⚠️ Skipping tide insertion for ${spot.slug}: No valid tide data`);
        } else {
          await insertTideObservations({
            station_id: spot.tideStation,
            observations: tideData
              // only keep entries with a parsed tideHeight
              .filter(o => typeof o.tideHeight === 'number')
              // map into the shape our DB expects
              .map(o => ({
                spot_slug: spot.slug,
                station_id: spot.tideStation,
                timestamp_utc: o.timestampUtc,                     // use the parser’s ISO timestamp
                height_ft: Number((o.tideHeight * 3.28084).toFixed(2)), // convert m→ft
              })),
          });
        }



        // 3. Forecast ingestion
        if (spot.lat == null || spot.lng == null) {
          console.warn(`⚠️ Skipping forecast ingestion for ${spot.slug}: Missing lat/lng`);
          continue;
        }

        const now = new Date();
        const start = now.toISOString();
        const end = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
        // 'YYYY-MM-DD'

        const { lat, lng } = spot;

        const swellData = await fetchSwellForecast({ lat, lng, start, end });


        const windData = await fetchWindForecast(spot.lat, spot.lng, start, end);

        const merged = swellData.map(entry => {
          const hourTimestamp = normalizeTimestampToHour(entry.timestamp);
          const windMatch = windData.find(w => normalizeTimestampToHour(w.timestamp) === hourTimestamp);
          return {
            ...entry,
            timestamp: hourTimestamp,
            wind_speed_mps: windMatch?.wind_speed_mps ?? null,
            wind_direction: windMatch?.wind_direction ?? null,
          };
        });

        await insertIngestionData(spot.slug, merged, 'forecast');


        const outlook = await generateSurfOutlook({ spot });
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
