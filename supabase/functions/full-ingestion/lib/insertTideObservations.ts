// lib/insertTideObservations.ts
import { supabase } from './supabaseClient.ts';

interface TideRow {
  station_id        : string;
  location_slug     : string;
  timestamp_utc     : string;  // ISO, Z suffix
  timestamp_pacific : string;  // ISO, local
  height_ft         : number;
}

/**
 * Upsert hourly tide observations or predictions.
 */
export async function insertTideObservations({
  station_id,
  location_slug,
  observations,
}: {
  station_id: string;
  location_slug: string;
  observations: TideRow[];
}) {
  if (!Array.isArray(observations) || observations.length === 0) {
    console.warn(`⚠️ No tide data to insert for station ${station_id}`);
    return;
  }

  const payload = observations.map((obs) => ({
    station_id,
    location_slug,
    timestamp_utc     : obs.timestamp_utc,
    timestamp_pacific : obs.timestamp_pacific,
    tide_height       : obs.height_ft,
    timestamp         : obs.timestamp_utc,  // legacy compatibility
  }));

  console.info(`📅 Inserting ${payload.length} tide observations for ${location_slug} (${station_id})`);

  const { error } = await supabase
    .from('tide_observation')
    .upsert(payload, {
      onConflict: 'station_id,timestamp_utc',
    });

  if (error) {
    console.error('[Supabase Tide Insert Error]', {
      message : error.message,
      details : error.details,
      hint    : error.hint,
    });
  }
}
