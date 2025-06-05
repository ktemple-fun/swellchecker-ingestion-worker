import { fetchCdipForecast } from './fetchCdipForecast.js';
import { storeCdipForecast } from './storeCdipForecast.js';
import spots from './spots.js';

async function main() {
  for (const spot of spots) {
    try {
      const forecast = await fetchCdipForecast();
      await storeCdipForecast(spot.slug, forecast);
      console.log(`✅ CDIP forecast inserted for ${spot.slug}`);
    } catch (err) {
      console.error(`Error processing ${spot.slug}:`, err);
    }
  }
}

main();
