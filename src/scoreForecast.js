export function scoreForecast({ wave_height, wave_period, wind_speed, wind_direction }) {
  let rawScore = 0;

  // Wave height scoring (bigger = better, but cap max bonus)
  if (wave_height >= 6) rawScore += 3;
  else if (wave_height >= 4) rawScore += 2;
  else if (wave_height >= 2) rawScore += 1;
  else rawScore -= 1;

  // Wave period scoring (longer period = better power)
  if (wave_period >= 15) rawScore += 3;
  else if (wave_period >= 12) rawScore += 2;
  else if (wave_period >= 9) rawScore += 1;
  else rawScore -= 1;

  // Wind scoring (light wind = better surface)
  if (wind_speed <= 5) rawScore += 2;
  else if (wind_speed <= 10) rawScore += 1;
  else rawScore -= 1;

  // Optional: simple crude offshore wind bonus (later we can make smarter per-spot)
  if (wind_direction >= 180 && wind_direction <= 270) {
    rawScore += 1;  // offshore-ish
  }

  let quality = 'poor';
  if (rawScore >= 6) quality = 'good';
  else if (rawScore >= 3) quality = 'fair';
  else quality = 'poor';

  return { rawScore, quality };
}
