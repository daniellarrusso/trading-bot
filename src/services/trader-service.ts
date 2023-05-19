import { ApiAccount } from '../model/api-account';
import { Ticker } from '../model/ticker';
import connect from '../db/database-connection';
import { Strat } from '../model/interfaces/strat';
import { TradeModel } from '../db/tradesDb';
import { TradeResponse } from '../model/trade-response';

export class Trader {
  private static instance: Trader;
  instances: number = 0;
  apiAccount: ApiAccount;
  tickersTrading: Ticker[] = [];
  private _strategies: Strat[] = [];
  orderPlaced: boolean;

  get strategies() {
    const template = this._strategies.find((s) => s.strategyName === 'Test');
    if (template) return this._strategies.filter((s, i) => s === template);
    return this._strategies;
  }

  private constructor() {}

  static getInstance() {
    if (!Trader.instance) {
      Trader.instance = new Trader();
      connect(); // connect to database
    }
    Trader.instance.instances++;
    console.log(Trader.instance.instances);
    return Trader.instance;
  }

  async trade(trade: TradeResponse) {
    const doc = await TradeModel.findOne({ ticker: trade.symbol });
    if (doc) {
      doc.transactions.push(trade);
      await doc.save();
    }
  }

  async updateCurrencyAmount(ticker: Ticker) {
    const doc = await TradeModel.findOne({ ticker: ticker.pair });
    if (doc) ticker.currencyAmount = doc.currencyQuantity;
  }

  async addTradeModel(ticker: Ticker) {
    const res = await TradeModel.findOne({ ticker: ticker.pair });
    if (res) return;
    const doc = new TradeModel({
      currencyQuantity: ticker.currencyAmount,
      ticker: ticker.pair,
      transactions: [],
    });
    await doc.save();
  }

  async addStrategy(strats: Strat[]) {
    strats.map((s) => this._strategies.push(s));
    for (let i = 0; i < this._strategies.length; i++)
      await this.addTradeModel(this._strategies[i].exchange.ticker);
  }

  updateTicker(ticker: Ticker) {
    ticker.isLong ? this.removeTicker(ticker) : this.addTicker(ticker);
  }

  addTicker(ticker: Ticker): number {
    return this.tickersTrading.push(ticker);
  }

  removeTicker(ticker: Ticker | string) {
    if (typeof ticker !== 'string') ticker = ticker.pair;
    const tickerToRemove = this.tickersTrading.findIndex((t) => t.pair === ticker);
    if (tickerToRemove >= 0) this.tickersTrading.splice(tickerToRemove, 1);
    return tickerToRemove;
  }

  removeStrategy(pair: string) {
    this._strategies = this._strategies.filter((s) => s.exchange.ticker.pair !== pair);
  }

  public resetTrader() {
    this.tickersTrading.length = 0;
  }
}
