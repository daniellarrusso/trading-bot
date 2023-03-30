import { ApiAccount } from '../model/api-account';
import { Ticker } from '../model/ticker';
import { SettingsDb } from '../db/settingsDb';
import { MongoDbConnection } from '../db/database-connection';
import { Strat } from '../model/interfaces/strat';

export class Trader {
  private static instance: Trader;

  apiAccount: ApiAccount;
  tickersTrading: Ticker[] = [];
  private _strategies: Strat[] = [];
  settingsDb: SettingsDb = new SettingsDb();
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
    }
    return Trader.instance;
  }
  async startService() {
    const db = new MongoDbConnection();
    await db.connect(); // connect to database
    await this.settingsDb.createSettings();
  }

  addStrategy(strats: Strat[]) {
    strats.map((s) => this._strategies.push(s));
  }

  async refreshTradeSettings() {
    const settings = await this.settingsDb.createSettings();
    settings.excludedPairs.map((pair) => this.removeTicker(pair));
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
