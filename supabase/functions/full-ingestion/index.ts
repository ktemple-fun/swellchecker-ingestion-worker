


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import fetchNdbcData                from "./parsers/fetchNdbcData.ts";
import { fetchTideData }            from "./parsers/fetchTideData.ts";
import { fetchSwellForecast }       from "./parsers/fetchSwellForecast.ts";
import { fetchWindForecast }        from "./parsers/fetchWindForecast.ts";

import { surfSpots }                from "./config/surfSpots.ts";
import { insertIngestionData }      from "./lib/insertIngestionData.ts";
import { insertTideObservations }   from "./lib/insertTideObservations.ts";
import { generateSurfOutlook, SpotMeta } from "./lib/generateSurfOutlook.ts";
import { cacheSurfOutlook }         from "./lib/cacheSurfOutlook.ts";
import { mergeSwellWind }           from "./lib/mergeSwellWind.ts";

const ymd = (d: Date) => d.toISOString().split("T")[0];
const window48h = () => {
  const now = new Date();
  return {
    start: ymd(now),
    end  : ymd(new Date(now.getTime() + 48 * 60 * 60 * 1_000)),
  };
};

export function truncateIsoToHour(iso: string): string {
  /* "2025-06-23T09:45:00-07:00" → "2025-06-23T09:00:00-07:00" */
  const [date, time] = iso.split("T");
  const hh = time.slice(0, 2);
  return `${date}T${hh}:00:00${iso.slice(-6)}`; // preserve offset
}


serve(async () => {
  try {
    for (const raw of surfSpots) {
      const spot = raw as unknown as SpotMeta;
      console.log(`🌊  ${spot.slug}: start`);

      /* buoy --------------------------------------------------- */
      try {
        const rows = await fetchNdbcData(spot.buoy);
        await insertIngestionData(spot.slug, rows, "buoy");
      } catch (e) { console.error(`buoy ${spot.slug}`, e); }

      /* tide --------------------------------------------------- */
      try {
        const rows = await fetchTideData(spot.tideStation);
        if (rows.length) {
          await insertTideObservations({ station_id: spot.tideStation, observations: rows });
        }
      } catch (e) { console.error(`tide ${spot.slug}`, e); }

      /* forecast ---------------------------------------------- */
      if (spot.lat != null && spot.lng != null) {
        const { start, end } = window48h();
        try {
          const swell = await fetchSwellForecast({ lat: spot.lat, lng: spot.lng, start, end });
          const wind  = await fetchWindForecast  ( spot.lat,        spot.lng,      start, end );

          const merged = mergeSwellWind(swell, wind);
          await insertIngestionData(spot.slug, merged, "forecast");
        } catch (e) { console.error(`forecast ${spot.slug}`, e); }
      }

      /* outlook ----------------------------------------------- */
      try {
        const outlook = await generateSurfOutlook({ spot });
        await cacheSurfOutlook(spot.slug, outlook);
      } catch (e) { console.error(`outlook ${spot.slug}`, e); }

      console.log(`✅  ${spot.slug}: done`);
    }
    return new Response("Ingestion complete");
  } catch (e) {
    console.error("global error", e);
    return new Response("Error", { status: 500 });
  }
});
