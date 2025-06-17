
// import { supabase } from './supabaseClient.ts';
// import { surfSpots } from '../config/surfSpots.ts';
// import fetchNdbcData from './fetchNdbcData.ts';


// type Rating = 'Poor' | 'Poor+' | 'Fair' | 'Fair+' | 'Good';
// type WindQuality = 'Offshore' | 'Onshore' | 'Sideshore';
// type Exposure = 'low' | 'medium' | 'high';
// type Bathymetry = 'shelf' | 'steep' | 'canyon';

// interface ForecastEntry {
//   timestamp: string;
//   wave_height: number;
//   wave_period: number;
//   wind_speed_mps: number | null;
//   wind_direction: number | null;
// }

// interface TideEntry {
//   timestamp: string;
//   tide_ft: number;
// }

// interface OutlookSegment {
//   segment: string;
//   avg_wave_height: number;
//   avg_wave_period: number;
//   avg_tide_ft: number | null;
//   avg_wind_speed: number | null;
//   avg_wind_direction: number | null;
//   wind_quality: WindQuality;
//   rating: Rating;
//   summary: string;
// }

// // Helpers

// function classifyRating(height: number, period: number): Rating {
//   if (height >= 5 && period >= 13) return 'Good';
//   if (height >= 4 && period >= 11) return 'Fair+';
//   if (height >= 3 && period >= 9) return 'Fair';
//   if (height >= 2 && period >= 7) return 'Poor+';
//   return 'Poor';
// }

// function summarizeConditions(rating: Rating): string {
//   switch (rating) {
//     case 'Good': return 'Clean and consistent surf with solid sets.';
//     case 'Fair+': return 'Decent surf with potential for fun sessions.';
//     case 'Fair': return 'Rideable waves with mixed quality.';
//     case 'Poor+': return 'Small waves, maybe fun for longboards.';
//     case 'Poor': return 'Mostly flat or choppy — not ideal.';
//   }
// }

// function getWindQuality(windDir: number | null, breakOrientation = 270): WindQuality {
//   if (windDir === null) return 'Sideshore';
//   const diff = Math.abs(windDir - breakOrientation) % 360;
//   if (diff <= 45 || diff >= 315) return 'Offshore';
//   if (diff >= 135 && diff <= 225) return 'Onshore';
//   return 'Sideshore';
// }

// function applyShoaling(heightFt: number): number {
//   return parseFloat((heightFt * 1.0).toFixed(2));
// }

// function applyExposureBoost(height: number, exposure: Exposure): number {
//   switch (exposure) {
//     case 'low': return height * 0.7;
//     case 'medium': return height * 0.9;
//     case 'high': return height;
//     default: return height;
//   }
// }

// function adjustRatingForBathymetry(rating: Rating, bathymetry: Bathymetry): Rating {
//   const order: Rating[] = ['Poor', 'Poor+', 'Fair', 'Fair+', 'Good'];
//   const index = order.indexOf(rating);
//   if (bathymetry === 'canyon' && index < order.length - 1) return order[index + 1];
//   if (bathymetry === 'shelf' && index > 0) return order[index - 1];
//   return rating;
// }

// export async function generateSurfOutlook(spotSlug: string): Promise<OutlookSegment[]> {
//   const now = new Date();
//   const spot = surfSpots.find((s) => s.slug === spotSlug);
//   if (!spot) return [];

//   const breakOrientation = spot.facingDirection;
//   const exposure = spot.exposure as Exposure;
//   const bathymetry = spot.bathymetry as Bathymetry;
//   const buoyStation = spot.buoy;

//   const [{ data: forecast }, { data: tide }, buoyRaw] = await Promise.all([
//     supabase
//       .from('surf_ingestion_data')
//       .select('timestamp, wave_height, wave_period, wind_speed_mps, wind_direction')
//       .eq('spot_slug', spotSlug)
//       // .gte('timestamp', now.toISOString())
//       .order('timestamp'),
//     supabase
//       .from('tide_observation')
//       .select('timestamp, tide_ft')
//       .eq('location_slug', spotSlug)
//       .gte('timestamp', now.toISOString()),
//     fetchNdbcData(buoyStation),
//   ]);

