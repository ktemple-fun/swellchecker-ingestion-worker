import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import fetchNdbcData from "./parsers/fetchNdbcData.ts";
import fetchTideData from "./parsers/fetchTideData.ts";
import { surfSpots } from "./config/surfSpots.ts";
import { insertIngestionData } from "./lib/insertIngestionData.ts";
import { insertTideObservations } from "./lib/insertTideObservations.ts";
serve(async ()=>{
  try {
    for (const spot of surfSpots){
      console.log(`🌊 Starting ingestion for ${spot.slug}`);
      const ndbcData = await fetchNdbcData(spot.buoy);
      const tideData = await fetchTideData(spot.tideStation);
      await insertIngestionData(spot.slug, ndbcData);
      await insertTideObservations(spot.slug, tideData);
      console.log(`✅ Ingestion complete for ${spot.slug}`);
    }
    return new Response("Ingestion complete");
  } catch (e) {
    console.error("❌ Ingestion error:", e);
    return new Response("Error", {
      status: 500
    });
  }
});
