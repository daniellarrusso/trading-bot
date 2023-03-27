import { Candle } from '../model/candle';
import { Indicator } from '../model/indicator';
import { SMA } from './sma';

export class ElliotWave extends Indicator {
  smaShort: Indicator;
  smaLong: Indicator;
  constructor(public settings) {
    super(settings);
    this.input = null;
    this.smaShort = new SMA({ weight: settings.weights[0], name: 'short' });
    this.smaLong = new SMA({ weight: settings.weights[1], name: 'long' });
  }
  update(candle: Candle) {
    this.previousResult = this.result ? this.result : 0;
    this.smaShort.update(candle.close);
    this.smaLong.update(candle.close);
    const smaShortResult = this.smaShort.result;
    const smaLongResult = this.smaLong.result;
    this.result = Number(this.percentageDifference(smaShortResult, smaLongResult).toFixed(2));
  }
  reset() {}
}