//   if (!forecast?.length) return [];

//   const outlookMap: Record<string, ForecastEntry[]> = {};
//   const tideMap: Record<string, number[]> = {};
//   const buoyMap: Record<string, number[]> = {};

//   // for (const entry of forecast) {
//   //   const dt = new Date(entry.timestamp);
//   //   const hour = dt.getUTCHours();
//   //   const dateStr = dt.toISOString().split('T')[0];
//   //   const part = hour >= 6 && hour < 12 ? 'AM' : hour >= 12 && hour < 18 ? 'PM' : null;
//   //   if (!part) continue;
//   //   const key = `${dateStr} ${part}`;
//   //   outlookMap[key] ||= [];
//   //   outlookMap[key].push(entry);
//   // }

//   for (const entry of forecast) {
//   const dt = new Date(entry.timestamp);
//   const hour = dt.getUTCHours();
//   const dateStr = dt.toISOString().split('T')[0];

//   // More inclusive fallback: AM = 0–11, PM = 12–23
//   const part = hour < 12 ? 'AM' : 'PM';

//   // Debug log to confirm what's being grouped
//   console.log('⏱ Forecast timestamp:', dt.toISOString(), '→ hour:', hour, '→ part:', part);

//   const key = `${dateStr} ${part}`;
//   outlookMap[key] ||= [];
//   outlookMap[key].push(entry);
// }


//   for (const t of tide || []) {
//     const dt = new Date(t.timestamp);
//     const hour = dt.getUTCHours();
//     const dateStr = dt.toISOString().split('T')[0];
//     const part = hour >= 6 && hour < 12 ? 'AM' : hour >= 12 && hour < 18 ? 'PM' : null;
//     if (!part) continue;
//     const key = `${dateStr} ${part}`;
//     tideMap[key] ||= [];
//     tideMap[key].push(t.tide_ft);
//   }

//   for (const b of buoyRaw || []) {
//     const dt = new Date(b.timestamp);
//     const hour = dt.getUTCHours();
//     const dateStr = dt.toISOString().split('T')[0];
//     const part = hour >= 6 && hour < 12 ? 'AM' : hour >= 12 && hour < 18 ? 'PM' : null;
//     if (!part) continue;
//     const key = `${dateStr} ${part}`;
//     buoyMap[key] ||= [];
//     buoyMap[key].push(b.wave_height);
//   }

//   const results: OutlookSegment[] = [];

//   for (const [segment, entries] of Object.entries(outlookMap)) {
//     const raw_wave_height = entries.reduce((sum, e) => sum + (e.wave_height || 0), 0) / entries.length;
//     const wave_period = entries.reduce((sum, e) => sum + (e.wave_period || 0), 0) / entries.length;

//     // let adjusted_wave_height = applyShoaling(raw_wave_height);
//     // adjusted_wave_height = applyExposureBoost(adjusted_wave_height, exposure);

//     function toFaceHeight(height: number, period: number, direction: number | null, spotOrientation: number): number {
//   const directionDiff = Math.abs((direction ?? spotOrientation) - spotOrientation) % 360;

//   const isFavorableDirection = directionDiff < 90 || directionDiff > 270;
//   const isLongPeriod = period >= 10;

//   if (!isFavorableDirection || !isLongPeriod) return 0;

//   // Use 1.7x to convert to face height
//   return parseFloat((height * 1.7).toFixed(2));
// }


//     const tide_avg = tideMap[segment]?.length
//       ? parseFloat((tideMap[segment].reduce((a, b) => a + b, 0) / tideMap[segment].length).toFixed(2))
//       : null;

//     const wind_speeds = entries.map(e => e.wind_speed_mps).filter(Boolean) as number[];
//     const wind_dirs = entries.map(e => e.wind_direction).filter(Boolean) as number[];

//     const wind_speed_avg = wind_speeds.length
//       ? parseFloat((wind_speeds.reduce((a, b) => a + b, 0) / wind_speeds.length).toFixed(2))
//       : null;

