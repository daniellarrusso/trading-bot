import { Candle } from './candle';
import { Interval, Intervals } from '../model/interval-converter';

export class CandleStatistics {
  candleHistory: Candle[] = [];
  candleHistorySlice: Candle[] = [];
  price: number;
  candleSticks: Candle[] = [];
  lowerLow: boolean;
  higherHigh: boolean;
  daysWorth = [];
  averageForDay: number;
  intervalsInDay: number = 0;

  constructor(interval: string) {
    this.intervalsInDay = Intervals.find((i) => i.interval === interval).day;
  }

  drawRenkoChart(brickSize: number) {
    const prices = this.candleSticks.map((c) => c.close);
    const renkoData = [];
    let currentBrick = {
      open: prices[0],
      close: prices[0],
      isUp: true, // Start with an up brick
    };

    for (let i = 1; i < prices.length; i++) {
      const price = prices[i];
      const priceDiff = Math.abs(price - currentBrick.close);

      // Check if a new brick needs to be added
      if (priceDiff >= brickSize) {
        const brickCount = Math.floor(priceDiff / brickSize);

        // Create new bricks
        for (let j = 0; j < brickCount; j++) {
          const newBrick = {
            open: currentBrick.close,
            close: currentBrick.close + (currentBrick.isUp ? brickSize : -brickSize),
            isUp: !currentBrick.isUp,
          };
          // newBrick.isUp = newBrick.close > newBrick.open;
          renkoData.push(newBrick);
          currentBrick = newBrick;
        }
      }

      // Update the current brick
      currentBrick.close = price;
    }

    // Add the final brick
    renkoData.push(currentBrick);

    return renkoData;
  }

  get olhcHistorySize() {
    if (!this.candleHistory.length) return 0;
    return this.candleHistory.length;
  }

  getOHLCHistory = (lookBackPeriod: number): Candle[] => {
    const size = this.olhcHistorySize - lookBackPeriod;
    return this.candleHistory.slice(size);
  };

  getHighLowForPeriod = (lookBackPeriod: number, isHigh: boolean): number => {
    if (!isHigh) return Math.min(...this.getOHLCHistory(lookBackPeriod).map((c) => c.low));

    return Math.max(...this.getOHLCHistory(lookBackPeriod).map((c) => c.high));
  };

  getAverageForPeriod = (lookBackPeriod: number, ohlc: string) => {
    if (lookBackPeriod > this.olhcHistorySize) return 0;
    const length = this.getOHLCHistory(lookBackPeriod).length;
    return (
      this.getOHLCHistory(lookBackPeriod)
        .map((c) => c[ohlc])
        .reduce((p, c) => p + c, 0) / length
    );
  };

  calculateStatistics(candle: Candle) {
    this.lowerLow = candle.low < this.getHighLowForPeriod(this.olhcHistorySize, false);
    this.higherHigh = candle.high > this.getHighLowForPeriod(this.olhcHistorySize, true);
    this.candleHistory.push(candle);
    this.candleSticks.push(candle);

    const index = this.candleSticks.findIndex((c) => c.time.getHours() === 0);

    if (index >= 0) {
      this.daysWorth = this.candleSticks.filter((c, i) => i >= index);
      this.averageForDay = this.daysWorth.reduce((a, o) => a + o.close, 0) / this.daysWorth.length;
    }

    if (this.candleSticks.length >= 100) {
      this.candleSticks.shift();
    }
  }

  private getCandleLength = (): number => this.candleSticks.length - 1;

  fetchPeriod = (period: number): Candle => this.candleSticks[this.getCandleLength() - period];

  logStats(): void {
    // console.log(`High: ${this.highestPrice}. Low: ${this.lowestPrice}. Average: ${this.averagePrice}. Price: ${this.price}`);
  }
}
