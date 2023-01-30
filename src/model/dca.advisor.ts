import { ChatGroups } from '../../keys';
import { KrakenService } from '../services/kraken-service';
import { Advisor } from './advisor';
import { Candle } from './candle';
import { ActionType } from './enums';
import { Strategy } from './strategy';
import { TelegramBot } from './telegram-bot';

const ks = new KrakenService();

export class DCAAdvisor extends Advisor {
  actionType: ActionType;
  profitResults: number[];
  longQuantity: number;

  dcaDb: any; // get dca amounts per coin and CRUD trades
  telegramBot = new TelegramBot(ChatGroups.mainAccount);
  exchange: any; // Kraken Service

  trades: any = [];

  constructor(public strategy: Strategy) {
    super(strategy.exchange);
  }

  async long(candle: Candle, amount?: number) { }
  async short(candle: Candle, half?: boolean) { }
  end(closingPrice: any) {
    console.log('Method not implemented.');
  }
  notifyTelegramBot(): void {
    this.telegramBot.sendMessage(this.message);
  }
  addProfitResults(lastSell: Candle, lastBuy: Candle) {
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
