// lib/surfHeightUtils.ts
// Quick, empirically-good estimator until you back-fit a full Komar-Caldwell model.

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
export function estimateSurfFaceFt(
  Hs_ft: number,
  Tp_s: number | null | undefined,
  exposure: Exposure = 'medium',
  bathymetry: Bathymetry = 'shelf'
): number {
  if (!Hs_ft || Hs_ft <= 0) return 0;

  /* 1. Rayleigh “biggest-of-the-set” factor (H₁⁄₁₀ ≈ 1.4 × Hₛ) */
  const distributionFactor = 1.4;

  /* 2. Long-period waves shoal harder.  8 s = typical SoCal windswell baseline. */
  const periodFactor = Tp_s ? Tp_s / 8 : 1;

  /* 3. Local focusing tweaks */
  let localCoeff = 1;
  if (exposure === 'high')   localCoeff += 0.10;
  if (exposure === 'low')    localCoeff -= 0.05;

  if (bathymetry === 'canyon' || bathymetry === 'reef' || bathymetry === 'point')
    localCoeff += 0.15;
  else if (bathymetry === 'steep')
    localCoeff += 0.05;   // mild bump for steep shelves

  /* Final estimate */
  const face = Hs_ft * distributionFactor * periodFactor * localCoeff;
  return +face.toFixed(1);   // one-decimal precision
}
