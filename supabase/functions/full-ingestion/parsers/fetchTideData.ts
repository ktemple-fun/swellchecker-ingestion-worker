export default async function fetchTideData(station: string) {

  const now = new Date();
  const start = now;
  const end = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h in the future


  const beginDate = start.toISOString().slice(0, 10).replace(/-/g, '');
  const endDate = end.toISOString().slice(0, 10).replace(/-/g, '');

  const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
    `?begin_date=${beginDate}&end_date=${endDate}` +
    `&station=${station}&product=predictions&datum=MLLW&units=english` +
    `&time_zone=gmt&interval=h&format=json`;

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

    const parsedData = data.predictions.map((item: { t: string; v: string }) => ({
      timestamp: item.t,
      tide_ft: parseFloat(item.v),
    }));

    return parsedData;
  } catch (err) {
    console.error("❌ Failed to fetch tide data:", err);
    return [];
  }
}
