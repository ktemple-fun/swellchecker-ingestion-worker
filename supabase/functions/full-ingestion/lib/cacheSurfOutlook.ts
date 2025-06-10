
import { supabase } from './supabaseClient.ts';

interface OutlookSegment {
  segment: string;
  avg_wave_height: number;
  avg_wave_period: number;
  avg_tide_ft: number | null;
  avg_wind_speed: number | null;
  avg_wind_direction: number | null;
  wind_quality: 'Offshore' | 'Onshore' | 'Sideshore';
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
    avg_wind_speed_mps: item.avg_wind_speed ?? null,
    avg_wind_direction: item.avg_wind_direction ?? null,
    wind_quality: item.wind_quality,
    rating: item.rating,
    quality: item.rating, // fallback for legacy use
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
