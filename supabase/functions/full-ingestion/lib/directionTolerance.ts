// lib/directionTolerance.ts
export type Exposure   = 'low' | 'medium' | 'high';
export type Bathymetry = 'shelf' | 'steep' | 'canyon' | 'reef' | 'point';

/**
 * How far a swell’s direction may deviate from the spot-facing direction
 * before we consider it “out of window.”
 *
 *  • Baseline comes from exposure (how open the break is).
 *  • Bathymetry then tightens or widens that window.
 */
export function getDirectionTolerance(
  exposure: Exposure,
  bathymetry: Bathymetry
): number {
  /* 1️⃣  Baseline by exposure ------------------------------------- */
  const expTol: Record<Exposure, number> = {
    low   : 60,   // coves or harbors—needs bigger window
    medium: 45,
    high  : 30,   // wide-open beaches—already focused
  };

  /* 2️⃣  Bathymetry adjustment ----------------------------------- */
  //  +ve → widens window, –ve → narrows window
  const bathAdj: Record<Bathymetry, number> = {
    shelf : +15,   // broad continental shelf fans energy
    steep :   0,   // neutral default
    canyon: -10,   // submarine canyons focus ≈ narrower window
    point :  -5,   // bends swell a bit, but not as selective as canyon
    reef  : -15,   // reef passes / ledges can be very directional
  };

  return expTol[exposure] + bathAdj[bathymetry];
}
