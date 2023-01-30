import { Candle } from '../model/candle';
import { Indicator } from '../model/indicator';
import { EMA } from './ema';

export class Countdown extends Indicator {
  ema: EMA;
  input = null;
  cup = [];
  cdp = [];
  previousCandle: Candle;

  constructor(public settings) {
    super(settings);
    this.ema = new EMA(settings);
  }

  update(candle: Candle) {
    this.previousResult = this.result;
    if (!this.previousCandle) {
      this.previousCandle = candle;
      return;
    }

    let up = 0;
    let down = 0;
    up += candle.close > candle.open ? 1 : 0;
    up += candle.high > this.previousCandle.high ? 1 : 0;
    down += candle.close < candle.open ? 1 : 0;
    down += candle.low < this.previousCandle.low ? 1 : 0;

    if (this.cup.length >= 8) this.cup.shift();
    this.cup.push(up);

    if (this.cdp.length >= 8) this.cdp.shift();
    this.cdp.push(down);

    this.previousCandle = candle;
    this.calculate();
  }
  calculate() {
    const cupResult = this.cup.reduce((p, c) => p + c, 0);
    const cdpResult = this.cdp.reduce((p, c) => p + c, 0);
    this.ema.update(cupResult - cdpResult);

    this.result = this.ema.result;
  }

  reset() {
    throw new Error('Method not implemented.');
  }
}
