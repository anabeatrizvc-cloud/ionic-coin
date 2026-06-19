export interface RateCache {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
  savedAt: string;
}

export interface RateSnapshot {
  date: string;
  base: string;
  target: string;
  rate: number;
  savedAt: string;
}
