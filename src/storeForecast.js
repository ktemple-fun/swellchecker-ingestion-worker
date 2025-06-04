import { supabase } from './supabaseClient.js';

export async function storeForecast(slug, data) {
  const insertPayload = {
    slug: slug,
    waveHeight: parseFloat(data.waveHeight),
    wavePeriod: parseFloat(data.wavePeriod),
    windSpeed: parseFloat(data.windSpeed),
    windDirection: parseFloat(data.windDirection),
    observationTime: data.observationTime
  };

  console.log("Inserting forecast row:", insertPayload);

  const { error } = await supabase.from('forecast').insert(insertPayload);

  if (error) {
    console.error(`❌ Failed to insert forecast for ${slug}:`, error);
  } else {
    console.log(`✅ Forecast inserted for: ${slug}`);
  }
}
