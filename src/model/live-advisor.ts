import { BinanceService } from '../services/binance-service';
import { Ticker } from './ticker';
import { TelegramBot } from './telegram-bot';
import { ChatGroups, Settings } from '../../settings';
import { Advisor } from './advisor';
import { TradeResponse } from './trade-response';
import { ActionType } from './enums';
import { ordertypes, Side } from './literals';
import { Portfolio } from './portfolio';
import { IExchangeService } from '../services/IExchange-service';

export class LiveAdvisor extends Advisor {
  exchange: BinanceService;
  profitResults = [];
  telegram: TelegramBot;
  portfolio: Portfolio;
  ticker: Ticker;
  orderType: ordertypes;

  get currencyQuantity() {
    return Settings.usdAmount;
  }

  constructor(exchange: IExchangeService) {
    super(exchange);
    this.telegram = new TelegramBot(ChatGroups.mainAccount);

    if (!this.portfolio) {
      throw new Error('Portfolio not set');
    }
  }
  async setup(orderType: ordertypes): Promise<void> {
    this.orderType = orderType;
    try {
      this.ticker = await this.exchange.getTradingBalance();
      console.log(
        `Starting Percentage Advisor: Currency (${this.ticker.currency} ${this.ticker.currencyQuantity}). Asset (${this.ticker.asset} ${this.ticker.assetQuantity})`
      );
    } catch (error) {
      console.log(error);
    }
  }

  async trade(price?: number, side?: Side) {
    if (!price) price = this.ticker.candle.close;
    if (!side) side = this.ticker.action === ActionType.Long ? 'buy' : 'sell';
    const quantity = this.currencyQuantity / price;
    try {
      const response: TradeResponse = await this.exchange[this.orderType](side, quantity);
      await this.logBalance();
      console.log(response);
      return response;
    } catch (error) {
      console.log(error);
    }
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
