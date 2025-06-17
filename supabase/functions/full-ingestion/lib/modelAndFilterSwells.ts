// lib/modelAndFilterSwells.ts

interface RawSwellEntry {
  timestamp: string;
  wave_height: number | null | undefined;
  wave_period: number | null | undefined;
  wave_direction: number | null | undefined;
}

interface SpotMeta {
  optimalSwellDir: number;
  minPeriod?: number;
  minHeight?: number;
}

export function modelAndFilterSwells(
  raw: RawSwellEntry[] | null | undefined,
  meta: SpotMeta
): RawSwellEntry[] {
  if (!Array.isArray(raw)) return [];

  const MIN_PERIOD = meta.minPeriod ?? 8;
  const MIN_HEIGHT = meta.minHeight ?? 1.5;
  const DIRECTION_RANGE = 45;

  return raw.filter((entry) => {
    const height = entry.wave_height;
    const period = entry.wave_period;
    const direction = entry.wave_direction;

    if (
      typeof height !== 'number' ||
      typeof period !== 'number' ||
      typeof direction !== 'number'
    ) {
      return false;
    }

    if (period < MIN_PERIOD) return false;
    if (height < MIN_HEIGHT) return false;

    const diff = Math.abs(direction - meta.optimalSwellDir) % 360;
    const angularDistance = diff > 180 ? 360 - diff : diff;

    return angularDistance <= DIRECTION_RANGE;
  });
}
