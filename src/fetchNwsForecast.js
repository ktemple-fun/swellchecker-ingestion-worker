import fetch from 'node-fetch';

export async function fetchNwsForecast(lat, lon) {
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
    wind_speed: parseInt(period.windSpeed),
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
