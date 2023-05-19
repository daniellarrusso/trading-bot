import { Candle } from './candle';
import { TelegramBot } from './telegram-bot';
import { ChatGroups, Settings } from '../../settings';
import { IExchangeService } from '../services/IExchange-service';
import { TradeResponse } from './trade-response';
import { ordertypes, Side } from './literals';

export abstract class Advisor {
  profitResults: number[];
  longQuantity = 0;
  message: string = '';
  isMarketOrders = Settings.marketOrders;

  constructor(public exchange: IExchangeService) {}

  abstract trade(price?: number, side?: Side): Promise<TradeResponse>;
  abstract end(closingPrice: any);
  abstract notifyTelegramBot(message: string): void;
  abstract addProfitResults(close: number, lastBuy: TradeResponse);
  async doSetup(sendMessage: boolean, orderType: ordertypes): Promise<void> {
    const messageService = new TelegramBot(ChatGroups.mainAccount);
    const message = `${this.constructor.name} started: ${this.exchange.ticker.pair}`;
    if (sendMessage) messageService.sendMessage(message);
    await this.setup(orderType);
  }
  protected abstract setup(orderType: ordertypes);
}
