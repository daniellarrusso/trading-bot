import { TradeResponse } from './trade-response';
import { TelegramBot } from './telegram-bot';
import { ChatGroups, Settings } from '../../settings';
import { Advisor } from './advisor';
import { Strategy } from './strategy';
import { Side } from './literals';
import { IExchangeService } from '../services/IExchange-service';

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
    const trade: TradeResponse = new TradeResponse(
      price || candle.close,
      pair,
      Settings.usdAmount.toString(),
      action
    );
    return Promise.resolve(trade);
  }

  setup() {
    return new Promise((resolve, reject) => {
      console.log('Paper Trading Setup');
      resolve(1);
    });
  }

  addProfitResults(lastSell, lastBuy) {
    const amount = ((lastSell.close - lastBuy.close) / lastBuy.close) * 100;
    this.profitResults.push(amount);
  }

  end(closingPrice: any) {
    throw new Error('Method not implemented.');
  }
}
