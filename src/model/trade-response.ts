import { Candle } from './candle';
import { ActionType } from './enums';

export class TradeResponse {
  clientOrderId: string;
  tradeId: number;
  executedQty: string; // asset Amount
  orderId: number;
  origQty: string; // asset Amount (original)
  side: string; // BUY | SELL
  status: string; // FILLED | ??
  constructor(
    public price: number, // get from ticker
    public symbol: string, // get from ticker
    public cummulativeQuoteQty: string, // currency amount
    public action: ActionType,
    public candle: Candle
  ) {
    action === ActionType.Long ? (this.side = 'BUY') : (this.side = 'SELL');
    this.tradeId = this.candle.time.getTime();
  }
}
