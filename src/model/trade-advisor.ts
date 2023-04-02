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
import { TradesDb } from '../db/tradesDb';
import { returnPercentageIncrease } from '../utilities/utility';
import { MockExchangeService } from '../services/mock-exchange.service';
import { PaperAdvisor } from './paper-advisor';

export class TradeAdvisor {
  advisor: Advisor;
  candle: Candle;
  trader = Trader.getInstance();
  startingPrice: number;
  roundtripProfit: number;
  initialAction: ActionType;
  lastTradeId: number = -1;

  private ticker: Ticker;
  trades: Trades;
  tradesDb: TradesDb;

  get longPrice() {
    return this.trades.lastBuy?.quotePrice ?? 0;
  }

  get shortPrice() {
    return this.trades.lastSell?.quotePrice ?? 0;
  }
  get isBacktest() {
    return this.advisor instanceof BacktestAdvisor;
  }

  constructor(ticker: Ticker) {
    this.advisor = new BacktestAdvisor(new MockExchangeService(ticker));
    this.ticker = ticker;
    this.initialAction = this.ticker.action;
    this.trades = new Trades(ticker);
  }

  get inTrade() {
    return this.ticker.action === ActionType.Short ? true : false;
  }

  get profit() {
    if (!this.longPrice) return 0;
    return returnPercentageIncrease(this.candle.close, this.longPrice);
  }

  async trade(price?: number, side?: Side) {
    if (!this.canTrade) return;
    this.lastTradeId = this.ticker.candle.time.getTime();
    try {
      if (!this.startingPrice && this.inTrade) this.startingPrice = this.candle.close;
      const res = await this.advisor.trade(price, side);
      await this.setTraderAction(res);
    } catch (error) {
      console.log(error);
    }
  }

  /** Returns whether  */
  get canTrade() {
    return this.ticker.candle.time.getTime() !== this.lastTradeId;
  }

  getTotalProfit() {
    return this.advisor.profitResults.reduce((p, c) => p + c, 0);
  }

  calculateProfit() {
    if (!this.longPrice) return; // no profit to calculate
    this.roundtripProfit = ((this.shortPrice - this.longPrice) / this.longPrice) * 100;
    console.log(`'** ROUNDTRIP COMPLETE ** Profit: ${this.roundtripProfit.toFixed(2)} (${this.ticker.pair})`);
    this.advisor.addProfitResults(this.shortPrice, this.trades.lastBuy);
  }

  async setTraderAction(trade: TradeResponse) {
    await this.trades.addTrade(trade, this.isBacktest);
    this.logMessage(trade);
    this.trader.updateTicker(this.ticker);
    this.ticker.isLong && this.calculateProfit();
    this.ticker.setActionType();
  }

  logMessage(trade: TradeResponse) {
    const { action, asset, currency, candle, tickSize } = this.ticker;
    const quantity = trade.origQty;
    const currencyAmount = this.ticker.normalisePrice(+trade.cummulativeQuoteQty) ?? Settings.usdAmount;
    let message = `${candle.printTime}: ${currencyAmount} ${currency} ${
      ActionType[action]
    } for ${quantity} ${asset}. Entry Price: ${Number(candle.price).normalise(tickSize)}`;

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
    // const action = await this.tradesDb.checkIfAlreadyExists();
    this.ticker.setActionType(this.initialAction);
    this.trader.resetTrader();
  }
}
