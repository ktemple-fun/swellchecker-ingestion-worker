const { supabase } = require('./supabaseClient');

async function storeTide(spotSlug, tideData) {
  const { data: spot, error } = await supabase
    .from('surf_spots')
    .select('id')
    .eq('slug', spotSlug)
    .single();

  if (error || !spot) {
    console.error('Spot not found for tides:', error);
    return;
  }

  const rows = tideData.map(entry => ({
    spot_id: spot.id,
    observation_time: new Date(entry.time),
    tide_height: entry.height,
    source: 'NOAA'
  }));

  await supabase.from('tide_observations').insert(rows);
  console.log(`✅ Tides inserted for: ${spotSlug}`);
}

module.exports = { storeTide };
