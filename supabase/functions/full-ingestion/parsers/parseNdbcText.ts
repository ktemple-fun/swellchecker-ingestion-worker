
export default function parseNdbcText(rawText: string) {

  // convert meters to ft 
  
  const metersToFeet = (m: number) => m * 3.28084;

  const lines = rawText.split("\n");
  const dataLines = lines.slice(2);  // skip headers

  const parsed = dataLines.map(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 15) return null;

    const [year, month, day, hour, minute] = parts;

    const timestamp = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    ).toISOString();

    const waveHeight = parts[8];
    const wavePeriod = parts[9];
    const waveDirection = parts[11];
    const waterTempC = parts[14];

    return {
      timestamp,
      wave_height: waveHeight !== "MM" ? metersToSurfFaceFeet(parseFloat(waveHeight)) : null,
      wave_period: wavePeriod !== "MM" ? parseFloat(wavePeriod) : null,
      wave_direction: waveDirection !== "MM" ? parseInt(waveDirection) : null,
      water_temp_c: waterTempC !== "MM" ? parseFloat(waterTempC) : null,
      water_temp_f: waterTempC !== "MM" ? parseFloat(waterTempC) * 9/5 + 32 : null,
    };
  }).filter(Boolean);

  return parsed;
}
