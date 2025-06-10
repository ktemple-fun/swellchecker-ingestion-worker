import { supabase } from './supabaseClient.ts';

interface OutlookSegment {
  segment: string;
  avg_wave_height: number;
  avg_wave_period: number;
  avg_tide_ft: number | null;
  rating: string;
  summary: string;
}

export async function cacheSurfOutlook(spot_slug: string, outlook: OutlookSegment[]) {
  if (!outlook.length) {
    console.warn("⚠️ No outlook data to cache.");
    return;
  }

  const payload = outlook.map((item) => ({
    spot_slug,
    segment: item.segment,
    date: item.segment.split(' ')[0],
    part_of_day: item.segment.includes('AM') ? 'AM' : 'PM',
    avg_wave_height: item.avg_wave_height,
    avg_wave_period: item.avg_wave_period,
    avg_tide_ft: item.avg_tide_ft ?? null,
    rating: item.rating,
    quality: item.rating, // fallback
    summary: item.summary,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("surf_outlook_summaries")
    .upsert(payload, {
      onConflict: ["spot_slug", "segment"],
    });

  if (error) {
    console.error("❌ Failed to cache surf outlook:", error);
  } else {
    console.log(`✅ Cached ${payload.length} surf outlook summaries`);
  }
}
