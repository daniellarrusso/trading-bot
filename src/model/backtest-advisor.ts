import { Candle } from './candle';
import { TradeResponse } from './trade-response';
import { Advisor } from './advisor';

export class BacktestAdvisor extends Advisor {
  assetAmount = 0;
  currencyAmount = 8000;
  profitResults = [];

  long(candle: Candle) {
    // buy with btc
    const trade: TradeResponse = new TradeResponse(candle.close); // spoofed trade
    trade.symbol = candle.pair;
    trade.side = 'BUY';
    trade.cummulativeQuoteQty = '' + this.calculateQuantity(candle.close, trade.side);
    trade.price = candle.close;
    return Promise.resolve(trade);
  }

  short(candle: Candle) {
    const trade: TradeResponse = new TradeResponse(candle.close); // spoofed trade
    trade.cummulativeQuoteQty = '' + this.assetAmount;
    trade.symbol = candle.pair;
    trade.side = 'SELL';
    trade.cummulativeQuoteQty = '' + this.calculateQuantity(candle.close, trade.side);
    return Promise.resolve(trade);
  }

  calculateQuantity(price: number, side: string): string {
    let quantity = 0;
    if (side === 'BUY') {
      quantity = this.currencyAmount / price;
      this.assetAmount = quantity;
      this.currencyAmount = 0;
    } else {
      quantity = this.assetAmount * price;
      this.currencyAmount = quantity;
      this.assetAmount = 0;
    }

    return String(quantity);
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

    console.log('Market Rise/Fall: ' + ((prices.closingPrice - prices.startingPrice) / prices.startingPrice) * 100);
    this.profitResults.length = 0;
    this.currencyAmount = !this.currencyAmount ? this.assetAmount * prices.closingPrice : this.currencyAmount;
    this.assetAmount = !this.assetAmount ? this.currencyAmount / prices.closingPrice : this.assetAmount;
    console.log(`USDT Profit: ${this.currencyAmount}, Asset Profit: ${this.currencyAmount / prices.closingPrice}`);
  }

  setup() {
    console.log('No setup required');
  }

  notifyTelegramBot() {}
}
