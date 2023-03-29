import { Candle } from './candle';
import { ActionType } from './enums';

export class TradeResponse {
  price: string;
  private _quotePrice: number;
  cummulativeQuoteQty: string;
  clientOrderId: string;
  tradeId: number;
  executedQty: string; // asset Amount
  orderId: number;
  origQty: string; // asset Amount (original)
  side: string; // BUY | SELL
  status: string; // FILLED | ??
  symbol: string;
  type: string;
  constructor(public candle: Candle, side: string, quotePrice?: number) {
    this.tradeId = this.candle?.time.getTime() ?? 0;
    this.quotePrice = quotePrice;
    this.side = side.toUpperCase();
    this.symbol = candle.pair;
  }

  get quotePrice() {
    if (this.type === 'MARKET') return +this.cummulativeQuoteQty;
    return this._quotePrice;
  }
  set quotePrice(val: number) {
    this._quotePrice = val;
  }
}
