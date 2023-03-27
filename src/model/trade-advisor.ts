import { ActionType } from './enums';
import { Candle } from './candle';
import { Trader } from '../services/trader-service';
import { Advisor } from './advisor';
import { BacktestAdvisor } from './backtest-advisor';
import { Ticker } from './ticker';
import { TradeResponse } from './trade-response';
import { Side } from './literals';
import { Trades } from './trades';
import { Settings } from '../../settings';
import { IExchangeService } from '../services/IExchange-service';
import { TradesDb } from '../db/tradesDb';
import { returnPercentageIncrease } from '../utilities/utility';

export class TradeAdvisor {
  advisor: Advisor;
  candle: Candle;
  trader = Trader.getInstance();
  startingPrice: number;
  roundtripProfit: number;
  initialAction: ActionType;
  actionType: ActionType;
  private ticker: Ticker;
  trades: Trades = new Trades();
  tradesDb: TradesDb;

  get longPrice() {
    return this.trades.lastBuy.price ?? 0;
  }

  get shortPrice() {
    return this.trades.lastSell.price ?? 0;
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
    // await this.tradesDb.createNewPosition(0, this.initialAction);
  }

  get isLong() {
    return this.actionType === ActionType.Short ? true : false;
  }

  get profit() {
    return returnPercentageIncrease(this.candle.close, this.longPrice);
  }

  formatQuantity(qty: number) {
    return this.exchange.exchange.roundStep(+qty, this.ticker.stepSize);
  }

  async trade(price?: number, side?: Side) {
    if (!this.canTrade) return;
    try {
      if (!this.startingPrice && this.isLong) this.startingPrice = this.candle.close;
      const res = await this.advisor.trade(price, side);
      this.trades.tradeResponses.push(res);
      await this.logTrade(res);
    } catch (error) {
      console.log(error);
    }
  }

  get canTrade() {
    return this.trader.canTrade() && this.candle.time.getTime() !== this.trades.lastTradeId;
  }

  getTotalProfit() {
    return this.advisor.profitResults.reduce((p, c) => p + c, 0);
  }

  calculateProfit() {
    if (!this.longPrice) return; // no profit to calculate
    this.roundtripProfit = ((this.shortPrice - this.longPrice) / this.longPrice) * 100;
    console.log(`'** ROUNDTRIP COMPLETE ** Profit: ${this.roundtripProfit.toFixed(2)} (${this.ticker.pair})`);
    this.advisor.addProfitResults(this.trades.lastSell, this.trades.lastBuy);
    // this._lastBuy = null; // have sold so reset buy price
  }

  async logTrade(trade: TradeResponse) {
    try {
      await this.logTradeDb(this.isBacktest);
      this.logMessage(trade);
      this.setTraderAction();
    } catch (error) {
      throw error;
    }
  }

  async logTradeDb(isBackTest: boolean) {
    if (!isBackTest) await this.tradesDb.trade(this.trades.lastTrade);
  }

  setTraderAction() {
    if (!this.isLong) {
      // will buy {
      this.trader.addTicker(this.ticker);
    } else {
      this.trader.removeTicker(this.ticker);
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
      lastBuyPrice: this.longPrice,
    };
    this.advisor.end(prices);
    this.trades.deleteTradeResponses();
    const action = await this.tradesDb.checkIfAlreadyExists();
    this.actionType = this.ticker.setActionType(action || this.initialAction);
    this.trader.resetTrader();
  }
}
