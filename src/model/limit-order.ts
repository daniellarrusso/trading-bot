export class LimitOrder {
  orderId: number;
  triggered: boolean;
  complete: boolean = false;
  marketSide: string;
  constructor(public price: number, public quantity: number, public side: string) {
    this.marketSide = this.side === 'buy' ? 'marketBuy' : 'marketSell';
  }
}
