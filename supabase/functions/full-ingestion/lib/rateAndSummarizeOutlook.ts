import { getWindQuality } from './windUtils.ts'

/* ── Types ─────────────────────────────────────────── */
export type WindQuality = 'Onshore' | 'Sideshore' | 'Offshore'
export type Rating = 'Poor' | 'Poor+' | 'Fair' | 'Fair+' | 'Good'

export interface OutlookBlock {
  swellHeight: number      // ft
  wavePeriod?: number      // s (optional)
  windSpeed: number        // kt
  windDirection: number    // ° true
  avg_tide_ft?: number     // optional
  date: string
  avg_wave_direction?: number
  dayPart: 'AM' | 'PM'
  segment: string
  timestamp_utc?: string
  timestamp_pacific?: string
}

export interface RatedOutlookBlock extends OutlookBlock {
  windQuality: WindQuality
  rating: Rating
  summary: string
  avg_wave_height: number
  avg_wave_period: number
  avg_wave_direction?: number
  avg_wind_speed: number
  avg_wind_direction: number
  avg_tide_ft?: number
}

/* ── Helpers ───────────────────────────────────────── */
function calcRating(
  swellHeight: number,
  windSpeed: number,
  windQuality: WindQuality,
): Rating {
  const lightWind = windSpeed <= 8

  if (swellHeight < 2) return 'Poor'

  if (swellHeight < 3)
    return windQuality === 'Offshore' && lightWind ? 'Fair' : 'Poor+'

  if (swellHeight < 4)
    return windQuality === 'Offshore' && lightWind ? 'Fair+' : 'Fair'

  return windQuality === 'Offshore' && lightWind ? 'Good' : 'Fair+'
}

function summaryLine(
  rating: Rating,
  swellHeight: number,
  windQuality: WindQuality,
): string {
  return `${rating} conditions with ${swellHeight.toFixed(1)} ft waves and ${windQuality.toLowerCase()} wind`
}

/* ── Public API ────────────────────────────────────── */
export function rateAndSummarizeOutlook(
  outlook: OutlookBlock[],
  spotOrientationDeg: number,
): RatedOutlookBlock[] {
  return outlook.map((block) => {
    const windQuality = getWindQuality(block.windDirection, spotOrientationDeg)

    const rating = calcRating(
      block.swellHeight,
      block.windSpeed,
      windQuality,
    )

    return {
      ...block,
      windQuality,
      rating,
      summary: summaryLine(rating, block.swellHeight, windQuality),
      avg_wave_height: block.swellHeight,
      avg_wave_period: block.wavePeriod ?? 0,
      avg_wind_speed: block.windSpeed,
      avg_wave_direction: block.avg_wave_direction ?? undefined,
      avg_wind_direction: block.windDirection,
      avg_tide_ft: block.avg_tide_ft ?? undefined,
    }
  })
}
