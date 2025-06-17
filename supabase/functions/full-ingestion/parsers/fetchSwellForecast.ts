
// export default async function fetchSwellForecast(
//   lat: number,
//   lng: number,
//   startISO: string,
//   endISO: string,
//   spotSlug?: string // optional for logging
// ) {
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

//     // Convert meters -> feet 
//     const metersToFeet = (m: number) => m * 3.28084;


//     const parsed = time.map((timestamp: string, i: number) => ({
//       timestamp,
//       wave_height: wave_height[i] != null ? metersToFeet(wave_height[i]) : null,
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


// import { toPacificTime } from './time.ts';

// export async function fetchSwellForecast(spot: any) {
//   const response = await fetch(`https://api.your-forecast-provider.com/swell?lat=${spot.lat}&lon=${spot.lng}`);
//   const data = await response.json();

//   return data.forecast.map((entry: any) => {
//     const utcTime = new Date(entry.timestamp);
//     const pacificTime = toPacificTime(utcTime);

//     return {
//       timestamp: utcTime.toISOString(), // keep in UTC
//       localTimeISO: pacificTime.toISOString(), // optional for debugging
//       components: entry.components // assuming components is already formatted
//     };
//   });
// }


// import { toPacificTime } from './time.ts';

// export async function fetchSwellForecast({ lat, lon }: { lat: number; lon: number }) {
//   const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_period,wave_direction,wave_direction_mean,wave_direction_dominant&timezone=UTC`;

//   const response = await fetch(url);
//   const data = await response.json();

//   if (!data?.hourly?.time || !data?.hourly?.wave_height) {
//     console.error('❌ Invalid swell forecast response from Open-Meteo:', data);
//     return [];
//   }

//   return data.hourly.time.map((time: string, i: number) => {
//     const timestamp = new Date(time + 'Z');
//     const pacificTime = toPacificTime(timestamp);

//     return {
//       timestamp: timestamp.toISOString(),
//       localTimeISO: pacificTime.toISOString(),
//       components: {
//         wave_height_m: data.hourly.wave_height[i],
//         wave_period_s: data.hourly.wave_period[i],
//         wave_direction: data.hourly.wave_direction[i],
//         wave_direction_dominant: data.hourly.wave_direction_dominant[i],
//       },
//     };
//   });
// }
export async function fetchSwellForecast({
  lat,
  lng,
  start,
  end
}: {
  lat: number;
  lng: number;
  start: string;
  end: string;
}) {
  
const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}` +
  `&hourly=wave_height,wave_period,wave_direction` +
  `&start=${start}&end=${end}&timezone=UTC`;

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
      wave_height: wave_height[i] != null ? metersToFeet(wave_height[i]) : null,
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
