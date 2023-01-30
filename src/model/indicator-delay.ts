import { Delay } from './interfaces/delay';
import { Indicator } from './indicator';

export class IndicatorDelay implements Delay {
  ticks: number;
  cb: any;
  constructor(ticks: number, cb?) {
    this.ticks = ticks;
  }
  incrementDelay() {
    throw new Error('Method not implemented.');
  }

  decrementDelay(): boolean {
    --this.ticks;
    if (this.cb) {
      return this.cb();
    } else {
      return this.ticks > 0;
    }
  }
}
