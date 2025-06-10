// import { supabase } from './supabaseClient.ts';

// interface ForecastEntry {
//   timestamp: string;
//   wave_height: number;
//   wave_period: number;
//   spot_slug: string;
// }

// interface OutlookSegment {
//   segment: string;
//   avg_wave_height: number;
//   avg_wave_period: number;
//   rating: 'Poor' | 'Fair' | 'Good';
// }

// export async function generateSurfOutlook(spotSlug: string): Promise<OutlookSegment[]> {
//   const now = new Date().toISOString();

//   const { data, error } = await supabase
//     .from('surf_ingestion_data')
//     .select('timestamp, wave_height, wave_period, spot_slug')
//     .eq('spot_slug', spotSlug)
//     .gte('timestamp', now)
//     .order('timestamp', { ascending: true });

//   if (error) {
//     console.error('❌ Error fetching forecast data:', error);
//     return [];
//   }

//   const outlookMap: Record<string, ForecastEntry[]> = {};

//   for (const entry of data || []) {
//     const dt = new Date(entry.timestamp);
//     const hour = dt.getUTCHours();
//     const dateStr = dt.toISOString().split('T')[0];
//     const partOfDay = hour >= 6 && hour < 12 ? 'AM' : hour >= 12 && hour < 18 ? 'PM' : null;

//     if (!partOfDay) continue;

//     const key = `${dateStr} ${partOfDay}`;
//     outlookMap[key] ||= [];
//     outlookMap[key].push(entry);
//   }

//   const results: OutlookSegment[] = [];

//   for (const [segment, entries] of Object.entries(outlookMap)) {
//     const avg_wave_height =
//       entries.reduce((sum, e) => sum + (e.wave_height || 0), 0) / entries.length;
//     const avg_wave_period =
//       entries.reduce((sum, e) => sum + (e.wave_period || 0), 0) / entries.length;

//     const rating =
//       avg_wave_height >= 1.5 && avg_wave_period >= 13
//         ? 'Good'
//         : avg_wave_height >= 1.0 && avg_wave_period >= 11
//         ? 'Fair'
//         : 'Poor';

//     results.push({
//       segment,
//       avg_wave_height: parseFloat(avg_wave_height.toFixed(2)),
//       avg_wave_period: parseFloat(avg_wave_period.toFixed(2)),
//       rating,
//     });
//   }

//   return results;
// }


// export async function cacheSurfOutlook(spot_slug: string, outlook: any[]) {
//   if (!outlook.length) return;

//   const payload = outlook.map((item) => ({
//     spot_slug,
//     segment: item.segment,
//     date: item.segment.split(' ')[0], // '2025-06-15'
//     part_of_day: item.segment.includes('AM') ? 'AM' : 'PM',
//     avg_wave_height: item.avg_wave_height,
//     avg_wave_period: item.avg_wave_period,
//     rating: item.rating,
//     updated_at: new Date().toISOString(),
//   }));

//   const { error } = await supabase
//     .from('surf_outlook_summaries')
//     .upsert(payload, { onConflict: ['spot_slug', 'segment'] });

//   if (error) {
//     console.error('❌ Failed to cache surf outlook:', error);
//   } else {
//     console.log(`✅ Cached ${payload.length} surf outlook summaries`);
//   }
// }

import { supabase } from './supabaseClient.ts';

interface ForecastEntry {
  timestamp: string;
  wave_height: number;
  wave_period: number;
  spot_slug: string;
}

interface OutlookSegment {
  segment: string;
  avg_wave_height: number;
  avg_wave_period: number;
  rating: 'Poor' | 'Fair' | 'Good';
  summary: string;
  quality: string;
}

function generateSummary(height: number, period: number, rating: string): string {
  return `Surf will be around ${height.toFixed(1)}m at ${period.toFixed(1)}s (${rating.toLowerCase()} conditions).`;
}

export async function generateSurfOutlook(spotSlug: string): Promise<OutlookSegment[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('surf_ingestion_data')
    .select('timestamp, wave_height, wave_period, spot_slug')
    .eq('spot_slug', spotSlug)
    .gte('timestamp', now)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('❌ Error fetching forecast data:', error);
    return [];
  }

  const outlookMap: Record<string, ForecastEntry[]> = {};

  for (const entry of data || []) {
    const dt = new Date(entry.timestamp);
    const hour = dt.getUTCHours();
    const dateStr = dt.toISOString().split('T')[0];
    const partOfDay = hour >= 6 && hour < 12 ? 'AM' : hour >= 12 && hour < 18 ? 'PM' : null;

    if (!partOfDay) continue;

    const key = `${dateStr} ${partOfDay}`;
    outlookMap[key] ||= [];
    outlookMap[key].push(entry);
  }

  const results: OutlookSegment[] = [];

  for (const [segment, entries] of Object.entries(outlookMap)) {
    const avg_wave_height =
      entries.reduce((sum, e) => sum + (e.wave_height || 0), 0) / entries.length;
    const avg_wave_period =
      entries.reduce((sum, e) => sum + (e.wave_period || 0), 0) / entries.length;

    const rating =
      avg_wave_height >= 1.5 && avg_wave_period >= 13
        ? 'Good'
        : avg_wave_height >= 1.0 && avg_wave_period >= 11
        ? 'Fair'
        : 'Poor';

    const summary = generateSummary(avg_wave_height, avg_wave_period, rating);
    const quality = rating; // You could split these later if needed

    results.push({
      segment,
      avg_wave_height: parseFloat(avg_wave_height.toFixed(2)),
      avg_wave_period: parseFloat(avg_wave_period.toFixed(2)),
      rating,
      summary,
      quality,
    });
  }

  return results;
}

export async function cacheSurfOutlook(spot_slug: string, outlook: OutlookSegment[]) {
  if (!outlook.length) return;

  const payload = outlook.map((item) => ({
    spot_slug,
    segment: item.segment,
    date: item.segment.split(' ')[0],
    part_of_day: item.segment.includes('AM') ? 'AM' : 'PM',
    avg_wave_height: item.avg_wave_height,
    avg_wave_period: item.avg_wave_period,
    rating: item.rating,
    summary: item.summary,
    quality: item.quality,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('surf_outlook_summaries')
    .upsert(payload, { onConflict: ['spot_slug', 'segment'] });

  if (error) {
    console.error('❌ Failed to cache surf outlook:', error);
  } else {
    console.log(`✅ Cached ${payload.length} surf outlook summaries`);
  }
}
