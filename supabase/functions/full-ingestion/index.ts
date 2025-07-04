// functions/full-ingestion.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import fetchNdbcData from "./parsers/fetchNdbcData.ts";
import { fetchTideData } from "./parsers/fetchTideData.ts";
import { fetchSwellForecast } from "./parsers/fetchSwellForecast.ts";
import { fetchWindForecast } from "./parsers/fetchWindForecast.ts";
import { surfSpots } from "./config/surfSpots.ts";
import { insertIngestionData } from "./lib/insertIngestionData.ts";
import { insertTideObservations } from "./lib/insertTideObservations.ts";
import { mergeSwellWind } from "./lib/mergeSwellWind.ts";
import type { SpotMeta } from "./lib/generateSurfOutlook.ts";

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("spot");
    if (!slug) {
      return new Response(
        JSON.stringify({ error: "Missing required ?spot parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find the spot metadata
    const rawMeta = surfSpots.find(s => s.slug === slug);
    if (!rawMeta) {
      return new Response(
        JSON.stringify({ error: `No spot found with slug=\"${slug}\"` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const spotMeta = rawMeta as unknown as SpotMeta;
    console.log(`🌊  ${slug}: start ingestion`);

    // 1) Buoy data
    try {
      const rows = await fetchNdbcData(spotMeta.buoy);
      console.log(`📊 [${slug}] fetched ${rows.length} buoy rows`);
      await insertIngestionData(slug, rows.map(r => ({ ...r })), "buoy");
    } catch (err) {
      console.error(`❌ buoy ingestion failed for ${slug}`, err);
    }

    // 2) Tide observations
    try {
      const tideRows = await fetchTideData(spotMeta.tideStation);
      console.log(`📊 [${slug}] fetched ${tideRows.length} tide rows`);
      if (tideRows.length) {
        await insertTideObservations({
          station_id: spotMeta.tideStation,
          location_slug: slug,
          observations: tideRows,
        });
      }
    } catch (err) {
      console.error(`❌ tide ingestion failed for ${slug}`, err);
    }

    // 3) Forecast ingestion (swell + wind)
    if (spotMeta.lat != null && spotMeta.lng != null) {
      const now = new Date();
      const start = now.toISOString().split("T")[0];
      const end = new Date(now.getTime() + 48 * 3600_000)
        .toISOString().split("T")[0];
      try {
        const swell = await fetchSwellForecast({ lat: spotMeta.lat, lng: spotMeta.lng, start, end });
        console.log(`📥 [${slug}] fetched ${swell.length} swell rows`);

        const wind = await fetchWindForecast(spotMeta.lat, spotMeta.lng, start, end);
        console.log(`💨 [${slug}] fetched ${wind.length} wind rows`);

        const merged = mergeSwellWind(swell, wind);
        console.log(`🔀 [${slug}] merged swell+wind → ${merged.length} rows`);

        const missing = swell.length - merged.length;
        if (missing) console.warn(`⚠️ [${slug}] ${missing} swell rows missing wind`);

        // deno-lint-ignore no-explicit-any
        await insertIngestionData(slug, merged as any[], "forecast");
      } catch (err) {
        console.error(`❌ forecast ingestion failed for ${slug}`, err);
      }
    } else {
      console.warn(`⚠️ [${slug}] missing lat/lng:`, spotMeta.lat, spotMeta.lng);
    }

    console.log(`✅  ${slug}: ingestion complete`);
    return new Response(
      JSON.stringify({ spot: slug, status: "ingested" }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("❌ full-ingestion error", err);
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});