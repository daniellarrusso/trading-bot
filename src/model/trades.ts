import { TradesDb } from '../db/tradesDb';
import { returnPercentageIncrease } from '../utilities/utility';
import { Ticker } from './ticker';
import { TradeResponse } from './trade-response';

export class Trades {
  tradeResponses: TradeResponse[] = [];
  tradesDb: TradesDb;
  constructor(ticker: Ticker) {
    this.tradesDb = new TradesDb(ticker);
  }

  checkTrades(isBacktest: boolean) {
    if (isBacktest) return;
    console.log(this.lastTrade);
  }

  get lastBuy(): TradeResponse {
    const filtered = this.tradeResponses.filter((tr) => tr.side === 'BUY');
    return filtered[filtered.length - 1];
  }

  get lastSell(): TradeResponse {
    const filtered = this.tradeResponses.filter((tr) => tr.side === 'SELL');
    return filtered[filtered.length - 1];
  }

  get numBought(): number {
    return this.tradeResponses.filter((t) => t.side === 'BUY').length;
  }

  get numSold(): number {
    return this.tradeResponses.filter((t) => t.side === 'SELL').length;
  }

  get lastTrade() {
    return this.tradeResponses[this.tradeResponses.length - 1];
  }

  get lastTradeId(): number {
    if (!this.tradeResponses.length) return -1;
    return this.tradeResponses[this.tradeResponses.length - 1].tradeId;
  }

  get averageBuy() {
    if (this.numBought)
      return (
        this.tradeResponses
          .filter((b) => b.side === 'BUY')
          .map((t) => +t.quotePrice)
          .reduce((p, c) => p + c) / this.numBought
      );
  }

  get averageSold() {
    if (this.numSold)
      return (
        this.tradeResponses
          .filter((b) => b.side === 'SELL')
          .map((t) => +t.quotePrice)
          .reduce((p, c) => p + c) / this.numSold
      );
  }

  get profit() {
    let increase = returnPercentageIncrease(this.averageBuy, this.averageSold);
    if (this.averageSold > this.averageBuy) return Math.abs(+increase);
    return increase;
  }

  deleteTradeResponses() {
    this.tradeResponses = [];
  }
}
