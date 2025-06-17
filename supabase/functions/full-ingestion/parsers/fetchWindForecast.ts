

// export default async function fetchWindForecast(lat: number, lng: number, startISO: string, endISO: string) {
//   const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
//     `&hourly=wind_speed_10m,wind_direction_10m` +
//     `&start_date=${startISO.slice(0, 10)}&end_date=${endISO.slice(0, 10)}&timezone=UTC`;

//   try {
//     const res = await fetch(url);
//     if (!res.ok) {
//       const message = await res.text();
//       console.error(`❌ Wind fetch failed: ${res.status} - ${message}`);
//       return [];
//     }

//     const json = await res.json();
//     const { time, wind_speed_10m, wind_direction_10m } = json.hourly;

//     if (!time?.length || !wind_speed_10m?.length) {
//       console.warn("⚠️ No hourly wind data returned.");
//       return [];
//     }

//     return time.map((timestamp: string, i: number) => ({
//       timestamp,
//       wind_speed_mps: wind_speed_10m[i],
//       wind_direction: wind_direction_10m?.[i] ?? null,
//     }));
//   } catch (err) {
//     console.error("❌ Error fetching wind forecast:", err);
//     return [];
//   }
// }


// fetchWindForecast.ts (ensures timestamp normalization)

// fetchWindForecast.ts
export async function fetchWindForecast(
  lat: number,
  lng: number,
  start: string,
  end: string
) {
  // Defensive check for missing inputs
  if (!lat || !lng || !start || !end) {
    throw new Error(`❌ Missing input to fetchWindForecast: lat=${lat}, lng=${lng}, start=${start}, end=${end}`);
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&hourly=wind_speed_10m,wind_direction_10m` +
    `&start=${start}&end=${end}&timezone=UTC`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    if (
      !res.ok ||
      !json.hourly ||
      !Array.isArray(json.hourly.time) ||
      !Array.isArray(json.hourly.wind_speed_10m) ||
      !Array.isArray(json.hourly.wind_direction_10m)
    ) {
      console.error("❌ Invalid wind forecast response from Open-Meteo:", json);
      return [];
    }

    const timestamps: string[] = json.hourly.time;
    const windSpeeds: number[] = json.hourly.wind_speed_10m;
    const windDirections: number[] = json.hourly.wind_direction_10m;

    const windData = timestamps.map((timestamp, i) => ({
      timestamp,
      wind_speed_mps: windSpeeds[i],
      wind_direction: windDirections[i],
    }));

    console.log(`✅ Parsed ${windData.length} wind forecast rows`);
    return windData;
  } catch (err) {
    console.error("❌ Error fetching wind forecast:", err);
    return [];
  }
}
