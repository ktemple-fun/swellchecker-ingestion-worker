

import { supabase } from './supabaseClient.ts';

type Rating = 'Poor' | 'Poor+' | 'Fair' | 'Fair+' | 'Good';
type WindQuality = 'Offshore' | 'Onshore' | 'Sideshore';

interface ForecastEntry {
  timestamp: string;
  wave_height: number;
  wave_period: number;
  wind_speed_mps: number | null;
  wind_direction: number | null;
}

interface TideEntry {
  timestamp: string;
  tide_ft: number;
}

interface OutlookSegment {
  segment: string;
  avg_wave_height: number;
  avg_wave_period: number;
  avg_tide_ft: number | null;
  avg_wind_speed: number | null;
  avg_wind_direction: number | null;
  wind_quality: WindQuality;
  rating: Rating;
  summary: string;
}

function classifyRating(height: number, period: number): Rating {
  if (height >= 1.5 && period >= 13) return 'Good';
  if (height >= 1.2 && period >= 11) return 'Fair+';
  if (height >= 1.0 && period >= 10) return 'Fair';
  if (height >= 0.7 && period >= 8) return 'Poor+';
  return 'Poor';
}

function summarizeConditions(rating: Rating): string {
  switch (rating) {
    case 'Good': return 'Clean and consistent surf with solid sets.';
    case 'Fair+': return 'Decent surf with potential for fun sessions.';
    case 'Fair': return 'Rideable waves with mixed quality.';
    case 'Poor+': return 'Small waves, maybe fun for longboards.';
    case 'Poor': return 'Mostly flat or choppy — not ideal.';
  }
}

function getWindQuality(windDir: number | null, breakOrientation = 270): WindQuality {
  if (windDir === null) return 'Sideshore';
  const diff = Math.abs(windDir - breakOrientation) % 360;
  if (diff <= 45 || diff >= 315) return 'Offshore';
  if (diff >= 135 && diff <= 225) return 'Onshore';
  return 'Sideshore';
}

export async function generateSurfOutlook(spotSlug: string, breakOrientation = 270): Promise<OutlookSegment[]> {
  const now = new Date().toISOString();

  const { data: forecast } = await supabase
    .from('surf_ingestion_data')
    .select('timestamp, wave_height, wave_period, wind_speed_mps, wind_direction')
    .eq('spot_slug', spotSlug)
    .gte('timestamp', now);

  const { data: tide } = await supabase
    .from('tide_observation')
    .select('timestamp, tide_ft')
    .eq('location_slug', spotSlug)
    .gte('timestamp', now);

  if (!forecast?.length) {
    console.error('❌ No forecast data');
    return [];
  }

  const outlookMap: Record<string, ForecastEntry[]> = {};
  const tideMap: Record<string, number[]> = {};

  for (const entry of forecast) {
    const dt = new Date(entry.timestamp);
    const hour = dt.getUTCHours();
    const dateStr = dt.toISOString().split('T')[0];
    const part = hour >= 6 && hour < 12 ? 'AM' : hour >= 12 && hour < 18 ? 'PM' : null;
    if (!part) continue;
    const key = `${dateStr} ${part}`;
    outlookMap[key] ||= [];
    outlookMap[key].push(entry);
  }

  for (const t of tide || []) {
    const dt = new Date(t.timestamp);
    const hour = dt.getUTCHours();
    const dateStr = dt.toISOString().split('T')[0];
    const part = hour >= 6 && hour < 12 ? 'AM' : hour >= 12 && hour < 18 ? 'PM' : null;
    if (!part) continue;
    const key = `${dateStr} ${part}`;
    tideMap[key] ||= [];
    tideMap[key].push(t.tide_ft);
  }

  const results: OutlookSegment[] = [];

  for (const [segment, entries] of Object.entries(outlookMap)) {
    const wave_height = entries.reduce((sum, e) => sum + (e.wave_height || 0), 0) / entries.length;
    const wave_period = entries.reduce((sum, e) => sum + (e.wave_period || 0), 0) / entries.length;
    const tide_avg = tideMap[segment]?.length
      ? parseFloat((tideMap[segment].reduce((a, b) => a + b, 0) / tideMap[segment].length).toFixed(2))
      : null;

    const wind_speeds = entries.map(e => e.wind_speed_mps).filter(Boolean) as number[];
    const wind_dirs = entries.map(e => e.wind_direction).filter(Boolean) as number[];

    const wind_speed_avg = wind_speeds.length
      ? parseFloat((wind_speeds.reduce((a, b) => a + b, 0) / wind_speeds.length).toFixed(2))
      : null;

    const wind_dir_avg = wind_dirs.length
      ? parseFloat((wind_dirs.reduce((a, b) => a + b, 0) / wind_dirs.length).toFixed(0))
      : null;

    const wind_quality = getWindQuality(wind_dir_avg, breakOrientation);

    let rating = classifyRating(wave_height, wave_period);

    if (tide_avg != null) {
      if (tide_avg >= 2 && tide_avg <= 4 && rating === 'Fair') rating = 'Fair+';
      if ((tide_avg < 0.5 || tide_avg > 5) && rating === 'Fair+') rating = 'Fair';
    }

    if (wind_quality === 'Offshore') {
      if (rating === 'Fair+') rating = 'Good';
      else if (rating === 'Fair') rating = 'Fair+';
    } else if (wind_quality === 'Onshore') {
      if (rating === 'Fair+') rating = 'Fair';
      else if (rating === 'Fair') rating = 'Poor+';
    }

    results.push({
      segment,
      avg_wave_height: parseFloat(wave_height.toFixed(2)),
      avg_wave_period: parseFloat(wave_period.toFixed(2)),
      avg_tide_ft: tide_avg,
      avg_wind_speed: wind_speed_avg,
      avg_wind_direction: wind_dir_avg,
      wind_quality,
      rating,
      summary: summarizeConditions(rating),
    });
  }

  return results;
}
