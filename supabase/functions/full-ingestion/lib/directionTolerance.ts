// lib/directionTolerance.ts
export function getDirectionTolerance(
  exposure: 'low' | 'medium' | 'high',
  bathymetry: 'shelf' | 'steep' | 'canyon'
): number {
  // baseline tolerance by exposure
  const expTol = { low: 60, medium: 45, high: 30 }[exposure];
  // bathymetry tweak: shelf = wider (add 15°), canyon = narrower (subtract 10°)
  const bathAdj = { shelf: +15, steep: 0, canyon: -10 }[bathymetry];
  return expTol + bathAdj;
}
