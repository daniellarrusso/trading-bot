import { Candle } from './candle';
import { BinanceService } from '../services/binance-service';
import { ActionType } from './enums';
import { TelegramBot } from './telegram-bot';
import { ChatGroups } from '../../keys';
import { IExchangeService } from '../services/IExchange-service';

export abstract class Advisor {
  actionType: ActionType;
  profitResults: number[];
  longQuantity = 0;
  message: string = '';

  constructor(public exchange: IExchangeService) {}

  abstract long(candle: Candle, amount?: number);
  abstract short(candle: Candle, half?: boolean);
  abstract end(closingPrice: any);
  abstract notifyTelegramBot(): void;
  abstract addProfitResults(lastSell: Candle, lastBuy: Candle);
  doSetup(sendMessage: boolean): void {
    const messageService = new TelegramBot(ChatGroups.mainAccount);
    const message = `${this.constructor.name} started: ${this.exchange.ticker.pair}`;
    if (sendMessage) messageService.sendMessage(message);
    this.setup();
  }
  protected abstract setup();
}