//     const wind_dir_avg = wind_dirs.length
//       ? parseFloat((wind_dirs.reduce((a, b) => a + b, 0) / wind_dirs.length).toFixed(0))
//       : null;

//     const wind_quality = getWindQuality(wind_dir_avg, breakOrientation);

//     let rating = classifyRating(adjusted_wave_height, wave_period);

//     if (tide_avg != null) {
//       if (tide_avg >= 2 && tide_avg <= 4 && rating === 'Fair') rating = 'Fair+';
//       if ((tide_avg < 0.5 || tide_avg > 5) && rating === 'Fair+') rating = 'Fair';
//     }

//     if (wind_quality === 'Offshore') {
//       if (rating === 'Fair+') rating = 'Good';
//       else if (rating === 'Fair') rating = 'Fair+';
//     } else if (wind_quality === 'Onshore') {
//       if (rating === 'Fair+') rating = 'Fair';
//       else if (rating === 'Fair') rating = 'Poor+';
//     }

//     rating = adjustRatingForBathymetry(rating, bathymetry);

//     results.push({
//       segment,
//       avg_wave_height: parseFloat(adjusted_wave_height.toFixed(2)),
//       avg_wave_period: parseFloat(wave_period.toFixed(2)),
//       avg_tide_ft: tide_avg,
//       avg_wind_speed: wind_speed_avg,
//       avg_wind_direction: wind_dir_avg,
//       wind_quality,
//       rating,
//       summary: summarizeConditions(rating),
//     });
//   }

//   return results;
// }


// import { supabase } from './supabaseClient.ts';
// import { surfSpots } from '../config/surfSpots.ts';
// import fetchNdbcData from './fetchNdbcData.ts';

// // Type definitions
// type Rating = 'Poor' | 'Poor+' | 'Fair' | 'Fair+' | 'Good';
// type WindQuality = 'Offshore' | 'Onshore' | 'Sideshore';
// type Exposure = 'low' | 'medium' | 'high';
// type Bathymetry = 'shelf' | 'steep' | 'canyon';

// interface ForecastEntry {
//   timestamp: string;
//   wave_height: number;
//   wave_period: number;
//   wind_speed_mps: number | null;
//   wind_direction: number | null;
// }

// interface TideEntry {
//   timestamp: string;
//   tide_ft: number;
// }

// interface OutlookSegment {
//   segment: string;
//   avg_wave_height: number;
//   avg_wave_period: number;
//   avg_tide_ft: number | null;
//   avg_wind_speed: number | null;
//   avg_wind_direction: number | null;
//   wind_quality: WindQuality;
//   rating: Rating;
//   summary: string;
// }

// // Helper functions
// function classifyRating(height: number, period: number): Rating {
//   if (height >= 5 && period >= 13) return 'Good';
//   if (height >= 4 && period >= 11) return 'Fair+';
//   if (height >= 3 && period >= 9) return 'Fair';
//   if (height >= 2 && period >= 7) return 'Poor+';
//   return 'Poor';
// }

// function summarizeConditions(rating: Rating): string {
//   switch (rating) {
//     case 'Good': return 'Clean and consistent surf with solid sets.';
//     case 'Fair+': return 'Decent surf with potential for fun sessions.';
//     case 'Fair': return 'Rideable waves with mixed quality.';
//     case 'Poor+': return 'Small waves, maybe fun for longboards.';
//     case 'Poor': return 'Mostly flat or choppy — not ideal.';
//   }
// }

// function getWindQuality(windDir: number | null, breakOrientation = 270): WindQuality {
//   if (windDir === null) return 'Sideshore';
//   const diff = Math.abs(windDir - breakOrientation) % 360;
//   if (diff <= 45 || diff >= 315) return 'Offshore';
//   if (diff >= 135 && diff <= 225) return 'Onshore';
//   return 'Sideshore';
// }

