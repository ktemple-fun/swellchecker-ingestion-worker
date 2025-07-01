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

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("spot");
    const toProcess = slug
      ? surfSpots.filter(s => s.slug === slug)
      : surfSpots;

    if (slug && toProcess.length === 0) {
      return new Response(`No spot found with slug="${slug}"`, { status: 400 });
    }

    // only one spot now → tiny CPU footprint
    const spotMeta = toProcess[0] as unknown as {
      slug: string; buoy: string; tideStation: string; lat?: number; lng?: number;
    };
    console.log(`🌊  ${spotMeta.slug}: start`);

    /* 1) buoy */
    try {
      const rows = await fetchNdbcData(spotMeta.buoy);
      await insertIngestionData(spotMeta.slug, rows.map(r => ({ ...r })), "buoy");
    } catch (e) {
      console.error(`❌ buoy ${spotMeta.slug}`, e);
    }

    /* 2) tide */
    try {
      const rows = await fetchTideData(spotMeta.tideStation);
      if (rows.length) {
        await insertTideObservations({
          station_id: spotMeta.tideStation,
          location_slug: spotMeta.slug,
          observations: rows,
        });
      }
    } catch (e) {
      console.error(`❌ tide ${spotMeta.slug}`, e);
    }

    /* 3) forecast (swell + wind) */
    if (spotMeta.lat != null && spotMeta.lng != null) {
      const now = new Date();
      const start = now.toISOString().split("T")[0];
      const end = new Date(now.getTime() + 48 * 3600_000).toISOString().split("T")[0];
      try {
        const swell = await fetchSwellForecast({ lat: spotMeta.lat, lng: spotMeta.lng, start, end });
        const wind = await fetchWindForecast(spotMeta.lat, spotMeta.lng, start, end);
        const merged = mergeSwellWind(swell, wind);
        // deno-lint-ignore no-explicit-any
        await insertIngestionData(spotMeta.slug, merged as any[], "forecast");
      } catch (e) {
        console.error(`❌ forecast ${spotMeta.slug}`, e);
      }
    }


    console.log(`✅  ${spotMeta.slug}: done`);
    return new Response(
      JSON.stringify({ spot: spotMeta.slug, status: "done" }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (e: unknown) {
    console.error("❌ full-ingestion error", e);
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
