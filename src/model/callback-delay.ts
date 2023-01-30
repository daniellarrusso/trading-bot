import { Delay } from './interfaces/delay';

export class CallbackDelay implements Delay {
  ticks: number;
  cb: any;
  constructor(ticks: number, cb?) {
    this.ticks = ticks;
    this.cb = cb;
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