// function adjustRatingForBathymetry(rating: Rating, bathymetry: Bathymetry): Rating {
//   const order: Rating[] = ['Poor', 'Poor+', 'Fair', 'Fair+', 'Good'];
//   const index = order.indexOf(rating);
//   if (bathymetry === 'canyon' && index < order.length - 1) return order[index + 1];
//   if (bathymetry === 'shelf' && index > 0) return order[index - 1];
//   return rating;
// }

// function toFaceHeight(
//   height: number,
//   period: number,
//   direction: number | null,
//   spotOrientation: number
// ): number {
//   const directionDiff = Math.abs((direction ?? spotOrientation) - spotOrientation) % 360;
//   const isFavorableDirection = directionDiff < 90 || directionDiff > 270;
//   const isLongPeriod = period >= 10;
//   if (!isFavorableDirection || !isLongPeriod) return 0;
//   return parseFloat((height * 1.7).toFixed(2));
// }




// // export async function generateSurfOutlook(spotSlug: string): Promise<OutlookSegment[]> {
// //   const now = new Date();
// //   const spot = surfSpots.find((s) => s.slug === spotSlug);
// //   if (!spot) return [];

// //   const breakOrientation = spot.facingDirection;
// //   const exposure = spot.exposure as Exposure;
// //   const bathymetry = spot.bathymetry as Bathymetry;
// //   const buoyStation = spot.buoy;

// //   const [{ data: forecast }, { data: tide }, buoyRaw] = await Promise.all([
// //     supabase
// //       .from('surf_ingestion_data')
// //       .select('timestamp, wave_height, wave_period, wind_speed_mps, wind_direction')
// //       .eq('spot_slug', spotSlug)
// //       .order('timestamp'),
// //     supabase
// //       .from('tide_observation')
// //       .select('timestamp, tide_ft')
// //       .eq('location_slug', spotSlug)
// //       .gte('timestamp', now.toISOString()),
// //     fetchNdbcData(buoyStation),
// //   ]);

// //   if (!forecast?.length) return [];

// //   const outlookMap: Record<string, ForecastEntry[]> = {};
// //   const tideMap: Record<string, number[]> = {};
// //   const buoyMap: Record<string, number[]> = {};

// //   for (const entry of forecast) {
// //     const dt = new Date(entry.timestamp);
// //     const hour = dt.getUTCHours();
// //     const dateStr = dt.toISOString().split('T')[0];
// //     const part = hour < 12 ? 'AM' : 'PM';
// //     const key = `${dateStr} ${part}`;
// //     outlookMap[key] ||= [];
// //     outlookMap[key].push(entry);
// //   }

// //   for (const t of tide || []) {
// //     const dt = new Date(t.timestamp);
// //     const hour = dt.getUTCHours();
// //     const dateStr = dt.toISOString().split('T')[0];
// //     const part = hour >= 6 && hour < 12 ? 'AM' : hour >= 12 && hour < 18 ? 'PM' : null;
// //     if (!part) continue;
// //     const key = `${dateStr} ${part}`;
// //     tideMap[key] ||= [];
// //     tideMap[key].push(t.tide_ft);
// //   }

// //   for (const b of buoyRaw || []) {
// //     const dt = new Date(b.timestamp);
// //     const hour = dt.getUTCHours();
// //     const dateStr = dt.toISOString().split('T')[0];
// //     const part = hour >= 6 && hour < 12 ? 'AM' : hour >= 12 && hour < 18 ? 'PM' : null;
// //     if (!part) continue;
// //     const key = `${dateStr} ${part}`;
// //     buoyMap[key] ||= [];
// //     buoyMap[key].push(b.wave_height);
// //   }

// //   const results: OutlookSegment[] = [];

// //   for (const [segment, entries] of Object.entries(outlookMap)) {
// //     const wave_period = entries.reduce((sum, e) => sum + (e.wave_period || 0), 0) / entries.length;

// //     const faceHeights = entries
// //       .map(e => toFaceHeight(e.wave_height, e.wave_period, e.wind_direction, breakOrientation))
// //       .filter(h => h > 0);

// //     const avgFaceHeight = faceHeights.length
// //       ? parseFloat((faceHeights.reduce((a, b) => a + b, 0) / faceHeights.length).toFixed(2))
// //       : 0;

