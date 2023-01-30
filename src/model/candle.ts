import { Ticker } from './ticker';

export class Candle {
  pair: string;
  open: number;
  high: number;
  low: number;
  close: number;
  price: string;
  trades: number;
  volume: number;
  time: Date;
  closeTime: Date;
  green: boolean;
  isFinal: boolean;
  candleSize: number;
}
