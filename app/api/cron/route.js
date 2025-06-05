import { NextResponse } from 'next/server';
import { fetchTideData } from '../../../src/fetchTides.js';
import { storeTide } from '../../../src/storeTides.js';
import { fetchCdipForecast } from '../../../src/fetchCdipForecast.js';
import { storeCdipForecast } from '../../../src/storeCdipForecast.js';
import spots from '../../../src/spots.js';

export async function GET() {
  for (const spot of spots) {
 
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
