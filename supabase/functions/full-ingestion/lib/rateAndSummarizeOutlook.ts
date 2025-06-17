// rateAndSummarizeOutlook.ts

import { getWindQuality } from './windUtils';

export type Rating = 'Poor' | 'Poor+' | 'Fair' | 'Fair+' | 'Good';
export type WindQuality = 'Onshore' | 'Sideshore' | 'Offshore';

interface OutlookBlock {
  swellHeight: number;
  windSpeed: number;
  windDirection: number;
  date: string;
  dayPart: 'AM' | 'PM';
  segment: string;
  timestamp_utc?: string;
  timestamp_pacific?: string;
}

interface RatedOutlookBlock extends OutlookBlock {
  windQuality: WindQuality;
  rating: Rating;
  summary: string;
}

function getSurfRating({ swellHeight, windSpeed, windQuality }: {
  swellHeight: number;
  windSpeed: number;
  windQuality: WindQuality;
}): Rating {
  if (swellHeight < 2) return 'Poor';
  if (swellHeight < 3) return windQuality === 'Offshore' ? 'Fair' : 'Poor+';
  if (swellHeight < 4) return windQuality === 'Offshore' ? 'Fair+' : 'Fair';
  return windQuality === 'Offshore' ? 'Good' : 'Fair+';
}

function getSummary(rating: Rating, swellHeight: number, windQuality: WindQuality): string {
  return `${rating} conditions with ${swellHeight.toFixed(1)} ft waves and ${windQuality.toLowerCase()} wind.`;
}

export function rateAndSummarizeOutlook(
  outlook: OutlookBlock[],
  spotOrientationDeg: number
): RatedOutlookBlock[] {
  return outlook.map(block => {
    const windQuality = getWindQuality(block.windDirection, spotOrientationDeg);
    const rating = getSurfRating({
      swellHeight: block.swellHeight,
      windSpeed: block.windSpeed,
      windQuality
    });
    const summary = getSummary(rating, block.swellHeight, windQuality);

    return {
      ...block,
      windQuality,
      rating,
      summary
    };
  });
}
