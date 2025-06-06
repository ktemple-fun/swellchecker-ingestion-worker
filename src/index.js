import { supabase } from './supabaseClient.js';
import spots from './spots.js';
import fetch from 'node-fetch';

export async function fetchNoaaForecast(lat, lon) {
  const metaRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, {
    headers: { 'User-Agent': 'SwellChecker/1.0' }
  });

  const meta = await metaRes.json();
  const forecastHourlyUrl = meta.properties.forecastHourly;

  const forecastRes = await fetch(forecastHourlyUrl, {
    headers: { 'User-Agent': 'SwellChecker/1.0' }
  });

  const forecastData = await forecastRes.json();

  return forecastData.properties.periods.map(period => ({
    observation_time: period.startTime,
    wind_speed: parseInt(period.windSpeed.split(' ')[0]),
    wind_direction: compassToDegrees(period.windDirection)
  }));
}

function compassToDegrees(dir) {
  const map = {
    N: 0, NNE: 22, NE: 45, ENE: 68, E: 90, ESE: 112, SE: 135, SSE: 158,
    S: 180, SSW: 202, SW: 225, WSW: 248, W: 270, WNW: 292, NW: 315, NNW: 338
  };
  return map[dir] ?? 0;
}


function parseWaveHeight(str) {
  if (!str) return null;
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function parsePeriod(str) {
  if (!str) return null;
  const match = str.match(/(\d+)\s*ft\s+(\d+)/);
  return match ? parseInt(match[2]) : null;
}

function parseWindSpeed(str) {
  if (!str) return null;
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function parseWindDirection(str) {
  const compass = {
    N: 0, NNE: 22, NE: 45, ENE: 68, E: 90, ESE: 112, SE: 135, SSE: 158,
    S: 180, SSW: 202, SW: 225, WSW: 248, W: 270, WNW: 292, NW: 315, NNW: 338
  };
  return compass[str] ?? 0;
}

async function main() {
  for (const spot of spots) {
    try {
      const forecasts = await fetchNoaaForecast(spot.lat, spot.lon);
      for (const row of forecasts) {
        const { error } = await supabase.from('forecast').upsert({
          slug: spot.slug,
          observation_time: row.observation_time,
          wave_height: row.wave_height,
          wave_period: row.wave_period,
          wind_speed: row.wind_speed,
          wind_direction: row.wind_direction
        }, { onConflict: ['slug', 'observation_time'] });

        if (error) console.error('Insert error:', error);
      }
      console.log(`✅ Ingested forecast for ${spot.slug}`);
    } catch (err) {
      console.error(`Error for ${spot.slug}:`, err);
    }
  }
}

main();
