import { ordertypes, Side } from './literals';
import { Ticker } from './ticker';

export type BaseOrder = {
  pair: string;
  type: Side;
  price: number;
  ordertype: ordertypes;
  volume: number;
};
