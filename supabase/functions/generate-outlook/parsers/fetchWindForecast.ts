


export async function fetchWindForecast(
  lat: number,
  lng: number,
  startDate: string, // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
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
    `&timezone=America/Los_Angeles`;

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
      console.error('❌ Invalid wind forecast response from Open-Meteo:', json);
      return [];
    }

    const { time, wind_speed_10m: speed, wind_direction_10m: dir } = json.hourly;

    const windData = time.map((t: string, i: number) => {
      const date = new Date(t); // ISO string already in local PT from API

      return {
        timestamp: date.toISOString(), // canonical UTC
        timestamp_utc: date.toISOString(),
        timestamp_pacific: formatToPacific(date),
        wind_speed_mps: speed[i],
        wind_direction: dir[i],
      };
    });

    console.log(`✅ Parsed ${windData.length} wind forecast rows`);
    return windData;
  } catch (err) {
    console.error('❌ Error fetching wind forecast:', err);
    return [];
  }
}

// Native PT formatter (safe in Deno/Supabase)
function formatToPacific(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      if (part.type !== 'literal') acc[part.type] = part.value;
      return acc;
    }, {} as Record<string, string>);

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}-07:00`;
}
