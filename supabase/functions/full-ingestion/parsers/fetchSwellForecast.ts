


// export default async function fetchSwellForecast(lat: number, lng: number, startISO: string, endISO: string) {
//   const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}` +
//     `&hourly=wave_height,wave_period,wave_direction` +
//     `&start=${startISO}&end=${endISO}&timezone=UTC`;

//   try {
//     const res = await fetch(url);
//     if (!res.ok) {
//       const message = await res.text();
//       console.error(`❌ Open-Meteo fetch failed: ${res.status} - ${message}`);
//       return [];
//     }

//     const json = await res.json();
//     const { time, wave_height, wave_direction, wave_period } = json.hourly;

//     if (!time?.length || !wave_height?.length) {
//       console.warn("⚠️ No hourly wave data returned.");
//       return [];
//     }

//     const parsed = time.map((timestamp: string, i: number) => ({
//       timestamp,
//       wave_height: wave_height?.[i] ?? null,
//       wave_period: wave_period?.[i] ?? null,
//       wave_direction: wave_direction?.[i] ?? null,
//     }));

//     console.log(`✅ Parsed ${parsed.length} forecast rows`);
//     return parsed;
//   } catch (err) {
//     console.error("❌ Error fetching swell forecast:", err);
//     return [];
//   }
// }


export default async function fetchSwellForecast(lat: number, lng: number, startISO: string, endISO: string) {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}` +
    `&hourly=wave_height,wave_period,wave_direction` +
    `&start=${startISO}&end=${endISO}&timezone=UTC`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const message = await res.text();
      console.error(`❌ Open-Meteo fetch failed: ${res.status} - ${message}`);
      return [];
    }

    const json = await res.json();
    const { time, wave_height, wave_direction, wave_period } = json.hourly;

    if (!time?.length || !wave_height?.length) {
      console.warn("⚠️ No hourly wave data returned.");
      return [];
    }

    const metersToFeet = (m: number) => m * 3.28084;

    const parsed = time.map((timestamp: string, i: number) => ({
      timestamp,
      wave_height: wave_height?.[i] != null ? metersToFeet(wave_height[i]) : null,
      wave_period: wave_period?.[i] ?? null,
      wave_direction: wave_direction?.[i] ?? null,
    }));

    console.log(`✅ Parsed ${parsed.length} forecast rows`);
    return parsed;
  } catch (err) {
    console.error("❌ Error fetching swell forecast:", err);
    return [];
  }
}
