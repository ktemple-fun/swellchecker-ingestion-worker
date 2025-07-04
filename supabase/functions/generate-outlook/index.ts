// functions/generate-outlook.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { surfSpots } from "./config/surfSpots.ts";
import { generateSurfOutlook, SpotMeta } from "./lib/generateSurfOutlook.ts";
import { cacheSurfOutlook } from "./lib/cacheSurfOutlook.ts";

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("spot");
    if (!slug) {
      return new Response(
        JSON.stringify({ error: "Missing ?spot parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find the spot configuration
    const rawMeta = surfSpots.find(s => s.slug === slug);
    if (!rawMeta) {
      return new Response(
        JSON.stringify({ error: `No spot found with slug=\"${slug}\"` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const spotMeta = rawMeta as unknown as SpotMeta;
    console.log(`🗓️  generating surf outlook for ${slug}`);

    // Generate raw outlook segments
    const rawOutlook = await generateSurfOutlook({ spot: spotMeta });
    console.log(`🖥️ [${slug}] generated ${rawOutlook.length} outlook segments`);

    // Normalize undefined tide values to null for storage
    // deno-lint-ignore no-explicit-any
    const normalized = rawOutlook.map((segment: any) => ({
      ...segment,
      avg_tide_ft: segment.avg_tide_ft ?? null,
      timestamp_pacific: segment.timestamp_pacific ?? null,
      timestamp_utc: segment.timestamp_utc ?? null,
    }));

    // Cache into your Supabase table
    await cacheSurfOutlook(slug, normalized);
    console.log(`✅  outlook cached for ${slug}`);

    return new Response(
      JSON.stringify({ spot: slug, segments: normalized.length, status: "done" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    console.error("❌ generate-outlook error", e);
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
