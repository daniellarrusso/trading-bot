import { BinanceService } from '../services/binance-service';
import { Candle } from './candle';
import { Ticker } from './ticker';
import { TelegramBot } from './telegram-bot';
import { ChatGroups, Settings } from '../../keys';
import { Strategy, Portfolio } from './strategy';
import { Advisor } from './advisor';

export class PercentageAdvisor extends Advisor {
  exchange: BinanceService;
  profitResults = [];
  telegram: TelegramBot;
  portfolio: Portfolio;
  ticker: Ticker;

  get currencyQuantity() {
    return Settings.usdAmount;
  }

  constructor(strategy: Strategy) {
    super(strategy.exchange);
    this.telegram = new TelegramBot(ChatGroups.mainAccount);
    this.portfolio = strategy.portfolio;
    if (!this.portfolio) {
      throw new Error('Portfolio not set');
    }
  }
  async setup(): Promise<void> {
    try {
      this.ticker = await this.exchange.getTradingBalance();
      console.log(
        `Starting Percentage Advisor: Currency (${this.ticker.currency} ${this.ticker.currencyQuantity}). Asset (${this.ticker.asset} ${this.ticker.assetQuantity})`
      );
    } catch (error) {
      console.log(error);
    }
  }

  async long(candle: Candle) {
    if (!candle) candle = this.exchange.ticker.candle;
    try {
      await this.exchange.placeMarketOrder('buy', this.currencyQuantity / candle.close);
      await this.logBalance();
    } catch (error) {
      console.log(error);
    }
  }

  async short(candle: Candle) {
    if (!candle) candle = this.exchange.ticker.candle;
    try {
      await this.exchange.placeMarketOrder('sell', this.currencyQuantity / candle.close);
      await this.logBalance();
    } catch (error) {
      console.log(error.body);
    }
  }


  async logBalance() {
    const { currency, asset, assetQuantity, currencyQuantity } = this.ticker;
    try {
      await this.exchange.getTradingBalance();
    } catch (error) {
      let errorMessage = error?.message;
      errorMessage += '. Could not get trading balance'
      console.log(errorMessage)
    }
    console.log(`New Balance: Currency (${currency} ${currencyQuantity}). Asset (${asset} ${assetQuantity}) `);
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
