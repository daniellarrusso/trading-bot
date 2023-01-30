import { Indicator, IndicatorSettings } from '../model/indicator';
import { Candle } from '../model/candle';
import { SMA } from './sma';

export class RSI extends Indicator {
  previousResult = 0;
  lastClose = 0;
  avgU: SMMA;
  avgD: SMMA;
  sma: SMA;
  u = 0;
  d = 0;
  rs = 0;
  name = 'rsi';

  constructor(public settings: IndicatorSettings) {
    super(settings);
    this.avgU = new SMMA(settings);
    this.avgD = new SMMA(settings);
    this.sma = new SMA({ weight: this.maWeight });
  }

  update(price: number) {
    let currentClose = price;
    this.previousResult = this.result;

    if (!this.lastClose) {
      // Set initial price to prevent invalid change calculation
      this.lastClose = currentClose;

      // Do not calculate RSI for this reason - there's no change!
      this.age++;
      return;
    }

    if (currentClose > this.lastClose) {
      this.u = currentClose - this.lastClose;
      this.d = 0;
    } else {
      this.u = 0;
      this.d = this.lastClose - currentClose;
    }

    this.avgU.update(this.u);
    this.avgD.update(this.d);

    this.rs = this.avgU.result / this.avgD.result;
    this.result = 100 - 100 / (1 + this.rs);

    if (this.avgD.result === 0 && this.avgU.result !== 0) {
      this.result = 100;
    } else if (this.avgD.result === 0) {
      this.result = 0;
    }

    this.lastClose = currentClose;
    this.age++;
    this.result = +this.result.toFixed(2);
    this.sma.update(this.result);
    this.movingAverage = this.sma.result;
  }

  reset() {
    throw new Error('Method not implemented.');
  }
}

class SMMA extends Indicator {
  age: number;
  result: number;
  prices = [];
  sma: SMA;
  candle: Candle;

  constructor(public settings) {
    super(settings);
    this.sma = new SMA(settings);
  }
  previousResult: any;
  reset() {
    throw new Error('Method not implemented.');
  }
  update(price: number) {
    this.prices[this.age] = price;

    if (this.prices.length < this.weight) {
      this.sma.update(price);
    } else if (this.prices.length === this.weight) {
      this.sma.update(price);
      this.result = this.sma.result;
    } else {
      this.result = (this.result * (this.weight - 1) + price) / this.weight;
    }

    this.age++;
  }
}
