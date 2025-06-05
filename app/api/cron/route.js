import { NextResponse } from 'next/server';
import { fetchCdipForecast } from '../../../src/fetchCdipForecast.js';
import { storeCdipForecast } from '../../../src/storeCdipForecast.js';
import spots from '../../../src/spots.js';

export async function GET() {
  for (const spot of spots) {
 
    try {
      const cdipData = await fetchCdipForecast();
      await storeCdipForecast(spot.slug, cdipData);
    } catch (err) {
      console.error(`Error processing CDIP forecast for ${spot.slug}:`, err);
    }
  }

  return NextResponse.json({ message: 'Ingestion complete!' });
}
