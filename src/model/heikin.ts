import { Candle } from './candle';

export class Heikin extends Candle {
  duration: number;
  initial: Candle;
  normalCandles: Candle[] = [];
  candles: Heikin[] = [];
  trend = 'none';
  previousHeikinCandle: Candle;

  constructor(candle: Candle) {
    super();
    this.initial = {
      close: (candle.open + candle.high + candle.low + candle.close) / 4,
      open: (candle.open + candle.close) / 2,
      time: new Date(),
    } as Heikin;
    this.candles.push(this.initial as Heikin);
  }

  addCandle(candle: Candle) {
    this.normalCandles.push(candle);
    const prevCandleIndex = this.candles.length - 1;
    let open = (this.candles[prevCandleIndex].open + this.candles[prevCandleIndex].close) / 2;
    let close = (candle.open + candle.high + candle.low + candle.close) / 4;

    if (this.trend !== 'up' && close > open) {
      this.trend = 'up';
      this.duration = 0;
    }
    if (this.trend !== 'down' && close < open) {
      this.trend = 'down';
      this.duration = 0;
    }

    this.duration++;

    let heikin: Heikin = {
      time: candle.time,
      low: Math.min(candle.low, open),
      high: Math.max(candle.high, open),
      close: (candle.open + candle.high + candle.low + candle.close) / 4,
      volume: candle.volume,
      open: open,
      duration: this.duration,
      trades: 0,
      green: close > open,
      isFinal: candle.isFinal ? candle.isFinal : false,
    } as Heikin;

    this.candles.push(heikin);
    Object.assign(this, heikin);
    if (this.candles?.length > 1) {
      this.previousHeikinCandle = this.candles[this.candles.length - 2]; // current candle not properly drawn until end of hour
    }
  }
}
