import { fetchCdipForecast } from './fetchCdipForecast.js';
import { fetchNwsForecast } from './fetchNwsForecast.js';
import { mergeForecasts } from './mergeForecast.js';
import { storeForecasts } from './storeForecasts.js';
import spots from './spots.js';

async function main() {
  for (const spot of spots) {
    try {
      const cdipData = await fetchCdipForecast();
      const nwsData = await fetchNwsForecast(spot.lat, spot.lon);
      const merged = mergeForecasts(cdipData, nwsData);
      await storeForecasts(spot.slug, merged);
      console.log(`✅ Ingested forecast for ${spot.slug}`);
    } catch (err) {
      console.error(`Error for ${spot.slug}:`, err);
    }
  }
}

main();
