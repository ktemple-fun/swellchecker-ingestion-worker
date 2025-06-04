import { supabase } from './src/supabaseClient.js';

async function testInsert() {
  const { error } = await supabase.from('forecast').insert({
    slug: 'test-spot',
    waveHeight: 4.5,
    wavePeriod: 12,
    windSpeed: 5,
    windDirection: 250,
    observationTime: '2024-06-04 12:00:00'
  });

  if (error) {
    console.error("Insert error:", error);
  } else {
    console.log("✅ Inserted test forecast row");
  }
}

testInsert();
