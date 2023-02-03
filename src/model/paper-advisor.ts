import { Candle } from './candle';
import { TradeResponse } from './trade-response';
import { TelegramBot } from './telegram-bot';
import { ChatGroups, Settings } from '../../keys';
import { Advisor } from './advisor';
import { Strategy } from './strategy';
import { ActionType } from './enums';

export class PaperAdvisor extends Advisor {
  assetAmount = 0;
  currencyAmount = 10000;
  profitResults = [];
  telegram: TelegramBot;
  longQuantity: number;

  constructor(public strategy: Strategy) {
    super(strategy.exchange);
    this.telegram = new TelegramBot(ChatGroups.mainAccount);
  }
  notifyTelegramBot(message: string): void {
    this.telegram.sendMessage(message);
  }
  trade(price?: number): Promise<TradeResponse> {
    throw new Error('Method not implemented.');
  }

  setup() {
    return new Promise((resolve, reject) => {
      console.log('Paper Trading Setup');
      resolve(1);
    });
  }

  async long(candle: Candle) {
    const side = candle.close === ActionType.Short ? 'SELL' : 'BUY';
    const trade: TradeResponse = new TradeResponse(
      candle.close,
      candle.pair,
      this.calculateQuantity(candle.close || candle.close, side),
      candle.close
    );
    let quantity = 0;
    if (this.exchange.ticker.currency === 'BTC') {
      let perBTC = 1 / candle.close;
      try {
        let usdAmount = await this.exchange.getPrice();
        quantity = Settings.usdAmount / Settings.tickers / (usdAmount.BTCUSDT / perBTC);
      } catch (error) {
        console.log(error);
      }
    } else {
      quantity = Settings.usdAmount / Settings.tickers / candle.close;
    }
    console.log('Quantity Bought: ' + quantity);
    this.longQuantity = quantity;
    return Promise.resolve(trade);
  }

  short(candle: Candle) {
    const side = candle.close === ActionType.Short ? 'SELL' : 'BUY';
    const trade: TradeResponse = new TradeResponse(
      candle.close,
      candle.pair,
      this.calculateQuantity(candle.close || candle.close, side),
      candle.close
    );
    console.log('Quantity sold: ' + this.longQuantity ? this.longQuantity : this.strategy.portfolio.total);
    return Promise.resolve(trade);
  }

  calculateQuantity(price: number, side: string): string {
    let quantity = 0;
    if (side === 'BUY') {
      quantity = this.currencyAmount / price;
      this.currencyAmount = 0;
    } else {
      quantity = this.assetAmount * price;
      this.assetAmount = 0;
    }
    return String(quantity);
  }

  addProfitResults(lastSell, lastBuy) {
    const amount = ((lastSell.close - lastBuy.close) / lastBuy.close) * 100;
    this.profitResults.push(amount);
  }

  end(closingPrice: any) {
    throw new Error('Method not implemented.');
  }
}
