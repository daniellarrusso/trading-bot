import { Indicator } from '../model/indicator';
import { Candle } from '../model/candle';

// @link http://en.wikipedia.org/wiki/Exponential_moving_average#Exponential_moving_average

export class EMA extends Indicator {
  candle: Candle;
  name = 'ema';
  constructor(public settings) {
    super(settings);
  }

  update(price: number) {
    if (!this.result) this.result = price;

    this.age++;
    this.previousResult = this.result;
    this.calculate(price);

    return this.result;
  }
  calculate(price: number) {
    var k = 2 / (this.weight + 1);

    // yesterday
    var y = this.result;

    // calculation
    this.result = price * k + y * (1 - k);
  }

  reset() {
    throw new Error('Method not implemented.');
  }
}
