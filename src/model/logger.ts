import { Indicator } from './indicator';
import { Ticker } from './ticker';

export class Logger {
  private indicatorList: Indicator[] = [];
  constructor(public ticker: Ticker) {}

  addIndicator(indicator) {
    this.indicatorList.push(indicator);
  }

  formatResult(res: number) {
    return res.normalise(this.ticker.tickSize);
  }

  displayIndicators(): string {
    let message = '';
    this.indicatorList.forEach((t) => (message += t.name + ': ' + this.formatResult(t.result) + ' '));
    return message;
  }
}
