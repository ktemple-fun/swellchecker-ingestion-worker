// windUtils.ts

export type WindQuality = 'Onshore' | 'Sideshore' | 'Offshore';

/**
 * Calculates angular difference between two bearings (in degrees).
 */
function angleDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Classifies wind direction as Offshore, Sideshore, or Onshore.
 * @param windDirDeg - Wind direction in degrees (0 = from North)
 * @param spotOrientationDeg - Orientation of the surf spot (e.g. 270 for west-facing)
 */
export function getWindQuality(windDirDeg: number, spotOrientationDeg: number): WindQuality {
  const diff = angleDiff(windDirDeg, spotOrientationDeg);

  if (diff < 45) return 'Onshore';      // Wind blowing toward the wave
  if (diff > 135) return 'Offshore';    // Wind blowing from behind the wave
  return 'Sideshore';                   // Wind blowing across the wave
}
