import { Indicator } from '../../model/indicator';
import { IndicatorStrategy } from './indicator-strategy';

export class IndicatorStrategies {
  strategies: Indicator[] = [];

  update(value) {
    if (this.strategies.length > 0) this.strategies.map((s) => s.update(value));
  }

  add(strat: Indicator) {
    this.strategies.push(strat);
    return strat;
  }

  getMaxWeight(): number {
    const weights = this.strategies.map((w) => w.weight);
    return weights.reduce((p, c) => Math.max(p, c), 0);
  }

  returnResult(cb: any): any {
    return cb();
  }
}
