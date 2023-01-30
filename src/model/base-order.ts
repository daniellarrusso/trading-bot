import { ordertypes, Side } from './literals';
import { Ticker } from './ticker';

export type BaseOrder = {
    pair: string,
    type: Side,
    price: number;
    ordertype: ordertypes,
    volume: number
}

export function createOrder(side: Side, volume: number, price: number, ordertype: ordertypes = 'limit', ticker: Ticker): BaseOrder {
    const { pair } = ticker;
    volume /= price;
    if (ordertype === 'limit')
        return {
            pair: pair,
            type: side,
            ordertype,
            price: +price.toFixed(),
            volume: +volume.toFixed()
        }
}