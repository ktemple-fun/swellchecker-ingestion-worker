export function scoreForecast({ wave_height, wave_period, wind_speed }) {
  let score = 0;
  if (wave_height >= 3) score += 1;
  if (wave_period >= 12) score += 1;
  if (wind_speed <= 10) score += 1;

  const quality = score >= 2 ? 'good' : 'poor';
  return { rawScore: score, quality };
}
