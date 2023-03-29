import { TradeResponse } from './trade-response';
import { Advisor } from './advisor';
import { Settings } from '../../settings';
import { Side } from './literals';
import { ActionType } from './enums';

export class BacktestAdvisor extends Advisor {
  assetAmount = 0;
  currencyAmount = 1000;
  profitResults = [];

  trade(price?: number, side?: Side) {
    const { candle, pair, action } = this.exchange.ticker;
    if (!side) side = action === ActionType.Long ? 'buy' : 'sell';
    const trade: TradeResponse = new TradeResponse(candle, side, price || candle.close);
    return Promise.resolve(trade);
  }

  addProfitResults(closingPrice: number, lastBuy: TradeResponse) {
    const amount = ((closingPrice - lastBuy.quotePrice) / lastBuy.quotePrice) * 100;
    if (amount) this.profitResults.push(+amount.toFixed(2));
  }

  end(prices) {
    if (prices.lastBuyPrice) {
      this.addProfitResults(prices.closingPrice, prices.lastBuyPrice);
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
