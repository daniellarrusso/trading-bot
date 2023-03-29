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
  tradeId = -1;
  constructor(res: TradeResponse, public candle: Candle) {
    if (res.type === 'MARKET') this.quotePrice = +res.cummulativeQuoteQty / +res.origQty;
    else this.quotePrice = +res.price;
    this.tradeId = this.candle.time.getTime();
    Object.assign(this, res);
  }
}
