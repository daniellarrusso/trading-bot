import { Subject } from './subject';

export class LimitOrder {
    orderId: number;
    triggered: boolean;
    complete: boolean = false;
    marketSide: string;
    constructor(public price: number, public quantity: number, public side: string) {
        this.marketSide = this.side === 'buy' ? 'marketBuy' : 'marketSell';
    }
}

export class OrderSubject extends Subject {
    orderId: string;
    status: string;
}
