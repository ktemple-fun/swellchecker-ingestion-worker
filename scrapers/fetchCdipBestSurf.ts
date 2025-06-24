

export interface BestSurfRow {
  timestamp_utc : string;
  face_ft       : number;
  model_src     : string;
}

/** Fetch & transform CDIP BestSurf JSON for one station */
export async function fetchCdipBestSurf(stationId: string): Promise<BestSurfRow[]> {
  const url = `https://cdip.ucsd.edu/data_access/BestSurf/${stationId}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    console.log(`CDIP BestSurf fetch ${stationId} → ${res.status}`);
    return [];
  }

  const json = await res.json();
  if (!Array.isArray(json)) return [];

  // deno-lint-ignore no-explicit-any
  return json.map((r: any) => ({
    timestamp_utc : new Date(r.timestamp).toISOString(),
    face_ft       : r.bestSurf,
    model_src     : r.src ?? null,
  }));
}
