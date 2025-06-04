const fetch = require('node-fetch');

export async function fetchCdipForecast() {
  const url = 'https://cdip.ucsd.edu/data_access/forecast_point/073p1/latest/wave.dat';
  const res = await fetch(url);
  const text = await res.text();

  const lines = text
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .slice(0, 48); // limit to 48 hourly records

  return lines.map(line => {
    const [yyyymmddhh, waveHeight, peakPeriod, meanDirection] = line.trim().split(/\s+/);
    const year = yyyymmddhh.slice(0, 4);
    const month = yyyymmddhh.slice(4, 6);
    const day = yyyymmddhh.slice(6, 8);
    const hour = yyyymmddhh.slice(8, 10);

    return {
      forecast_time: `${year}-${month}-${day}T${hour}:00:00Z`,
      wave_height: parseFloat(waveHeight),
      peak_period: parseFloat(peakPeriod),
      mean_direction: parseFloat(meanDirection)
    };
  });
}

module.exports = { fetchCdipForecast };
