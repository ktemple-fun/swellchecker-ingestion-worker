import { supabase } from '../../full-ingestion/lib/supabaseClient.ts';

interface TideRow {
  timestamp_utc: string;
  timestamp_pacific: string | null;
  tide_height: number;
}

export async function fetchTideForecast(
  tideStation: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from('tide_observation')
    .select('timestamp_utc, timestamp_pacific, tide_height')
    .eq('station_id', tideStation)
    .gte('timestamp_utc', `${startDate}T00:00:00Z`)
    .lte('timestamp_utc', `${endDate}T23:59:59Z`);

  if (error) {
    console.error('❌ fetchTideForecast error:', error.message);
    return [];
  }

  return (data as TideRow[]).map((row) => {
    const fallbackPacific = new Date(row.timestamp_utc).toISOString();
    return {
      timestamp_utc: row.timestamp_utc,
      timestamp_pacific: row.timestamp_pacific ?? fallbackPacific,
      tide_height: row.tide_height,
      tide_ft: row.tide_height, // alias
    };
  });
}
