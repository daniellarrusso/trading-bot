import { Candle } from './candle';

export class IndicatorSettings {
  constructor(
    public weight: number,
    public maWeight?: number,
    public weights?: number[],
    public name?: string,
    public input?: string,
    public inputType?: string
  ) {}
}

export abstract class Indicator {
  name: string;
  age = 0;
  type = 'Indicator';
  input = 'close';
  inputType = 'candle';
  candle: Candle;
  result: number;
  previousResult;
  weight: number;
  maWeight: number = 14;
  trend: any;
  manualUpdate: boolean = false;
  movingAverage: number;
  resultEntity: { high: number; low: number; average: number } = { high: 0, low: 10000000, average: 0 };

  constructor(public settings: IndicatorSettings) {
    this.weight = settings.weight;
    this.name = settings.name;
    this.maWeight = settings.maWeight ? settings.maWeight : this.maWeight;
    if (settings.input) {
      this.input = settings.input;
      this.inputType = settings.inputType;
    }
  }

  abstract update(entity: any);
  abstract reset();

  returnPercentageIncrease(percent: number = 0) {
    const increase = ((this.result - this.previousResult) / this.previousResult) * 100;
    this.trend = {
      percentageIncrease: increase,
      isIncrease: increase >= percent,
    };
  }

  percentageDifference(newNumber, originalNumber) {
    const increase = ((newNumber - originalNumber) / originalNumber) * 100;
    return increase;
  }

  round(tickSize) {
    var precision = 100000000;
    var t = this.getPrecision(tickSize);

    if (Number.isInteger(t)) precision = Math.pow(10, t);

    this.result *= precision;
    this.result = Math.floor(this.result);
    this.result = this.result /= precision;

    // https://gist.github.com/jiggzson/b5f489af9ad931e3d186
    // amount = scientificToDecimal(amount);
  }
  // Effectively counts the number of decimal places, so 0.001 or 0.234 results in 3
  getPrecision(tickSize) {
    if (!isFinite(tickSize)) return 0;
    var e = 1,
      p = 0;
    while (Math.round(tickSize * e) / e !== tickSize) {
      e *= 10;
      p++;
    }
    return p;
  }
}
