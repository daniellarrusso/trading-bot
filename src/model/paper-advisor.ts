import { TradeResponse } from './trade-response';
import { TelegramBot } from './telegram-bot';
import { ChatGroups } from '../../settings';
import { Advisor } from './advisor';
import { ordertypes, Side } from './literals';
import { IExchangeService } from '../services/IExchange-service';
import { ActionType } from './enums';
import { MockExchangeService } from '../services/mock-exchange.service';
import { Ticker } from './ticker';
import { LimitOrder } from './limit-order';

export class PaperAdvisor extends Advisor {
  assetAmount = 0;
  currencyAmount = 10000;
  profitResults = [];
  telegram: TelegramBot;
  longQuantity: number;
  ticker: Ticker;
  orderType: ordertypes;

  constructor(public exchange: IExchangeService) {
    super(new MockExchangeService(exchange.ticker));
    this.telegram = new TelegramBot(ChatGroups.mainAccount);
    this.ticker = exchange.ticker;
    if (!(this.exchange instanceof MockExchangeService))
      this.exchange = new MockExchangeService(exchange.ticker);
  }
  notifyTelegramBot(message: string): void {
    // this.telegram.sendMessage(message);
  }

  async trade(price?: number, side?: Side): Promise<TradeResponse> {
    if (!price) price = this.ticker.candle.close;
    if (!side) side = this.ticker.action === ActionType.Long ? 'buy' : 'sell';
    const quantity = this.ticker.currencyAmount / price;
    try {
      const response: TradeResponse = await this.exchange.createOrder(
        new LimitOrder(price, quantity, side),
        this.ticker.isMarketOrders
      );
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  setup() {
    return new Promise((resolve, reject) => {
      console.log('Paper Trading Setup');
      resolve(1);
    });
  }

  async logBalance() {
    try {
      // await this.exchange.getTradingBalance();
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

  addProfitResults(lastSell: number, lastBuy: TradeResponse) {
    const amount = ((lastSell - lastBuy.quotePrice) / lastBuy.quotePrice) * 100;
    if (amount) this.profitResults.push(+amount.toFixed(2));
  }

  end(closingPrice: any) {
    throw new Error('Method not implemented.');
  }
}
