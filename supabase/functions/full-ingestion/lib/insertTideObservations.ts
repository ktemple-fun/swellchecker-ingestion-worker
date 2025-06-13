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
    // .upsert(payload, { onConflict: "location_slug,timestamp" });
    .upsert(payload, { onConflict: ["location_slug", "timestamp"] });

  if (error && (error.message || error.details || error.hint)) {
    console.error("❌ Failed to upsert tide data:", error);
  }

}
