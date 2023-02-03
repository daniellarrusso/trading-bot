import { BinanceService } from '../services/binance-service';
import { Candle } from './candle';
import { Trader } from '../services/trader-service';
import { TradeResponse } from './trade-response';
import { Ticker } from './ticker';
import { TelegramBot } from './telegram-bot';
import { ChatGroups } from '../../keys';
import { Strategy } from './strategy';
import { Advisor } from './advisor';
import { MarketOrder } from './limit-order';

export class LiveAdvisor extends Advisor {
  trade(price?: number): Promise<TradeResponse> {
    throw new Error('Method not implemented.');
  }
  exchange: BinanceService;
  assetAmount: number;
  currencyAmount: number;
  profitResults = [];
  telegram: TelegramBot;
  trader: Trader;
  ticker: Ticker;

  constructor(public strategy: Strategy) {
    super(strategy.exchange);
    this.telegram = new TelegramBot(ChatGroups.mainAccount);
    this.exchange
      .getTradingBalance()
      .then((ticker: Ticker) => {
        this.assetAmount = +ticker.assetQuantity;
        this.currencyAmount = +ticker.currencyQuantity;
        this.ticker = ticker;
        console.log(
          `Starting Live Trade Advisor: Currency (${ticker.currency} ${this.currencyAmount}). Asset (${ticker.asset} ${this.assetAmount})`
        );
      })
      .catch((err) => console.log(err));
  }

  async long(candle: Candle) {
    this.trader.acivateTrader(candle);
    if (this.trader.inTrade(candle.pair)) {
      const trade: TradeResponse = await this.exchange.placeMarketOrder('buy', 500 / candle.close);
      this.assetAmount += +trade.origQty;
      this.currencyAmount -= +trade.cummulativeQuoteQty;
      this.logBalance(candle);
    } else {
      const message = 'Trying to trade ' + candle.pair + ' Already in trade with ' + this.trader.tradingWith;
      return Promise.reject(message);
    }
  }

  async short(candle: Candle) {
    try {
      const trade: TradeResponse = await this.exchange.placeMarketOrder('sell', 500 / candle.close);
      this.currencyAmount += +trade.cummulativeQuoteQty;
      this.assetAmount -= +trade.origQty;
      this.logBalance(candle);
      this.trader.resetTrader();
    } catch (error) {
      console.log(error);
    }
  }

  calculateQuantity(price: number, side: string): string {
    let quantity = 0;
    if (side === 'BUY') {
      quantity = this.currencyAmount / price;
      this.currencyAmount = 0;
    } else {
      quantity = this.assetAmount * price;
      this.assetAmount = 0;
    }

    return String(quantity);
  }

  logBalance(candle: Candle) {
    console.log(
      `New Balance: Currency (${this.ticker.currency} ${this.currencyAmount}). Asset (${this.ticker.asset} ${this.assetAmount}) `
    );
  }

  addProfitResults(lastSell, lastBuy) {
    const amount = ((lastSell.close - lastBuy.close) / lastBuy.close) * 100;
    this.profitResults.push(amount);
  }

  end(closingPrice: number) {
    throw new Error('Method not implemented.');
  }

  setup() {
    console.log('No setup required');
  }

  async notifyTelegramBot() {
    this.telegram.sendMessage(this.message);
  }
}
