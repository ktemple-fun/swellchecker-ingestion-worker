import { supabase } from './supabaseClient.js';

export async function storeForecast(slug, data) {
  const insertPayload = {
    slug: slug,
    wave_height: parseFloat(data.waveHeight),
    wave_period: parseFloat(data.wavePeriod),
    wind_speed: parseFloat(data.windSpeed),
    wind_direction: parseFloat(data.windDirection),
    observation_time: data.observationTime
  };

  console.log("Inserting forecast row:", insertPayload);

  const { error } = await supabase.from('forecast').insert(insertPayload);

  if (error) {
    console.error(`❌ Failed to insert forecast for ${slug}:`, error);
  } else {
    console.log(`✅ Forecast inserted for: ${slug}`);
  }
}
