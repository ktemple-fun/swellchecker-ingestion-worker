
import { supabase } from './supabaseClient.ts';


interface TideRow {
  station_id      : string;
  timestamp_utc    : string;  // ISO, Z suffix
  timestamp_pacific: string;  // ISO, local
  height_ft       : number;
}

/**
 * Upsert hourly tide predictions or observations.
 */
export async function insertTideObservations({
  station_id,
  observations,
}: {
  station_id: string;
  observations: TideRow[];
}) {
  if (!Array.isArray(observations) || observations.length === 0) {
    console.warn(`⚠️ No tide data to insert for station ${station_id}`);
    return;
  }

  const payload = observations.map((obs) => ({
    station_id,
    timestamp_utc    : obs.timestamp_utc,
    timestamp_pacific: obs.timestamp_pacific,
    tide_height      : obs.height_ft,      // DB column stays “tide_height”
  }));

  console.info(`📅 Inserting ${payload.length} tide observations for station ${station_id}`);

  const { error } = await supabase
    .from('tide_observation')
    .upsert(payload, { onConflict: 'station_id,timestamp_utc' });

  if (error) {
    console.error('[Supabase Tide Insert Error]', {
      message : error.message,
      details : error.details,
      hint    : error.hint,
    });
  }
}
