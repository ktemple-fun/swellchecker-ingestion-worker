const { fetchBuoyData } = require('./fetchBuoy');
const { storeForecast } = require('./storeForecast');
const { fetchTideData } = require('./fetchTides');
const { storeTide } = require('./storeTides');
const { fetchCdipForecast } = require('./fetchCdipForecast');
const { storeCdipForecast } = require('./storeCdipForecast');
const spots = require('./spots');

async function main() {
  for (const spot of spots) {
    try {
      const buoyData = await fetchBuoyData(spot.buoyId);
      await storeForecast(spot.slug, buoyData);
    } catch (err) {
      console.error(`Error processing forecast for ${spot.slug}:`, err);
    }

    try {
      const tideData = await fetchTideData(spot.tideStationId);
      await storeTide(spot.slug, tideData);
    } catch (err) {
      console.error(`Error processing tides for ${spot.slug}:`, err);
    }

    try {
      const cdipData = await fetchCdipForecast();
      await storeCdipForecast(spot.slug, cdipData);
    } catch (err) {
      console.error(`Error processing CDIP forecast for ${spot.slug}:`, err);
    }
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
