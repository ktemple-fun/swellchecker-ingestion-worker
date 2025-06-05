export function mergeForecasts(cdipRows, nwsRows) {
  const merged = cdipRows.map(cdip => {
    // Try to find matching NOAA forecast within 1 hour window
    const cdipTime = new Date(cdip.observation_time).getTime();

    const nwsMatch = nwsRows.find(nws => {
      const nwsTime = new Date(nws.observation_time).getTime();
      const diffInMs = Math.abs(cdipTime - nwsTime);
      return diffInMs <= 60 * 60 * 1000; // 1 hour tolerance
    });

    return {
      observation_time: cdip.observation_time,
      wave_height: cdip.wave_height,
      wave_period: cdip.wave_period,
      wind_speed: nwsMatch ? nwsMatch.wind_speed : 0,
      wind_direction: nwsMatch ? nwsMatch.wind_direction : 0
    };
  });

  return merged;
}
