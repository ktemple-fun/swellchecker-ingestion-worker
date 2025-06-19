// lib/decomposeSwellSystems.ts
interface RawSwellEntry {
  timestamp: string;
  wave_height: number;
  wave_period: number;
  wave_direction: number;
}

interface SwellSystem {
  avgHeight: number;
  avgPeriod: number;
  avgDirection: number;
  type: 'primary' | 'secondary';
}

const CLUSTER_PERIOD_DELTA = 1;    // seconds tolerance when clustering
const CLUSTER_DIR_DELTA    = 30;   // degrees tolerance

function angularDiff(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function decomposeSwellSystems(
  entries: RawSwellEntry[]
): SwellSystem[] {
  // sort all entries by height desc
  const sorted = [...entries].sort((a, b) => b.wave_height - a.wave_height);
  const used = new Set<RawSwellEntry>();
  const systems: SwellSystem[] = [];

  for (const seed of sorted) {
    if (used.has(seed)) continue;

    // form a cluster around this seed
    const cluster = entries.filter(e =>
      !used.has(e) &&
      Math.abs(e.wave_period - seed.wave_period) <= CLUSTER_PERIOD_DELTA &&
      angularDiff(e.wave_direction, seed.wave_direction) <= CLUSTER_DIR_DELTA
    );

    cluster.forEach(e => used.add(e));

    // compute cluster averages
    const n = cluster.length;
    const avgHeight    = cluster.reduce((sum, e) => sum + e.wave_height, 0) / n;
    const avgPeriod    = cluster.reduce((sum, e) => sum + e.wave_period, 0) / n;
    const avgDirection = cluster.reduce((sum, e) => sum + e.wave_direction, 0) / n;

    systems.push({
      avgHeight,
      avgPeriod,
      avgDirection,
      type: systems.length === 0 ? 'primary' : 'secondary'
    });

    if (systems.length === 2) break;
  }

  return systems;
}
