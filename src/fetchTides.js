export async function fetchTideData(stationId) {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);

  const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?` +
    new URLSearchParams({
      product: 'predictions',
      application: 'swellchecker',
      begin_date: now.toISOString().split('T')[0].replace(/-/g, ''),
      end_date: tomorrow.toISOString().split('T')[0].replace(/-/g, ''),
      datum: 'MLLW',
      station: stationId,
      time_zone: 'lst_ldt',
      units: 'english',
      interval: 'h',
      format: 'json',
    });

  const response = await fetch(url.toString());
  const data = await response.json();

  return data.predictions || [];
}
