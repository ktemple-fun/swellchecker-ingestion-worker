import { supabase } from './supabaseClient.js';
import { scoreForecast } from './scoreForecast.js';

export async function storeForecasts(slug, forecasts) {
  for (const row of forecasts) {
    const qualityResult = scoreForecast({
      wave_height: row.wave_height,
      wave_period: row.wave_period,
      wind_speed: row.wind_speed
    });

    const { error } = await supabase.from('forecast').upsert({
      slug,
      observation_time: row.observation_time,
      wave_height: row.wave_height,
      wave_period: row.wave_period,
      wind_speed: row.wind_speed,
      wind_direction: row.wind_direction,
      rawscore: qualityResult.rawScore,
      quality: qualityResult.quality
    }, { onConflict: ['slug', 'observation_time'] });

    if (error) console.error('Insert error:', error);
  }
}
