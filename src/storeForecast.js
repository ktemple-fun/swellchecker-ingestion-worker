const { supabase } = require('./supabaseClient');

export async function storeForecast(spotSlug, buoyData) {
  const { data: spot, error } = await supabase
    .from('surf_spots')
    .select('id')
    .eq('slug', spotSlug)
    .single();

  if (error || !spot) {
    console.error('Spot not found:', error);
    return;
  }

  await supabase.from('forecast_observations').insert({
    spot_id: spot.id,
    observation_time: new Date().toISOString(),
    wave_height: buoyData.waveHeight,
    wave_period: buoyData.wavePeriod,
    wind_speed: buoyData.windSpeed,
    wind_direction: buoyData.windDirection,
    source: 'NDBC',
  });

  console.log('✅ Forecast inserted for:', spotSlug);
}

module.exports = { storeForecast };
