// lib/parsers/fetchWindForecast.ts

export async function fetchWindForecast(
  lat: number,
  lng: number,
  startDate: string,   // YYYY-MM-DD
  endDate: string      // YYYY-MM-DD
) {
  if (!lat || !lng || !startDate || !endDate) {
    throw new Error(
      `❌ Missing input to fetchWindForecast: lat=${lat}, lng=${lng}, ` +
      `start=${startDate}, end=${endDate}`
    );
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&hourly=wind_speed_10m,wind_direction_10m` +
    `&start_date=${startDate}&end_date=${endDate}` +
    `&timezone=America/Los_Angeles`;          // already DST-aware local time

  try {
    const res  = await fetch(url);
    const json = await res.json();

    if (
      !res.ok ||
      !json.hourly ||
      !Array.isArray(json.hourly.time) ||
      !Array.isArray(json.hourly.wind_speed_10m) ||
      !Array.isArray(json.hourly.wind_direction_10m)
    ) {
      console.error('❌ Invalid wind forecast response from Open-Meteo:', json);
      return [];
    }

    const { time, wind_speed_10m: speed, wind_direction_10m: dir } = json.hourly;

    const windData = time.map((t: string, i: number) => {
      // t comes back like "2025-06-22T09:00" (local, no offset)
      const pacificDate = new Date(`${t}:00`);                   // treat as local
      const utcISO = new Date(
        pacificDate.getTime() - pacificDate.getTimezoneOffset() * 6e4
      ).toISOString();

      return {
        timestamp        : t,               // Pacific local string (legacy)
        timestamp_pacific : pacificDate.toISOString(),
        timestamp_utc     : utcISO,
        wind_speed_mps   : speed[i],
        wind_direction   : dir[i],
      };
    });

    console.log(`✅ Parsed ${windData.length} wind forecast rows`);
    return windData;
  } catch (err) {
    console.error('❌ Error fetching wind forecast:', err);
    return [];
  }
}
