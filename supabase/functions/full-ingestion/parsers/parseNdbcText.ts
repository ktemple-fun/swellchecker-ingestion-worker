
// export default function parseNdbcText(rawText: string) {

//   // convert meters to ft 

//   const metersToFeet = (m: number) => m * 3.28084;

//   const lines = rawText.split("\n");
//   const dataLines = lines.slice(2);  // skip headers

//   const parsed = dataLines.map(line => {
//     const parts = line.trim().split(/\s+/);
//     if (parts.length < 15) return null;

//     const [year, month, day, hour, minute] = parts;

//     const timestamp = new Date(
//       Number(year),
//       Number(month) - 1,
//       Number(day),
//       Number(hour),
//       Number(minute)
//     ).toISOString();

//     const waveHeight = parts[8];
//     const wavePeriod = parts[9];
//     const waveDirection = parts[11];
//     const waterTempC = parts[14];

//     return {
//       timestamp,
//       wave_height: waveHeight !== "MM" ? metersToFeet(parseFloat(waveHeight)) : null,
//       wave_period: wavePeriod !== "MM" ? parseFloat(wavePeriod) : null,
//       wave_direction: waveDirection !== "MM" ? parseInt(waveDirection) : null,
//       water_temp_c: waterTempC !== "MM" ? parseFloat(waterTempC) : null,
//       water_temp_f: waterTempC !== "MM" ? parseFloat(waterTempC) * 9/5 + 32 : null,
//     };
//   }).filter(Boolean);

//   return parsed;
// }

// parseNdbcText.ts
// parseNdbcText.ts
interface NdbcEntry {
  timestamp: string;
  timestampUtc: string;
  wave_height: number | null;
  wave_period: number | null;
  wave_direction: number | null;
  water_temp_c?: number | null;
  water_temp_f?: number | null;
}

export default function parseNdbcText(rawText: string): NdbcEntry[] {
  const metersToFeet = (m: number) => m * 3.28084;

  const lines = rawText.split("\n");
  const dataLines = lines.slice(2); // skip headers

  const parsed = dataLines.map(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 15) return null;

    const [YY, MM, DD, hh, mm, , , , WVHT, DPD, , MWD, , , WTMP] = parts;

    // Reject any row with missing time or core data
    if ([YY, MM, DD, hh, mm, WVHT, DPD, MWD].includes("MM")) return null;

    const year = parseInt(YY.length === 2 ? `20${YY}` : YY);
    const timestampObj = new Date(Date.UTC(year, Number(MM) - 1, Number(DD), Number(hh), Number(mm)));

    if (isNaN(timestampObj.getTime())) return null;

    return {
      timestamp: timestampObj.toISOString(),          // general field
      timestampUtc: timestampObj.toISOString(),       // required field for Supabase insert
      wave_height: WVHT !== "MM" ? metersToFeet(parseFloat(WVHT)) : null,
      wave_period: DPD !== "MM" ? parseFloat(DPD) : null,
      wave_direction: MWD !== "MM" ? parseInt(MWD) : null,
      water_temp_c: WTMP !== "MM" ? parseFloat(WTMP) : null,
      water_temp_f: WTMP !== "MM" ? parseFloat(WTMP) * 9 / 5 + 32 : null
    };
  }).filter((entry): entry is NdbcEntry => entry !== null);

  return parsed;
}
