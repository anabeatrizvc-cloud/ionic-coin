export interface ConversionHistory {
  id: string;
  date: string;
  amount: number;
  from: string;
  to: string;
  result: number;
  rate: number;
  offline: boolean;
}
