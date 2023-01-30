import { Indicator } from '../model/indicator';
import { RSI } from './rsi';

// required indicators

export class Stochastic extends Indicator {
  sum: number;
  rsiHistory = [];
  rsi: RSI;

  constructor(public settings) {
    super(settings);
    this.sum = 0;
    this.rsi = new RSI(settings);
  }

  previousResult: any;
  reset() {
    throw new Error('Method not implemented.');
  }

  update(price: number) {
    this.previousResult = this.result;
    this.rsi.update(price);
    const rsiResult = this.rsi.result;
    this.rsiHistory.push(rsiResult);

    if (this.rsiHistory.length > 14) this.rsiHistory.shift();

    const lowestRSI = this.rsiHistory.reduce((p, c) => Math.min(p, c));
    const highestRSI = this.rsiHistory.reduce((p, c) => Math.max(p, c));
    this.result = ((rsiResult - lowestRSI) / (highestRSI - lowestRSI)) * 100;
    this.returnPercentageIncrease();
  }
}
