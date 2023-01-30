import { ActionType } from './enums';
import { Candle } from './candle';
import { Strategy } from './strategy';
import { Trader } from '../services/trader-service';
import { Advisor } from './advisor';
import { BacktestAdvisor } from './backtest-advisor';
import { Ticker } from './ticker';
import { Settings } from '../../keys';

export class TradeAdvisor {
  advisor: Advisor;
  candle: Candle;
  trader: Trader = Settings.trader;
  private _lastBuy: Candle;
  lastSell: Candle;
  startingPrice: number;
  roundtripProfit: number;
  actionType: ActionType = ActionType.Long;
  initialAction: ActionType;
  private ticker: Ticker;
  get lastBuy() {
    return this._lastBuy;
  }
  get lastBuyClose() {
    return this._lastBuy ? this._lastBuy.close : 0;
  }

  constructor(public strategy: Strategy) {
    this.advisor = strategy.advisor;
    this.ticker = strategy.exchange.ticker;
    this.initialAction = this.ticker.action;
    this.initialAction !== this.actionType ? this.ticker.setActionType() : 'no action';
  }

  isLong() {
    return this.actionType === ActionType.Short ? true : false;
  }

  async trade() {
    if (this.actionType === ActionType.Long && this.trader.canTrade()) {
      try {
        if (this.trader.addTicker(this.ticker) === 0) return;
        await this.advisor.long(this.candle);
        if (!this.startingPrice) this.startingPrice = this.candle.close;
        this._lastBuy = this.candle;
        this.actionType = this.ticker.setActionType();
        this.logTrade(this.candle, 'BUY');
      } catch (error) {
        console.log(error);
      }
    } else if (this.actionType === ActionType.Short) {
      try {
        await this.advisor.short(this.candle);
        this.trader.removeTicker(this.ticker);
        this.lastSell = this.candle;
        this.actionType = this.ticker.setActionType();
        this.logTrade(this.candle, 'SELL');
        this.calculateProfit();
      } catch (error) {
        console.log(error);
      }
    }
    const isBackTestMode = this.advisor instanceof BacktestAdvisor;
    if (!isBackTestMode) {
      await this.strategy.tradesDb.trade();
    }
  }

  async goLong() {
    try {
      if (this.trader.addTicker(this.ticker) === 0) return;
      await this.advisor.long(this.candle);
      if (!this.startingPrice) this.startingPrice = this.candle.close;
      this._lastBuy = this.candle;
      this.logTrade(this.candle, 'BUY');
    } catch (error) {
      console.log(error);
    }
  }

  async goShort() {
    try {
      await this.advisor.short(this.candle);
      this.trader.removeTicker(this.ticker);
      this.lastSell = this.candle;
      this.logTrade(this.candle, 'SELL');
    } catch (error) {
      console.log(error);
    }
  }

  getTotalProfit() {
    return this.advisor.profitResults.reduce((p, c) => p + c, 0);
  }

  calculateProfit() {
    if (!this._lastBuy) return; // no profit to calculate
    // this.addProfitResults();
    this.roundtripProfit = ((this.lastSell.close - this._lastBuy.close) / this._lastBuy.close) * 100;
    console.log(`'** ROUNDTRIP COMPLETE ** Profit: ${this.roundtripProfit} (${this.ticker.pair})`);
    this.advisor.addProfitResults(this.lastSell, this._lastBuy);
    this._lastBuy = null; // have sold so reset buy price
  }

  logTrade(candle: Candle, message) {
    console.log(`${candle.time} --- TRADE MESSAGE --- ${candle.pair}  traded ${message} ${candle.price}`);
    this.advisor.notifyTelegramBot();
  }

  async endAdvisor(closingPrice) {
    const prices = {
      closingPrice,
      startingPrice: this.startingPrice,
      lastBuyPrice: this._lastBuy,
    };
    this.advisor.end(prices);
    this._lastBuy = null;
    await this.strategy.tradesDb.checkIfAlreadyExists();
    this.actionType = this.initialAction;
    this.actionType = this.initialAction !== this.actionType ? this.ticker.setActionType() : this.actionType;
    this.trader.resetTrader();
  }
}
