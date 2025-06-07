import { supabase } from "./supabaseClient.ts";

export async function insertTideObservations(spot_slug: string, data: any[]) {
  if (!data.length) {
    console.warn("No tide data to insert.");
    return;
  }

  const payload = data.map(item => ({
    location_slug: spot_slug,
    timestamp: item.timestamp,
    tide_ft: item.tide_ft,
  }));

  const { error } = await supabase
    .from("tide_observation")
    .insert(payload, { onConflict: "location_slug,timestamp" });

  if (error) {
    console.error("❌ Failed to insert tide data:", error);
  }
}
