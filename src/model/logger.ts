import { Indicator } from './indicator';

export class Logger {
  private indicatorList: Indicator[] = [];

  addIndicator(indicator) {
    this.indicatorList.push(indicator);
  }

  displayIndicators(): string {
    let message = '';
    this.indicatorList.forEach((t) => (message += t.name + ': ' + t.result + ' '));
    return message;
  }
}
