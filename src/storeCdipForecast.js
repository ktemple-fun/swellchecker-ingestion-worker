const { supabase } = require('./supabaseClient');

async function storeCdipForecast(spotSlug, forecastData) {
  const { data: spot, error } = await supabase
    .from('surf_spots')
    .select('id')
    .eq('slug', spotSlug)
    .single();

  if (error || !spot) {
    console.error('Spot not found for CDIP forecast:', error);
    return;
  }

  const rows = forecastData.map(entry => ({
    spot_id: spot.id,
    forecast_time: new Date(entry.forecast_time),
    wave_height: entry.wave_height,
    peak_period: entry.peak_period,
    mean_direction: entry.mean_direction,
    source: 'CDIP'
  }));

  await supabase.from('cdip_forecast_observations').insert(rows);
  console.log(`✅ CDIP Forecast inserted for: ${spotSlug}`);
}

module.exports = { storeCdipForecast };
