import { Candle } from './candle';

export class TradeResponse {
  quotePrice: number;
  symbol: string;
  orderId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  type: string;
  side: string;
  fills: [];
  constructor(res: TradeResponse, public candle: Candle) {
    Object.assign(this, res);
    this.assignQuoteQtyAndPrice();
  }
  /**
   * Binance Market orders do not have a price and limit orders do not have a cummulative quantity bought
   */
  private assignQuoteQtyAndPrice() {
    if (this.type === 'MARKET') this.quotePrice = +this.cummulativeQuoteQty / +this.origQty;
    else {
      this.quotePrice = +this.price;
      this.cummulativeQuoteQty = (+this.origQty * +this.price).toString();
    }
  }
}
