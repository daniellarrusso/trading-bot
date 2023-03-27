import { ChatGroups } from '../../settings';
import { IExchangeService } from '../services/IExchange-service';
import { KrakenService } from '../services/kraken-service';
import { Advisor } from './advisor';
import { Candle } from './candle';
import { ActionType } from './enums';
import { TelegramBot } from './telegram-bot';
import { TradeResponse } from './trade-response';

const ks = new KrakenService();

export class DCAAdvisor extends Advisor {
  trade(price?: number): Promise<TradeResponse> {
    throw new Error('Method not implemented.');
  }
  actionType: ActionType;
  profitResults: number[];
  longQuantity: number;

  dcaDb: any; // get dca amounts per coin and CRUD trades
  telegramBot = new TelegramBot(ChatGroups.mainAccount);
  krakenExchange: any; // Kraken Service

  trades: any = [];

  constructor(public exchange: IExchangeService) {
    super(exchange);
  }

  async long(candle: Candle, amount?: number) {}
  async short(candle: Candle, half?: boolean) {}
  end(closingPrice: any) {
    console.log('Method not implemented.');
  }
  notifyTelegramBot(): void {
    this.telegramBot.sendMessage(this.message);
  }
  addProfitResults(lastSell: TradeResponse, lastBuy: TradeResponse) {
    console.log('Method not implemented.');
  }
  async doSetup(sendMessage: boolean) {
    const res = await ks.getTradeBalance('ZGBP');
    console.log(res);
  }
  protected setup() {
    throw new Error('Method not implemented.');
  }
}
