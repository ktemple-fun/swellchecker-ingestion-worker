export async function fetchBuoyData(buoyId) {
  const url = `https://www.ndbc.noaa.gov/data/realtime2/${buoyId}.txt`;

  const response = await fetch(url);
  const text = await response.text();

  const lines = text
    .trim()
    .split('\n')
    .filter((line) => !line.startsWith('#'));

  const values = lines[0].split(/\s+/);

  return {
    observationTime: `${values[2]}/${values[1]} ${values[3]}:${values[4]} UTC`,
    waveHeight: values[8],
    wavePeriod: values[9],
    windSpeed: values[10],
    windDirection: values[11]
  };
}
