/* lib/decomposeSwellSystems.ts
   — clusters buoy rows into 1-2 dominant swell systems                */

export interface RawSwellEntry {
  timestamp      : string;  // ISO, unused here
  wave_height    : number;  // ft  – guaranteed NON-null
  wave_period    : number;  // s   – »
  wave_direction : number;  // °   – »
}

export interface SwellSystem {
  avgHeight   : number;        // ft
  avgPeriod   : number;        // s
  avgDirection: number;        // °
  type        : 'primary' | 'secondary';
}

const CLUSTER_PERIOD_DELTA = 1;   // s
const CLUSTER_DIR_DELTA    = 30;  // °

function angularDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function decomposeSwellSystems(
  rows: RawSwellEntry[],
): SwellSystem[] {
  /* sort descending by height so first cluster is always primary */
  const sorted = [...rows].sort((a, b) => b.wave_height - a.wave_height);

  const used   = new Set<RawSwellEntry>();
  const output: SwellSystem[] = [];

  for (const seed of sorted) {
    if (used.has(seed)) continue;

    /* cluster rows around the seed */
    const cluster = rows.filter(r =>
      !used.has(r) &&
      Math.abs(r.wave_period - seed.wave_period) <= CLUSTER_PERIOD_DELTA &&
      angularDiff(r.wave_direction, seed.wave_direction) <= CLUSTER_DIR_DELTA
    );

    cluster.forEach(r => used.add(r));

    const n = cluster.length;
    const avg = (get: (r: RawSwellEntry) => number) =>
      cluster.reduce((sum, r) => sum + get(r), 0) / n;

    output.push({
      avgHeight   : +avg(r => r.wave_height   ).toFixed(2),
      avgPeriod   : +avg(r => r.wave_period   ).toFixed(2),
      avgDirection: +avg(r => r.wave_direction).toFixed(0),
      type        : output.length === 0 ? 'primary' : 'secondary',
    });

    if (output.length === 2) break;  // we only keep primary + secondary
  }

  return output;
}
