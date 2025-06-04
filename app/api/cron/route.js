import { NextResponse } from 'next/server';
import spots from '../../../src/spots';
import { fetchBuoyData } from '../../../src/fetchBuoy';
import { storeForecast } from '../../../src/storeForecast';
import { fetchTideData } from '../../../src/fetchTides';
import { storeTide } from '../../../src/storeTides';
import { fetchCdipForecast } from '../../../src/fetchCdipForecast';
import { storeCdipForecast } from '../../../src/storeCdipForecast';

export async function GET() {
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
  }

  return NextResponse.json({ message: 'Ingestion complete!' });
}
