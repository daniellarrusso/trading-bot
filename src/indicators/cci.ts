import { Indicator } from '../model/indicator';
import { Candle } from '../model/candle';

export class CCI extends Indicator {
  size = 0;
  hist = [];
  result: number;
  avgtp: number;
  tp = 0.0;
  constant: number;
  mean = 0.0;

  constructor(public settings) {
    super(settings);
    this.constant = 0.015;
    for (var i = 0; i < this.weight; i++) this.hist.push(0.0);
  }
  update(close: number) {
    var tp = close;

    if (this.size < this.weight) {
      this.hist[this.size] = tp;
      this.size++;
    } else {
      for (var i = 0; i < this.weight - 1; i++) {
        this.hist[i] = this.hist[i + 1];
      }
      this.hist[this.weight - 1] = tp;
    }

    if (this.size < this.weight) {
      this.result = 0;
    } else {
      this.calculate(tp);
    }
  }

  calculate(close) {
    var sumtp = 0.0;

    for (var i = 0; i < this.size; i++) {
      sumtp = sumtp + this.hist[i];
    }

    this.avgtp = sumtp / this.size;

    this.tp = close;

    var sum = 0.0;
    // calculate tps
    for (var i = 0; i < this.size; i++) {
      var z = this.hist[i] - this.avgtp;
      if (z < 0) z = z * -1.0;
      sum = sum + z;
    }

    this.mean = sum / this.size;

    this.result = (this.tp - this.avgtp) / (this.constant * this.mean);
  }

  reset() {
    throw new Error('Method not implemented.');
  }
}