// //     const tide_avg = tideMap[segment]?.length
// //       ? parseFloat((tideMap[segment].reduce((a, b) => a + b, 0) / tideMap[segment].length).toFixed(2))
// //       : null;

// //     const wind_speeds = entries.map(e => e.wind_speed_mps).filter(Boolean) as number[];
// //     const wind_dirs = entries.map(e => e.wind_direction).filter(Boolean) as number[];

// //     const wind_speed_avg = wind_speeds.length
// //       ? parseFloat((wind_speeds.reduce((a, b) => a + b, 0) / wind_speeds.length).toFixed(2))
// //       : null;

// //     const wind_dir_avg = wind_dirs.length
// //       ? parseFloat((wind_dirs.reduce((a, b) => a + b, 0) / wind_dirs.length).toFixed(0))
// //       : null;

// //     const wind_quality = getWindQuality(wind_dir_avg, breakOrientation);

// //     let rating = classifyRating(avgFaceHeight, wave_period);

// //     if (tide_avg != null) {
// //       if (tide_avg >= 2 && tide_avg <= 4 && rating === 'Fair') rating = 'Fair+';
// //       if ((tide_avg < 0.5 || tide_avg > 5) && rating === 'Fair+') rating = 'Fair';
// //     }

// //     if (wind_quality === 'Offshore') {
// //       if (rating === 'Fair+') rating = 'Good';
// //       else if (rating === 'Fair') rating = 'Fair+';
// //     } else if (wind_quality === 'Onshore') {
// //       if (rating === 'Fair+') rating = 'Fair';
// //       else if (rating === 'Fair') rating = 'Poor+';
// //     }

// //     rating = adjustRatingForBathymetry(rating, bathymetry);

// //     results.push({
// //       segment,
// //       avg_wave_height: avgFaceHeight,
// //       avg_wave_period: parseFloat(wave_period.toFixed(2)),
// //       avg_tide_ft: tide_avg,
// //       avg_wind_speed: wind_speed_avg,
// //       avg_wind_direction: wind_dir_avg,
// //       wind_quality,
// //       rating,
// //       summary: summarizeConditions(rating),
// //     });
// //   }

// //   return results;
// // }



// generateSurfOutlook.ts (updated for accurate timestamp handling)

// import { toPacificTime } from './time.ts';
// import { groupForecastByDayPart } from './groupForecastByDayPart.ts';
// import { fetchSwellForecast } from '../parsers/fetchSwellForecast.ts';
// import { fetchWindForecast } from '../parsers/fetchWindForecast.ts';
// import { modelAndFilterSwells } from './modelAndFilterSwells.ts';

// export async function generateSurfOutlook(spot: any) {
//   if (!spot || !spot.lat || !spot.lng) {
//     console.error("❌ Invalid spot passed to generateSurfOutlook:", spot);
//     return;
//   }

//   const swellData = await fetchSwellForecast(spot);
//   const windData = await fetchWindForecast(spot);

//   const swellByHour = swellData.map(item => {
//     const localTime = toPacificTime(new Date(item.timestamp));
//     return {
//       hour: localTime.getHours(),
//       day: localTime.toISOString().split('T')[0],
//       height: modelAndFilterSwells(item.components),
//       timestamp: item.timestamp,
//     };
//   });

//   const windByHour = windData.map(item => {
//     const localTime = toPacificTime(new Date(item.timestamp));
//     return {
//       hour: localTime.getHours(),
//       day: localTime.toISOString().split('T')[0],
//       speed: item.windSpeed,
//       direction: item.windDirection,
//       timestamp: item.timestamp,
//     };
//   });

//   const outlook = groupForecastByDayPart({ swellByHour, windByHour });

//   return outlook;
// }



// lib/generateSurfOutlook.ts

