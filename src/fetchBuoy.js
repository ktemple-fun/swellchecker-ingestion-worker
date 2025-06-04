const fetch = require('node-fetch');

export async function fetchBuoyData(buoyId) {
  const url = `https://www.ndbc.noaa.gov/data/realtime2/${buoyId}.txt`;
  const res = await fetch(url);
  const text = await res.text();

  const lines = text.trim().split('\n').filter(line => !line.startsWith('#'));
  const values = lines[0].split(/\s+/);

  return {
    observationTime: `${values[2]}/${values[1]} ${values[3]}:${values[4]} UTC`,
    waveHeight: parseFloat(values[8]),
    wavePeriod: parseFloat(values[9]),
    windSpeed: parseFloat(values[10]),
    windDirection: parseFloat(values[11]),
  };
}

module.exports = { fetchBuoyData };

module.exports = { fetchBuoyData };

