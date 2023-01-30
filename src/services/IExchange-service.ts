import { Candle } from '../model/candle';
import { IOrder, LimitOrder } from '../model/limit-order';
import { Side } from '../model/literals';
import { Ticker } from '../model/ticker';
import { TradeResponse } from '../model/trade-response';

export interface IExchangeService {
  ticker: Ticker;
  exchange: any;

  getExchangeInfo();
  // Candle
  getOHLCLatest(ticker: Ticker, cb: any): void;
  getOHLCHistoryByPair(pair: string, interval: string): Promise<Candle[]>;

  // orders
  getOrders(pair: string): Promise<any[]>;
  checkOrderStatus(orderId: any);
  placeLimitOrder(side: Side, quantity: number, price: number);
  placeStopLimitOrder(side: Side, quantity: number, price: number, stopPrice: number);
  placeMarketOrder(side: Side, quantity: number);
  getPrice();

  cancelOrder(orderId: any);
}
