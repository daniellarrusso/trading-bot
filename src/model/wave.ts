import { Candle } from './candle';

export class Wave {
  active: boolean;
  hoursActive = 48;
  stop: number;
  short: number;
  createdCandle: Candle;
  activatedCandle: Candle;
  constructor(public low: number, public high: number, candle?) {
    this.active = true;
    this.createdCandle = candle;
  }

  activateWave(candle?: Candle) {
    this.activatedCandle = candle;
    this.short = this.high + (this.high - this.low) * 0.618;
    this.stop = this.high - (this.high - this.low) * 0.618;
  }
  decrement() {
    this.active ? this.hoursActive-- : 0;
    if (this.hoursActive === 0) {
      this.active = false;
    }
  }
}
