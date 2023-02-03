import { ActionType } from './enums';

export class TradeResponse {
  orderId: number;
  origQty: string;
  side: string;
  status: string;
  constructor(
    public price: number,
    public symbol: string,
    public cummulativeQuoteQty: string,
    public action: ActionType
  ) {
    action === ActionType.Long ? (this.side = 'BUY') : (this.side = 'SELL');
  }
}
