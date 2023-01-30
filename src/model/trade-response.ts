export class TradeResponse {
  orderId: number;
  symbol: string;
  origQty: string;
  side: string;
  cummulativeQuoteQty: string;
  status: string;
  constructor(public price: number) {}
}