// import { toPacificTime } from './time.ts';
// import { groupForecastByDayPart } from './groupForecastByDayPart.ts';
// import { fetchSwellForecast } from '../parsers/fetchSwellForecast.ts';
// import { fetchWindForecast } from '../parsers/fetchWindForecast.ts';
// import { modelAndFilterSwells } from './modelAndFilterSwells.ts';
// import { normalizeTimestampToHour } from './normalizeTimestampToHour.ts';



// interface SpotMeta {
//   slug: string;
//   lat: number;
//   lng: number;
//   optimalSwellDir: number;
//   minPeriod?: number;
//   minHeight?: number;
// }

// export async function generateSurfOutlook({ spot }: { spot: SpotMeta }) {

//   const now = new Date();
// const start = now.toISOString();
// const end = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(); 

//   const { lat, lng } = spot;

//   const swellData = await fetchSwellForecast({ lat, lng, start, end });
//   const windData = await fetchWindForecast(lat, lng);

//   const filteredSwells = modelAndFilterSwells(swellData, spot);

//   const swellByHour = filteredSwells.map(entry => {
//     const localTime = toPacificTime(new Date(entry.timestamp));
//     return {
//       hour: localTime.getHours(),
//       day: localTime.toISOString().split('T')[0],
//       height: entry.wave_height!,
//       timestamp: entry.timestamp,
//     };
//   });

//   const windByHour = windData.map(entry => {
//     const localTime = toPacificTime(new Date(entry.timestamp));
//     return {
//       hour: localTime.getHours(),
//       day: localTime.toISOString().split('T')[0],
//       speed: entry.windSpeed,
//       direction: entry.windDirection,
//       timestamp: entry.timestamp,
//     };
//   });

//   const outlook = groupForecastByDayPart({ swellByHour, windByHour });

//   return outlook;
// }



import { toPacificTime } from './time.ts';
import { groupForecastByDayPart } from './groupForecastByDayPart.ts';
import { fetchSwellForecast } from '../parsers/fetchSwellForecast.ts';
import { fetchWindForecast } from '../parsers/fetchWindForecast.ts';
import { modelAndFilterSwells } from './modelAndFilterSwells.ts';
import { normalizeTimestampToHour } from './normalizeTimestampToHour.ts';

interface SpotMeta {
  slug: string;
  lat: number;
  lng: number;
  optimalSwellDir: number;
  minPeriod?: number;
  minHeight?: number;
}

export async function generateSurfOutlook({ spot }: { spot: SpotMeta }) {
  const { lat, lng } = spot;

  // 🔥 Add these lines
  const now = new Date();
  const start = now.toISOString();
  const end = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  const swellData = await fetchSwellForecast({ lat, lng, start, end });
  const windData = await fetchWindForecast(lat, lng, start, end); // ✅ Now valid

  const filteredSwells = modelAndFilterSwells(swellData, spot);

const swellByHour: SwellEntry[] = swellData.map(entry => {
  const localTime = toPacificTime(new Date(entry.timestamp)); // adjust to PT
  return {
    hour: localTime.getHours(),
    day: localTime.toISOString().split('T')[0],
    height: entry.wave_height!,
    timestamp: entry.timestamp,
    localTimeISO: localTime.toISOString(),
  };
});



const windByHour = windData.map(entry => {
  const localTime = toPacificTime(new Date(entry.timestamp));
  return {
    hour: localTime.getHours(),
    day: localTime.toISOString().slice(0, 10), // YYYY-MM-DD
    speed: entry.wind_speed_mps,
    direction: entry.wind_direction,
    timestamp: entry.timestamp,
  };
});


console.log(`[generateSurfOutlook] ${spot.slug} start=${start} end=${end}`);

  const outlook = groupForecastByDayPart({ swellByHour, windByHour });

  const outlookWithTimestamps = outlook.map(block => {
  // Find matching swell entry by day + AM/PM
  const match = swellByHour.find(sw =>
    sw.day === block.date && (sw.hour < 12 ? 'AM' : 'PM') === block.dayPart
  );

  return {
    ...block,
    timestamp_pacific: match?.localTimeISO ?? null,
    timestamp_utc: match?.timestamp ?? null,
  };
});
return outlookWithTimestamps;


 
}
