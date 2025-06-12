


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

//     const metersToFeet = (m: number) => m * 3.28084;

//     const parsed = time.map((timestamp: string, i: number) => ({
//       timestamp,
//       wave_height: wave_height?.[i] != null ? metersToFeet(wave_height[i]) : null,
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



// import { supabase } from './supabaseClient.ts';

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

//     const metersToFeet = (m: number) => m * 3.28084;
//     const metersToSurfFaceFeet = (m: number) => m * 3.28084 * 1.8;


//     // ✅ Insert logs for the first 5 entries (optional)
//     if (spotSlug) {
//       for (let i = 0; i < Math.min(5, wave_height.length); i++) {
//         await supabase.from('forecast_debug_log').insert({
//           spot_slug: spotSlug,
//           raw_wave_height_meters: wave_height[i],
//           converted_wave_height_feet: metersToFeet(wave_height[i])
//         });
//       }
//     }

//     const parsed = time.map((timestamp: string, i: number) => ({
//       timestamp,
//       wave_height: wave_height?.[i] != null ? metersToFeet(wave_height[i]) : null,
//       wave_period: wave_period?.[i] ?? null,
//       wave_direction: wave_direction?.[i] ?? null,
//     }));
    
//     console.log("✅ Local Edge Function is running!");


//     return parsed;
//   } catch (err) {
//     console.error("❌ Error fetching swell forecast:", err);
//     return [];
//   }
// }




import { supabase } from './supabaseClient.ts';

export default async function fetchSwellForecast(
  lat: number,
  lng: number,
  startISO: string,
  endISO: string,
  spotSlug?: string // optional for logging
) {
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

    // Convert to surf face height: meters -> feet -> face height (approx. 1.8x)
    const metersToSurfFaceFeet = (m: number) => m * 3.28084 * 1.8;

    // Optional debug log: first 5 rows
    if (spotSlug) {
      for (let i = 0; i < Math.min(5, wave_height.length); i++) {
        await supabase.from('forecast_debug_log').insert({
          spot_slug: spotSlug,
          raw_wave_height_meters: wave_height[i],
          converted_wave_height_feet: metersToSurfFaceFeet(wave_height[i]),
        });
      }
    }

    const parsed = time.map((timestamp: string, i: number) => ({
      timestamp,
      wave_height: wave_height[i] != null ? metersToSurfFaceFeet(wave_height[i]) : null,
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
