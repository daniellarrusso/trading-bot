import { Candle } from './candle';
import { TelegramBot } from './telegram-bot';
import { ChatGroups } from '../../keys';
import { IExchangeService } from '../services/IExchange-service';
import { TradeResponse } from './trade-response';
import { ordertypes, Side } from './literals';

export abstract class Advisor {
  profitResults: number[];
  longQuantity = 0;
  message: string = '';

  constructor(public exchange: IExchangeService) {}

  abstract trade(price?: number, side?: Side): Promise<TradeResponse>;
  abstract end(closingPrice: any);
  abstract notifyTelegramBot(message: string): void;
  abstract addProfitResults(lastSell: Candle, lastBuy: Candle);
  doSetup(sendMessage: boolean, orderType: ordertypes): void {
    const messageService = new TelegramBot(ChatGroups.mainAccount);
    const message = `${this.constructor.name} started: ${this.exchange.ticker.pair}`;
    if (sendMessage) messageService.sendMessage(message);
    this.setup(orderType);
  }
  protected abstract setup(orderType: ordertypes);
}
