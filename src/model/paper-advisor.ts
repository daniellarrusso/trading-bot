import { TradeResponse } from './trade-response';
import { TelegramBot } from './telegram-bot';
import { ChatGroups, Settings } from '../../settings';
import { Advisor } from './advisor';
import { Side } from './literals';
import { IExchangeService } from '../services/IExchange-service';
import { ActionType } from './enums';

export class PaperAdvisor extends Advisor {
  assetAmount = 0;
  currencyAmount = 10000;
  profitResults = [];
  telegram: TelegramBot;
  longQuantity: number;

  constructor(public exchange: IExchangeService) {
    super(exchange);
    this.telegram = new TelegramBot(ChatGroups.mainAccount);
  }
  notifyTelegramBot(message: string): void {
    this.telegram.sendMessage(message);
  }
  trade(price?: number, side?: Side): Promise<TradeResponse> {
    const { candle, pair, action } = this.exchange.ticker;
    if (!side) side = action === ActionType.Long ? 'buy' : 'sell';
    const trade: TradeResponse = new TradeResponse(candle, side, price || candle.close);
    return Promise.resolve(trade);
  }

  setup() {
    return new Promise((resolve, reject) => {
      console.log('Paper Trading Setup');
      resolve(1);
    });
  }

  addProfitResults(lastSell: number, lastBuy: TradeResponse) {
    const amount = ((lastSell - lastBuy.quotePrice) / lastBuy.quotePrice) * 100;
    if (amount) this.profitResults.push(+amount.toFixed(2));
  }

  end(closingPrice: any) {
    throw new Error('Method not implemented.');
  }
}
