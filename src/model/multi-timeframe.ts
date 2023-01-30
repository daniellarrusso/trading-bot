import { IndicatorStrategy } from '../indicators/indicator-strategies/indicator-strategy';
import { IndicatorStrategies } from '../indicators/indicator-strategies/indicator-strats';
import { Candle } from './candle';
import { Heikin } from './heikin';
import { Indicator } from './indicator';

export class CandlesIndicatorResponse {
  candlesticks: Candle[];
  heikin: Heikin;
  indicator: Indicator;
  lastCandle: Candle;
  indicatorStrategies: IndicatorStrategies = new IndicatorStrategies();
}

export class ApiCallLimiter {
  private _isEnabled: boolean;
  private calls: number = 0;
  constructor(public callLimit = 10000000) {}

  logCall() {
    this.calls++;
  }

  get isEnabled() {
    return this.calls < this.callLimit;
  }

  reset() {
    this.calls = 0;
  }
}
