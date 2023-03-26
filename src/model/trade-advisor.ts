import { ActionType } from './enums';
import { Candle } from './candle';
import { Strategy } from './strategy';
import { Trader } from '../services/trader-service';
import { Advisor } from './advisor';
import { BacktestAdvisor } from './backtest-advisor';
import { Ticker } from './ticker';
import { TradeResponse } from './trade-response';
import { ordertypes, Side } from './literals';
import { Trades } from './trades';
import { Settings } from '../../settings';
import { IExchangeService } from '../services/IExchange-service';
import { TradesDb } from '../db/tradesDb';

export class TradeAdvisor {
  advisor: Advisor;
  candle: Candle;
  private _lastBuy: Candle;
  lastSell: Candle;
  trader = Trader.getInstance();
  startingPrice: number;
  roundtripProfit: number;
  initialAction: ActionType;
  actionType: ActionType;
  private ticker: Ticker;
  trades: Trades = new Trades();
  tradesDb: TradesDb;
  get lastBuy() {
    return this._lastBuy;
  }
  get lastBuyClose() {
    return this._lastBuy ? this._lastBuy.close : 0;
  }
  get isBacktest() {
    return this.advisor instanceof BacktestAdvisor;
  }

  constructor(public exchange: IExchangeService) {
    this.advisor = new BacktestAdvisor(exchange);
    this.ticker = exchange.ticker;
    this.initialAction = this.ticker.action;
    this.actionType = this.ticker.action;
    this.tradesDb = new TradesDb(this.ticker);
    if (this.isBacktest && this.initialAction === ActionType.Short)
      this.actionType = this.ticker.setActionType();
  }

  async init() {
    await this.tradesDb.createNewPosition(0, this.initialAction);
  }

  get isLong() {
    return this.actionType === ActionType.Short ? true : false;
  }

  formatQuantity(qty: number) {
    return this.exchange.exchange.roundStep(+qty, this.ticker.stepSize);
  }

  async trade(price?: number, side?: Side) {
    if (!this.trader.canTrade()) return;
    try {
      if (!this.startingPrice && this.isLong) this.startingPrice = this.candle.close;
      const res = await this.advisor.trade(price, side);
      this.trades.trades.push(res);
      await this.logTrade(res);
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
    console.log(`'** ROUNDTRIP COMPLETE ** Profit: ${this.roundtripProfit.toFixed(2)} (${this.ticker.pair})`);
    this.advisor.addProfitResults(this.lastSell, this._lastBuy);
    this._lastBuy = null; // have sold so reset buy price
  }

  async logTrade(trade: TradeResponse) {
    this.logMessage(trade);
    this.setTraderAction();
    await this.logTradeDb(this.isBacktest);
  }

  async logTradeDb(isBackTest: boolean) {
    if (!isBackTest) await this.tradesDb.trade();
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
    const { action, asset, currency, candle, tickSize } = this.ticker;
    const quantity = trade.origQty ?? this.formatQuantity(Settings.usdAmount / candle.close);
    const currencyAmount = trade.cummulativeQuoteQty ?? Settings.usdAmount;

    let message = `${candle.printTime}: ${currencyAmount} ${currency} ${
      ActionType[action]
    } on ${quantity} ${asset}. Entry Price: ${Number(candle.price).normalise(tickSize)}`;

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
    const action = await this.tradesDb.checkIfAlreadyExists();
    this.actionType = this.ticker.setActionType(action);
    this.trader.resetTrader();
  }
}
