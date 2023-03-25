import { Candle } from '../model/candle';
import { ApiAccount } from '../model/api-account';
import { Ticker } from '../model/ticker';
import { SettingsDb } from '../db/settingsDb';
import { Strategy } from '../model/strategy';
import { IExchangeService } from './IExchange-service';
import { Exchange } from '../app';
import { BinanceService } from './binance-service';
import { KrakenService } from './kraken-service';

export class Trader {
  private static instance: Trader;
  private tickers: number;

  public isTrading: boolean;
  public tradingWith: string;
  public apiAccount: ApiAccount;

  tickersTrading: Ticker[] = [];
  strategies: Strategy[] = [];
  settingsDb: SettingsDb = new SettingsDb();

  orderPlaced: boolean;

  private constructor() {}

  static getInstance(tickers: number = 150) {
    if (!Trader.instance) {
      Trader.instance = new Trader();
      Trader.instance.tickers = tickers;
    }
    return Trader.instance;
  }
  async startService() {
    await this.settingsDb.createSettings();
  }

  addStrategy(name: string, exchange: Exchange, ticker: Ticker) {
    const exchangeService = this.createExchange(exchange, ticker);
    const strat = new Strategy(name, exchangeService);
    this.strategies.push(strat);
  }

  createExchange(exchangeName: Exchange, ticker: Ticker) {
    switch (exchangeName) {
      case 'binance':
        return new BinanceService(ticker);
        break;
      case 'kraken':
        return new KrakenService();
        break;
      default:
        throw Error('Error setting up exchange');
        break;
    }
  }

  async refreshTradeSettings() {
    const settings = await this.settingsDb.getSymbols();
    this.setTickers(settings.maxTickers);
    settings.excludedSymbols.forEach((s) => this.removeSymbol(s));
  }

  setTickers(val: number) {
    this.tickers = val;
  }

  getTickers(): number {
    return this.tickers;
  }

  public addTicker(ticker: Ticker): number {
    if (this.canTrade()) return this.tickersTrading.push(ticker);
    return 0;
  }

  public removeTicker(ticker: Ticker) {
    const tickerToRemove = this.tickersTrading.findIndex((t) => t.pair === ticker.pair);
    if (tickerToRemove >= 0) this.tickersTrading.splice(tickerToRemove, 1);
    return tickerToRemove;
  }

  removeSymbol(symbol: string) {
    const deleteIndex = this.tickersTrading.findIndex((t) => t.asset === symbol);
    const res = deleteIndex ? this.tickersTrading.splice(deleteIndex, 1)[0] : null;
    return res;
  }

  public canTrade(): boolean {
    return this.tickersTrading.length < this.tickers;
  }

  public acivateTrader(candle: Candle) {
    if (!this.isTrading) {
      this.isTrading = true;
      this.tradingWith = candle.pair;
    }
  }
  public resetTrader() {
    this.tradingWith = null;
    this.isTrading = false;
    this.tickersTrading.length = 0;
  }

  public inTrade(symbol): boolean {
    const isTrading = (this.isTrading === true && this.tradingWith === symbol) || !this.tradingWith;
    return isTrading;
  }
}
