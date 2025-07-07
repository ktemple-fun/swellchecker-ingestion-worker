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
  timestamp_utc?: string;       
  timestamp_pacific?: string;    
}


export async function cacheSurfOutlook(spot_slug: string, outlook: OutlookSegment[]) {

  console.log(`[cacheSurfOutlook] received ${outlook.length} segments for ${spot_slug}`);

  if (!outlook.length) {
    console.warn("⚠️ No outlook data to cache.");
    return;
  }

  const payload = outlook
    .filter((item) => {
      const valid = item && typeof item.segment === 'string' && item.segment.includes(' ');
      if (!valid) console.error("❌ Skipping invalid outlook segment:", item);
      return valid;
    })
    .map((item) => {
      const [date, part] = item.segment.split(' ');
      return {
        spot_slug,
        segment: item.segment,
        date,
        part_of_day: part === 'AM' || part === 'PM' ? part : null,
        avg_wave_height: item.avg_wave_height,
        avg_wave_period: item.avg_wave_period,
        avg_tide_ft: item.avg_tide_ft ?? null,
        avg_wind_speed_mps: item.avg_wind_speed ?? null,
        avg_wind_direction: item.avg_wind_direction ?? null,
        wind_quality: item.wind_quality,
        rating: item.rating,
        quality: item.rating, 
        timestamp_utc: item.timestamp_utc ?? null,       
        timestamp_pacific: item.timestamp_pacific ?? null, 
        summary: item.summary,
        updated_at: new Date().toISOString(),
      };
    });

  if (!payload.length) {
    console.error("❌ No valid outlook segments after filtering. Aborting cache operation.");
    return;
  }
  
      console.log(JSON.stringify(payload, null, 2)); 

  const { error } = await supabase
    .from("surf_outlook_summaries")
    .upsert(payload, {
      onConflict: "spot_slug, segment",
    });



  if (error && (error.message || error.details || error.hint)) {
    console.error("❌ Failed to upsert surf outlook summaries:", error);
  } else {
    console.log(`✅ Cached ${payload.length} surf outlook summaries`);
  }
}
