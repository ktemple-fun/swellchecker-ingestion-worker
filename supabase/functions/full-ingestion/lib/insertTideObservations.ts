// import { supabase } from "./supabaseClient.ts";

// export async function insertTideObservations(spot_slug: string, data: any[]) {
//   if (!data.length) {
//     console.warn("No tide data to insert.");
//     return;
//   }

//   const payload = data.map(item => ({
//     location_slug: spot_slug,
//     timestamp: item.timestamp,
//     tide_ft: item.tide_ft,
//   }));

//   const { error } = await supabase
//     .from("tide_observation")
//     // .upsert(payload, { onConflict: "location_slug,timestamp" });
//     .upsert(payload, { onConflict: ["location_slug", "timestamp"] });

//   if (error && (error.message || error.details || error.hint)) {
//     console.error("❌ Failed to upsert tide data:", error);
//   }

// }

// insertTideObservations.ts


import { supabase } from './supabaseClient.ts';
import { toPacificTime } from './time.ts';

export async function insertTideObservations({
  station_id,
  observations
}: {
  station_id: string;
  observations: {
    timestampUtc: string;
    tideHeight: number;
  }[];
}) {
  if (!Array.isArray(observations) || observations.length === 0) {
    console.warn(`⚠️ No tide data to insert for station ${station_id}`);
    return;
  }

  const payload = observations.map((obs) => ({
    station_id,
    timestamp_utc: obs.timestampUtc,
    timestamp_pacific: toPacificTime(new Date(obs.timestampUtc)).toISOString(),
    tide_height: obs.tideHeight
  }));

  console.info(`📅 Inserting ${payload.length} tide observations for station ${station_id}`);

  const { error } = await supabase
    .from('tide_observation')
    .upsert(payload, {
      onConflict: ['station_id', 'timestamp_utc']
    });

  if (error) {
    console.error("[Supabase Tide Insert Error]", {
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }

}
