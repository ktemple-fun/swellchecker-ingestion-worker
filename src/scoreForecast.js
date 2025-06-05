export function scoreForecast({ wave_height, wave_period, wind_speed }) {
  let score = 0;

  if (wave_height >= 5) score += 2;
  else if (wave_height >= 3) score += 1;

  if (wave_period >= 12) score += 2;
  else if (wave_period >= 8) score += 1;

  if (wind_speed <= 5) score += 2;
  else if (wind_speed <= 10) score += 1;

  const quality = score >= 5 ? 'good' : score >= 3 ? 'fair' : 'poor';

  return { rawScore: score, quality };
}
