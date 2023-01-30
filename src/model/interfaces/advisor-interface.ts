import { Candle } from '../candle';

export interface IAdvisor {
  profitResults: [];
  long(candle: Candle, amount?: number);
  short(candle: Candle);
  end(closingPrice: any);
  notifyTelegramBot(message): void;
  addProfitResults(lastSell: Candle, lastBuy: Candle);
  setup();
}
