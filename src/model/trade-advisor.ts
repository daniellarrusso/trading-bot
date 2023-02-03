import { ActionType } from './enums';
import { Candle } from './candle';
import { Strategy } from './strategy';
import { Trader } from '../services/trader-service';
import { Advisor } from './advisor';
import { BacktestAdvisor } from './backtest-advisor';
import { Ticker } from './ticker';
import { Settings } from '../../keys';
import { TradeResponse } from './trade-response';

export class TradeAdvisor {
  advisor: Advisor;
  candle: Candle;
  trader: Trader = Settings.trader;
  private _lastBuy: Candle;
  lastSell: Candle;
  startingPrice: number;
  roundtripProfit: number;
  initialAction: ActionType;
  actionType: ActionType;
  private ticker: Ticker;
  get lastBuy() {
    return this._lastBuy;
  }
  get lastBuyClose() {
    return this._lastBuy ? this._lastBuy.close : 0;
  }
  get isBacktest() {
    return this.advisor instanceof BacktestAdvisor;
  }

  constructor(public strategy: Strategy) {
    this.advisor = strategy.advisor;
    this.ticker = strategy.exchange.ticker;
    this.initialAction = this.ticker.action;
    this.actionType = this.ticker.action;
    if (this.isBacktest && this.initialAction === ActionType.Short)
      this.actionType = this.ticker.setActionType();
  }

  async init() {
    await this.strategy.tradesDb.createNewPosition(0, this.initialAction);
  }

  get isLong() {
    return this.actionType === ActionType.Short ? true : false;
  }

  async trade() {
    if (!this.trader.canTrade()) return;
    try {
      const res = await this.advisor.trade();
      await this.logTrade(res);
    } catch (error) {
      console.log(error);
    }
  }

  async goLong() {
    try {
      if (this.trader.addTicker(this.ticker) === 0) return;
      const res = await this.advisor.long(this.candle);
      if (!this.startingPrice) this.startingPrice = this.candle.close;
      this._lastBuy = this.candle;
      this.logTrade(res);
    } catch (error) {
      console.log(error);
    }
  }

  async goShort() {
    try {
      const res = await this.advisor.short(this.candle);
      this.trader.removeTicker(this.ticker);
      this.lastSell = this.candle;
      this.logTrade(res);
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

  async logTrade(trade: TradeResponse) {
    await this.strategy.logTradeDb(this.isBacktest);
    this.logMessage(trade);
    this.setTraderAction();
  }

  setTraderAction() {
    if (!this.isLong) {
      // will buy {
      this.trader.addTicker(this.ticker);
      this._lastBuy = this.candle;
    } else {
      this.trader.removeTicker(this.ticker);
      this.lastSell = this.candle;
      this.calculateProfit();
    }
    this.actionType = this.ticker.setActionType();
  }

  logMessage(trade: TradeResponse) {
    const { action, asset, currency, candle } = this.ticker;
    let message = `${Settings.usdAmount}+${currency} ${ActionType[action]} on ${trade.cummulativeQuoteQty}+${asset}. Entry Price: ${candle.price}`;
    console.log(message);
    this.advisor.notifyTelegramBot(message);
  }

  async endAdvisor(closingPrice) {
    const prices = {
      closingPrice,
      startingPrice: this.startingPrice,
      lastBuyPrice: this._lastBuy,
    };
    this.advisor.end(prices);
    this._lastBuy = null;
    if (this.actionType !== this.initialAction) this.actionType = this.ticker.setActionType();
    this.trader.resetTrader();
  }
}
