import { BinanceService } from '../services/binance-service';
import { Candle } from './candle';
import { TradeResponse } from './trade-response';
import { Ticker } from './ticker';
import { TelegramBot } from './telegram-bot';
import { ChatGroups } from '../../keys';
import { Strategy, Portfolio } from './strategy';
import { Advisor } from './advisor';

export class PortfolioAdvisor extends Advisor {
  exchange: BinanceService;
  assetAmount: number;
  currencyAmount: number;
  profitResults = [];
  telegram: TelegramBot;
  portfolio: Portfolio;

  constructor(strategy: Strategy) {
    super(strategy.exchange);
    this.telegram = new TelegramBot(ChatGroups.mainAccount);
    this.portfolio = strategy.portfolio;
    if (!this.portfolio) {
      throw new Error('Portfolio not set');
    }
  }

  async setup(): Promise<void> {
    const ticker: Ticker = await this.exchange.getTradingBalance();
    try {
      this.assetAmount = +ticker.assetQuantity;
      this.currencyAmount = +ticker.currencyQuantity;
      this.longQuantity = this.assetAmount;
      console.log(
        `Starting Portfolio Advisor: Currency (${ticker.currency} ${this.currencyAmount}). Asset (${ticker.asset} ${this.assetAmount})`
      );
    } catch (error) {
      console.log(error);
    }
  }

  async long(candle: Candle) {
    if (!candle) candle = this.exchange.ticker.candle;
    try {
      const trade: TradeResponse = await this.exchange.placeMarketOrder('buy', 500 / candle.close);
      this.assetAmount += +trade.origQty;
      this.currencyAmount -= +trade.cummulativeQuoteQty;
      this.longQuantity = 500;
      this.logBalance(candle);
    } catch (error) {
      console.log(error);
    }
  }
  async short(candle: Candle) {
    if (!candle) candle = this.exchange.ticker.candle;
    try {
      const trade: TradeResponse = await this.exchange.placeMarketOrder('sell', 500 / candle.close);
      this.currencyAmount += +trade.cummulativeQuoteQty;
      this.assetAmount -= +trade.origQty;
      this.logBalance(candle);
    } catch (error) {
      console.log(error.body);
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
    const { currency, asset } = this.exchange.ticker;
    console.log(`New Balance: Currency (${currency} ${this.currencyAmount}). Asset (${asset} ${this.assetAmount}) `);
  }

  addProfitResults(lastSell, lastBuy) {
    const amount = ((lastSell.close - lastBuy.close) / lastBuy.close) * 100;
    this.profitResults.push(amount);
  }

  end(closingPrice: number) {
    throw new Error('Method not implemented.');
  }

  async notifyTelegramBot() {
    this.telegram.sendMessage(this.message);
  }
}
