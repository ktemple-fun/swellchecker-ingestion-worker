
export async function fetchTideData(stationId: string) {
  const url =
    `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
    `?station=${stationId}` +
    `&product=predictions` +
    `&datum=MLLW` +
    `&interval=h` +
    `&units=english` +      // feet
    `&time_zone=lst_ldt` +  // Pacific local, DST aware
    `&format=json` +
    `&range=48`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`❌ NOAA tide fetch failed (${response.status}) for station ${stationId}:`,
        (await response.text()).slice(0, 100));
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data?.predictions)) {
      console.error(`❌ NOAA tide response missing predictions for station ${stationId}:`, data);
      return [];
    }

    const cleaned = data.predictions.map(
      (entry: { t: string; v: string }) => {
        const pacificDate = new Date(`${entry.t}:00`);
        const utcDate = new Date(pacificDate.getTime() + pacificDate.getTimezoneOffset() * 60000); // ✅ correct direction

        return {
          timestamp_pacific: pacificDate.toISOString(),
          timestamp_utc: utcDate.toISOString(),
          height_ft: parseFloat(entry.v)
        };
      }
    );



    console.log(`✅ fetchTideData: Parsed ${cleaned.length} tide entries for station ${stationId}`);
    return cleaned;
  } catch (err) {
    console.error(`❌ Tide data fetch error for station ${stationId}:`, err);
    return [];
  }
}
