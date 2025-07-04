export interface SwellRow {
  timestamp: string;
  timestamp_pacific: string;
  timestamp_utc: string;
  wave_height: number | null;
  wave_period: number | null;
  wave_direction: number | null;
}