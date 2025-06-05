export function mergeForecasts(cdipRows, nwsRows) {
  return cdipRows.map(cdip => {
    const nwsMatch = nwsRows.find(nws => {
      const cdipTime = new Date(cdip.observation_time);
      const nwsTime = new Date(nws.observation_time);
      return Math.abs(cdipTime - nwsTime) <= 60 * 60 * 1000;
    });

    return {
      observation_time: cdip.observation_time,
      wave_height: cdip.wave_height,
      wave_period: cdip.wave_period,
      wind_speed: nwsMatch ? nwsMatch.wind_speed : 0,
      wind_direction: nwsMatch ? nwsMatch.wind_direction : 0
    };
  });
}
