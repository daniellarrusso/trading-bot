import { Indicator } from '../model/indicator';
import { Candle } from '../model/candle';
import { CCI } from './cci';

export class SniperCCI extends Indicator {
  constant: number;
  cci: CCI;
  e1: number;
  e1Prev: number;
  e2: number;
  e2Prev: number;
  e3: number;
  e3Prev: number;
  e4: number;
  e4Prev: number;
  e5: number;
  e5Prev: number;
  e6: number;
  e6Prev: number;

  constructor(public settings) {
    super(settings);
    this.constant = 0.618;
    this.e1Prev = this.e2Prev = this.e3Prev = this.e4Prev = this.e5Prev = this.e6Prev = 0;
    this.cci = new CCI(settings);
  }
  update(close) {
    this.cci.update(close);
    this.previousResult = this.result;
    let b2 = this.constant * this.constant;
    let b3 = b2 * this.constant;
    let c1 = -b3;
    let c2 = 3 * (b2 + b3);
    let c3 = -3 * (2 * b2 + this.constant + b3);
    let c4 = 1 + 3 * this.constant + b3 + 3 * b2;
    let nn = 5; // get from somewhere
    let nr = 1 + 0.5 * (nn - 1);
    let w1 = 2 / (nr + 1);
    let w2 = 1 - w1;
    if (!this.e1Prev) this.e1Prev = 0;
    this.e1 = w1 * this.cci.result + w2 * this.e1Prev;
    if (!this.e2Prev) this.e2Prev = 0;
    this.e2 = w1 * this.e1 + w2 * this.e2Prev;
    if (!this.e3Prev) this.e3Prev = 0;
    this.e3 = w1 * this.e2 + w2 * this.e3Prev;
    if (!this.e4Prev) this.e4Prev = 0;
    this.e4 = w1 * this.e3 + w2 * this.e4Prev;
    if (!this.e5Prev) this.e5Prev = 0;
    this.e5 = w1 * this.e4 + w2 * this.e5Prev;
    if (!this.e6Prev) this.e6Prev = 0;
    this.e6 = w1 * this.e5 + w2 * this.e6Prev;

    let xccir = c1 * this.e6 + c2 * this.e5 + c3 * this.e4 + c4 * this.e3;
    this.e1Prev = this.e1;
    this.e2Prev = this.e2;
    this.e3Prev = this.e3;
    this.e4Prev = this.e4;
    this.e5Prev = this.e5;
    this.e6Prev = this.e6;
    this.result = xccir;
  }

  reset() {
    throw new Error('Method not implemented.');
  }
}
