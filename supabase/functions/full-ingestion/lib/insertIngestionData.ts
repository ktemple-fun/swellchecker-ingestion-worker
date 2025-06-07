import { supabase } from "./supabaseClient.ts";

export async function insertIngestionData(spot_slug: string, data: any[]) {
  if (!data.length) {
    console.warn("No ingestion data to insert.");
    return;
  }

  const payload = data.map(item => ({
    spot_slug,
    timestamp: item.timestamp,
    wave_height: item.wave_height,
    wave_period: item.wave_period,
    wave_direction: item.wave_direction,
    water_temp_c: item.water_temp_c,
    water_temp_f: item.water_temp_f,
  }));

  const { error } = await supabase
    .from("surf_ingestion_data")
    .insert(payload, { onConflict: "spot_slug,timestamp" });

  if (error) {
    console.error("❌ Failed to insert ingestion data:", error);
  }
}
