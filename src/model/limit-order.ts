export class LimitOrder {
  orderId: number;
  triggered: boolean;
  complete: boolean = false;
  constructor(public price: any, public quantity: number, public side: string) {}
}
