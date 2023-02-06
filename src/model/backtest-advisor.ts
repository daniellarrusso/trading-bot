import { Candle } from './candle';
import { TradeResponse } from './trade-response';
import { Advisor } from './advisor';
import { ActionType } from './enums';
import { Settings } from '../../keys';

export class BacktestAdvisor extends Advisor {
  assetAmount = 0;
  currencyAmount = 1000;
  profitResults = [];

  trade(price?: number) {
    const { candle, pair, action } = this.exchange.ticker;
    const trade: TradeResponse = new TradeResponse(
      price || candle.close,
      pair,
      Settings.usdAmount.toString(),
      action
    );
    return Promise.resolve(trade);
  }

  long(candle: Candle) {
    return Promise.resolve({});
  }

  short(candle: Candle) {
    return Promise.resolve({});
  }

  addProfitResults(lastSell, lastBuy) {
    const amount = ((lastSell.close - lastBuy.close) / lastBuy.close) * 100;
    this.profitResults.push(amount);
  }

  end(prices) {
    if (prices.lastBuyPrice) {
      this.addProfitResults({ close: prices?.closingPrice }, prices.lastBuyPrice);
    }
    if (this.profitResults.length > 0) {
      const finalResult = this.profitResults.reduce((p, c) => p + c, 0);
      console.log('Profit from Backtest: ' + finalResult);
    }

    console.log(
      'Market Rise/Fall: ' + ((prices.closingPrice - prices.startingPrice) / prices.startingPrice) * 100
    );
    this.profitResults.length = 0;
    this.currencyAmount = !this.currencyAmount ? this.assetAmount * prices.closingPrice : this.currencyAmount;
    this.assetAmount = !this.assetAmount ? this.currencyAmount / prices.closingPrice : this.assetAmount;
    console.log(
      `USDT Profit: ${this.currencyAmount}, Asset Profit: ${this.currencyAmount / prices.closingPrice}`
    );
  }

  setup() {
    console.log('No setup required');
  }

  notifyTelegramBot() {}
}
