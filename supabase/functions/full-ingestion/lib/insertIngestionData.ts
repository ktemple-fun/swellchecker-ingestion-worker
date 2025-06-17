// import { supabase } from "./supabaseClient.ts";

// export async function insertIngestionData(spot_slug: string, data: any[], source: 'forecast' | 'buoy') {
//   if (!data.length) {
//     console.warn("No ingestion data to insert.");
//     return;
//   }

//   const payload = data.map(item => ({
//     spot_slug,
//     timestamp: item.timestamp,
//     wave_height: item.wave_height,
//     wave_period: item.wave_period,
//     wave_direction: item.wave_direction,
//     water_temp_c: item.water_temp_c ?? null,
//     water_temp_f: item.water_temp_f ?? null,
//     wind_speed_mps: item.wind_speed_mps ?? null,
//     wind_direction: item.wind_direction ?? null,
//     source,
//   }));


//   const { error } = await supabase
//     .from("surf_ingestion_data")
//     .upsert(payload, { onConflict: ["timestamp", "spot_slug", "source"] });

//   if (error && (error.message || error.details || error.hint)) {
//     console.error("❌ Failed to upsert ingestion data:", error);
//   }
// }
// insertIngestionData.ts



import { supabase } from './supabaseClient.ts';

export async function insertIngestionData(
  spot_slug: string,
  data: any[],
  source: 'buoy' | 'forecast'
) {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn(`⚠️ Skipping insertIngestionData for ${spot_slug}: no valid rows`);
    return;
  }

  const payload = data.map((entry) => ({
    spot_slug,
    source,
    ...entry, // assumes entry has 'timestamp'
  }));

  const sample = payload[0];
  if (!sample.timestamp) {
    console.error(`❌ insertIngestionData: missing 'timestamp' in payload sample:`, sample);
    return;
  }

  const { error } = await supabase
    .from('surf_ingestion_data')
    .upsert(payload, {
      onConflict: ['timestamp', 'spot_slug', 'source'],
    });

  if (error && (error.message || error.details || error.hint)) {
    console.error(`❌ Failed to upsert ingestion data for ${spot_slug} - ${source}:`, {
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }
}
