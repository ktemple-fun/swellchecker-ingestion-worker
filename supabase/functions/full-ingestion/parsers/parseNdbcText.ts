export default function parseNdbcText(rawText: string) {
  const lines = rawText.split("\n");
  const dataLines = lines.slice(2);  // skip headers

  const parsed = dataLines.map(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 14) return null;

    const [
      year, month, day, hour, minute,
      waveHeight, wavePeriod, waveDirection,
      , , , , waterTempC
    ] = parts;

    const timestamp = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    ).toISOString();

    return {
      timestamp,
      wave_height: parseFloat(waveHeight),
      wave_period: parseFloat(wavePeriod),
      wave_direction: parseInt(waveDirection),
      water_temp_c: waterTempC !== "MM" ? parseFloat(waterTempC) : null,
      water_temp_f: waterTempC !== "MM" ? parseFloat(waterTempC) * 9/5 + 32 : null,
    };
  }).filter(Boolean);

  return parsed;
}
