import { BinanceService } from '../services/binance-service';
import { Candle } from './candle';
import { Ticker } from './ticker';
import { TelegramBot } from './telegram-bot';
import { ChatGroups, Settings } from '../../keys';
import { Strategy, Portfolio } from './strategy';
import { Advisor } from './advisor';
import { TradeResponse } from './trade-response';
import { ActionType } from './enums';
import { Side } from './literals';

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

  async trade(price?: number) {
    if (!price) price = this.ticker.candle.close;
    const side: Side = this.ticker.action === ActionType.Long ? 'buy' : 'sell';
    const quantity = this.currencyQuantity / price;
    try {
      const response: TradeResponse = await this.exchange.placeMarketOrder(side, quantity);
      await this.logBalance();
      console.log(response);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async long(candle: Candle) {
    // if (!candle) candle = this.exchange.ticker.candle;
    // try {
    //   const response: TradeResponse = this.exchange.placeMarketOrder('buy', this.currencyQuantity / candle.close);
    //   await this.logBalance();
    //   return response;
    // } catch (error) {
    //   console.log(error);
    // }
  }

  async short(candle: Candle) {
    // if (!candle) candle = this.exchange.ticker.candle;
    // try {
    //   const response: TradeResponse = this.exchange.placeMarketOrder('sell', this.currencyQuantity / candle.close);
    //   await this.logBalance();
    //   return response;
    // } catch (error) {
    //   console.log(error.body);
    // }
  }

  async logBalance() {
    try {
      await this.exchange.getTradingBalance();
      const { currency, asset, assetQuantity, currencyQuantity } = this.ticker;
      console.log(
        `New Balance: Currency (${currency} ${currencyQuantity}). Asset (${asset} ${assetQuantity}) `
      );
    } catch (error) {
      let errorMessage = error?.message;
      errorMessage += '. Could not get trading balance';
      console.log(errorMessage);
    }
  }

  addProfitResults(lastSell, lastBuy) {
    const amount = ((lastSell.close - lastBuy.close) / lastBuy.close) * 100;
    this.profitResults.push(amount);
  }

  end(closingPrice: number) {
    throw new Error('Method not implemented.');
  }

  async notifyTelegramBot(message: string): Promise<void> {
    await this.telegram.sendMessage(message);
  }
}
