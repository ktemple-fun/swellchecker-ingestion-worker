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

interface TideEntry {
  timestamp: string;
  tide_ft: number;
}

interface OutlookSegment {
  segment: string;
  avg_wave_height: number;
  avg_wave_period: number;
  tide_min_ft?: number;
  tide_max_ft?: number;
  rating: 'Poor' | 'Fair' | 'Good';
}

export async function generateSurfOutlook(spotSlug: string): Promise<OutlookSegment[]> {
  const now = new Date();
  const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const nowISO = now.toISOString();
  const futureISO = future.toISOString();

  // 1. Fetch wave forecast
  const { data: waveData, error: waveError } = await supabase
    .from('surf_ingestion_data')
    .select('timestamp, wave_height, wave_period')
    .eq('spot_slug', spotSlug)
    .gte('timestamp', nowISO)
    .lte('timestamp', futureISO)
    .order('timestamp', { ascending: true });

  if (waveError) {
    console.error('❌ Error fetching wave data:', waveError);
    return [];
  }

  // 2. Fetch tide data
  const { data: tideData, error: tideError } = await supabase
    .from('tide_observation')
    .select('timestamp, tide_ft')
    .eq('spot_slug', spotSlug)
    .gte('timestamp', nowISO)
    .lte('timestamp', futureISO);

  if (tideError) {
    console.error('❌ Error fetching tide data:', tideError);
  }

  const outlookMap: Record<string, ForecastEntry[]> = {};

  for (const entry of waveData || []) {
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

    const [date, part] = segment.split(' ');
    const segmentStart = new Date(`${date}T${part === 'AM' ? '06:00:00Z' : '12:00:00Z'}`);
    const segmentEnd = new Date(`${date}T${part === 'AM' ? '12:00:00Z' : '18:00:00Z'}`);

    let tide_min_ft: number | null = null;
    let tide_max_ft: number | null = null;

    if (tideData) {
      const tideSegment = tideData.filter((t: TideEntry) => {
        const tTime = new Date(t.timestamp);
        return tTime >= segmentStart && tTime < segmentEnd;
      });

      const tideValues = tideSegment.map(t => t.tide_ft);
      if (tideValues.length) {
        tide_min_ft = Math.min(...tideValues);
        tide_max_ft = Math.max(...tideValues);
      }
    }

    const rating =
      avg_wave_height >= 1.5 && avg_wave_period >= 13
        ? 'Good'
        : avg_wave_height >= 1.0 && avg_wave_period >= 11
        ? 'Fair'
        : 'Poor';

    results.push({
      segment,
      avg_wave_height: parseFloat(avg_wave_height.toFixed(2)),
      avg_wave_period: parseFloat(avg_wave_period.toFixed(2)),
      tide_min_ft: tide_min_ft != null ? parseFloat(tide_min_ft.toFixed(2)) : undefined,
      tide_max_ft: tide_max_ft != null ? parseFloat(tide_max_ft.toFixed(2)) : undefined,
      rating,
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
//   summary: string;
//   quality: string;
// }

// function generateSummary(height: number, period: number, rating: string): string {
//   return `Surf will be around ${height.toFixed(1)}m at ${period.toFixed(1)}s (${rating.toLowerCase()} conditions).`;
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

//     const summary = generateSummary(avg_wave_height, avg_wave_period, rating);
//     const quality = rating; // You could split these later if needed

//     results.push({
//       segment,
//       avg_wave_height: parseFloat(avg_wave_height.toFixed(2)),
//       avg_wave_period: parseFloat(avg_wave_period.toFixed(2)),
//       rating,
//       summary,
//       quality,
//     });
//   }

//   return results;
// }

// export async function cacheSurfOutlook(spot_slug: string, outlook: OutlookSegment[]) {
//   if (!outlook.length) return;

//   const payload = outlook.map((item) => ({
//     spot_slug,
//     segment: item.segment,
//     date: item.segment.split(' ')[0],
//     part_of_day: item.segment.includes('AM') ? 'AM' : 'PM',
//     avg_wave_height: item.avg_wave_height,
//     avg_wave_period: item.avg_wave_period,
//     rating: item.rating,
//     summary: item.summary,
//     quality: item.quality,
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
