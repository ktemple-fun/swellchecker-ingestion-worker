import { NextResponse } from 'next/server';

export async function GET() {
  const url = 'https://cdip.ucsd.edu/data_access/forecast_point/073p1/latest/wave.dat';

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'SwellChecker/1.0',
      },
    });

    if (!res.ok) {
      console.error('❌ Fetch failed:', res.status, res.statusText);
      return NextResponse.json({ error: 'Failed to fetch CDIP .dat file' }, { status: 500 });
    }

    const text = await res.text();

    const lines = text
      .split('\n')
      .filter(line => line && !line.startsWith('#'))
      .slice(0, 48); // limit to 48 hourly records

    const forecast = lines.map(line => {
      const [yyyymmddhh, waveHeight, peakPeriod, meanDirection] = line.trim().split(/\s+/);
      
      const year = yyyymmddhh.slice(0, 4);
      const month = yyyymmddhh.slice(4, 6);
      const day = yyyymmddhh.slice(6, 8);
      const hour = yyyymmddhh.slice(8, 10);

      // Proper ISO timestamp parsing!
      const observation_time = new Date(`${year}-${month}-${day}T${hour}:00:00Z`).toISOString();

      return {
        observation_time,
        wave_height: parseFloat(waveHeight),
        wave_period: parseFloat(peakPeriod),
        mean_direction: parseFloat(meanDirection),
      };
    });

    return NextResponse.json({ forecast });
  } catch (err) {
    console.error('❌ .dat file parsing error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
