const fetch = require('node-fetch');

function formatDate(date) {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

async function fetchTideData(stationId) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?` +
    new URLSearchParams({
      product: 'predictions',
      application: 'swellchecker',
      begin_date: formatDate(now),
      end_date: formatDate(tomorrow),
      datum: 'MLLW',
      station: stationId,
      time_zone: 'lst_ldt',
      units: 'english',
      interval: 'h',
      format: 'json'
    });

  const res = await fetch(url);
  const data = await res.json();

  if (!data.predictions) throw new Error('No tide data found');

  return data.predictions.map(pred => ({
    time: pred.t,
    height: parseFloat(pred.v)
  }));
}

module.exports = { fetchTideData };

