import { returnPercentageIncrease } from '../utilities/utility';
import { TradeResponse } from './trade-response';

export class Trades {
  trades: TradeResponse[] = [];

  get numBought(): number {
    return this.trades.filter((t) => t.side === 'BUY').length;
  }

  get numSold(): number {
    return this.trades.filter((t) => t.side === 'SELL').length;
  }

  get averageBuy() {
    if (this.numBought)
      return (
        this.trades
          .filter((b) => b.side === 'BUY')
          .map((t) => t.price)
          .reduce((p, c) => p + c) / this.numBought
      );
  }

  get averageSold() {
    if (this.numSold)
      return (
        this.trades
          .filter((b) => b.side === 'SELL')
          .map((t) => t.price)
          .reduce((p, c) => p + c) / this.numSold
      );
  }

  get profit() {
    let increase = returnPercentageIncrease(this.averageBuy, this.averageSold);
    if (this.averageSold > this.averageBuy) return Math.abs(increase);
    return increase;
  }
}
