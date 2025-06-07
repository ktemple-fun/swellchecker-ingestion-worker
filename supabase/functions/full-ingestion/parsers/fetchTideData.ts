export default async function fetchTideData(station: string) {
  const now = new Date();
  const start = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const end = now;

  const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${start.toISOString().slice(0, 10)}&end_date=${end.toISOString().slice(0, 10)}&station=${station}&product=hourly_height&datum=MLLW&units=english&time_zone=gmt&format=json`;
  console.log("Fetching tide data for station:", station);
  console.log("Request URL:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`❌ NOAA HTTP Error ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (data?.error) {
      console.error("❌ NOAA returned error:", data.error);
      return [];
    }

    const parsedData = data.data.map((item: { t: string; v: string }) => ({
      timestamp: item.t,
      tide_ft: parseFloat(item.v),
    }));

    return parsedData;
  } catch (err) {
    console.error("❌ Failed to fetch tide data:", err);
    return [];
  }
}
