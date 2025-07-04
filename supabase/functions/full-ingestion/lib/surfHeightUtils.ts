
type Exposure = 'low' | 'medium' | 'high';
type Bathymetry = 'shelf' | 'steep' | 'canyon' | 'point' | 'reef';

/**
 * Estimate trough-to-crest face height seen by surfers.
 *
 * @param Hs_ft  significant height in **feet**
 * @param Tp_s   peak/representative period in seconds (optional → 8 s baseline)
 * @param exposure   how open the spot is to swell (wider focus ⇒ bigger waves)
 * @param bathymetry bottom profile (canyon/reef focuses energy a bit more)
 */
// lib/surfHeightUtils.ts
// Quick, empirically-good estimator until you back-fit a full Komar-Caldwell model.

export function estimateSurfFaceFt(
  Hs_ft: number,
  Tp_s: number | null | undefined,
  exposure: Exposure = 'medium',
  bathymetry: Bathymetry = 'shelf'
): number {
  if (!Hs_ft || Hs_ft <= 0) return 0;

  // DEBUG: log inputs
  console.log(
    `[surfHeightUtils] raw=${Hs_ft.toFixed(2)} ft, Tp=${Tp_s ?? 'null'} s, ` +
    `exposure=${exposure}, bathymetry=${bathymetry}`
  );

  // 1) Base multiplier (no Rayleigh boost)
  const distributionFactor = 1.0;

  // 2) Period shoaling capped at 20%
  const periodRaw = Tp_s ? Tp_s / 8 : 1;
  const periodFactor = Math.min(periodRaw, 1.2);

  // 3) Local focusing tweaks
  let localCoeff = 1;
  if (exposure === 'high') localCoeff += 0.05;
  if (exposure === 'low')  localCoeff -= 0.05;
  if (bathymetry === 'canyon' || bathymetry === 'reef' || bathymetry === 'point') {
    localCoeff += 0.10;
  } else if (bathymetry === 'steep') {
    localCoeff += 0.05;
  }

  // Compute face height
  const face = Hs_ft * distributionFactor * periodFactor * localCoeff;

  // DEBUG: factors breakdown
  console.log(
    `[surfHeightUtils] dist=${distributionFactor.toFixed(2)}, ` +
    `periodF=${periodFactor.toFixed(2)}, localC=${localCoeff.toFixed(2)} ` +
    `→ face=${face.toFixed(2)} ft`
  );

  return +face.toFixed(1);
}