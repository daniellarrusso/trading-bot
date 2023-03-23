import { Candle } from '../model/candle';
import { Indicator } from '../model/indicator';

/**
 * Average True Range - Accurate to TradingView for SMA
 */
export class AverageTrueRange extends Indicator {
  range = [];
  previousClose: number;
  constructor(public settings) {
    super(settings);
    this.input = null;
  }

  update(candle: Candle) {
    this.dtProcessed = candle.time;
    this.previousResult = this.result ? this.result : 0;
    if (!this.previousClose) {
      this.previousClose = candle.close;
      return;
    }
    this.previousClose = candle.close;
    const highMinusPreviousClose = candle.high - this.previousClose;
    const lowMinusPreviousClose = candle.low - this.previousClose;
    const currentHighMinusCurrentLow = candle.high - candle.low;
    const maxValue = [highMinusPreviousClose, lowMinusPreviousClose, currentHighMinusCurrentLow].reduce(
      (p, c) => Math.max(p, c),
      0
    );
    if (this.range.length >= this.weight) {
      this.range.shift();
    }
    this.range.push(maxValue);

    this.result = this.range.reduce((p, c) => p + c) / this.range.length;
  }
  reset() {}
}
